-- Migración ADITIVA: identidad, favoritos y rutas guardadas.
-- No altera ni elimina lugares, platos, lugar_plato, reportes ni rutas_log.
begin;

create table if not exists public.schema_migrations (
  version text primary key,
  description text not null,
  applied_at timestamptz not null default now()
);

alter table public.lugares
  add column if not exists departamento text,
  add column if not exists imagen_url text,
  add column if not exists galeria_urls text[] not null default '{}';

alter table public.platos
  add column if not exists imagen_url text;

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nombre text not null check (char_length(nombre) between 2 and 100),
  password_hash text not null,
  rol text not null default 'visitante' check (rol in ('admin','visitante')),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists usuarios_email_lower_uq
  on public.usuarios (lower(email));
create unique index if not exists usuarios_un_solo_admin_uq
  on public.usuarios (rol) where rol = 'admin';

create table if not exists public.sesiones_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revocada_en timestamptz,
  creado_en timestamptz not null default now()
);
create index if not exists sesiones_usuario_usuario_idx
  on public.sesiones_usuario(usuario_id);
create index if not exists sesiones_usuario_expira_idx
  on public.sesiones_usuario(expires_at);

create table if not exists public.favoritos (
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  lugar_id uuid not null references public.lugares(id) on delete cascade,
  creado_en timestamptz not null default now(),
  primary key (usuario_id, lugar_id)
);
create index if not exists favoritos_lugar_idx on public.favoritos(lugar_id);

create table if not exists public.rutas_guardadas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 2 and 120),
  parametros jsonb not null default '{}'::jsonb,
  resultado jsonb not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index if not exists rutas_guardadas_usuario_idx
  on public.rutas_guardadas(usuario_id, creado_en desc);

insert into public.schema_migrations(version, description)
values ('0003_usuarios_favoritos_rutas', 'Usuarios, sesiones, favoritos y rutas guardadas')
on conflict (version) do nothing;

commit;
