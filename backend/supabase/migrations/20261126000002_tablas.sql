-- =========================================================
-- Catálogo: lugares, platos y su relación
-- =========================================================

create table public.lugares (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  tipo                text not null check (tipo in ('comida','mercado','mirador','cultura','naturaleza','otro')),
  zona                text,
  descripcion         text,
  descripcion_en      text,
  lat                 double precision not null,
  lng                 double precision not null,
  precio_min          numeric(10,2) not null default 0 check (precio_min >= 0),
  precio_max          numeric(10,2) not null default 0 check (precio_max >= precio_min),
  duracion_min        integer not null default 30 check (duracion_min > 0),
  hora_apertura       time,
  hora_cierre         time,
  -- Transparencia de datos (criterio E)
  fuente              text not null,
  fecha_verificacion  date,
  verificado          boolean not null default false,
  activo              boolean not null default true,
  -- RAG: embedding de 384 dimensiones (modelo gte-small de Supabase)
  embedding           extensions.vector(384),
  creado_en           timestamptz not null default now()
);

create index lugares_tipo_idx on public.lugares (tipo) where activo;
create index lugares_embedding_idx on public.lugares
  using hnsw (embedding extensions.vector_cosine_ops);

create table public.platos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null unique,
  nombre_en       text,
  descripcion     text not null,
  descripcion_en  text,
  ingredientes    text[] not null default '{}',
  historia        text,
  fuente          text not null,
  creado_en       timestamptz not null default now()
);

create table public.lugar_plato (
  lugar_id  uuid not null references public.lugares(id) on delete cascade,
  plato_id  uuid not null references public.platos(id) on delete cascade,
  precio    numeric(10,2) check (precio >= 0),
  primary key (lugar_id, plato_id)
);

-- =========================================================
-- Registros de uso (métricas y costos) - SIN datos personales
-- =========================================================

create table public.rutas_log (
  id                uuid primary key default gen_random_uuid(),
  tipo              text not null check (tipo in ('ruta_ia','ruta_sin_ia','escaner')),
  estado            text not null,
  intencion         jsonb,
  lugares_ids       uuid[] not null default '{}',
  costo_max         numeric(10,2),
  minutos_total     integer,
  ms                integer not null,
  tokens_entrada    integer not null default 0,
  tokens_salida     integer not null default 0,
  fallo_ia          boolean not null default false,
  texto_fuente      text check (texto_fuente in ('ia','plantilla')),
  prompt_version    text,
  creado_en         timestamptz not null default now()
);

create index rutas_log_creado_idx on public.rutas_log (creado_en desc);

-- =========================================================
-- Reportes de usuarios (supervisión humana, criterio E)
-- =========================================================

create table public.reportes (
  id          uuid primary key default gen_random_uuid(),
  lugar_id    uuid not null references public.lugares(id) on delete cascade,
  tipo        text not null check (tipo in ('precio','horario','cerrado','ubicacion','otro')),
  comentario  text check (char_length(comentario) <= 500),
  estado      text not null default 'pendiente' check (estado in ('pendiente','revisado','descartado')),
  creado_en   timestamptz not null default now()
);

-- =========================================================
-- Seguridad (RLS)
-- El frontend solo puede LEER el catálogo.
-- Todo lo demás pasa por las Edge Functions (service role).
-- =========================================================

alter table public.lugares     enable row level security;
alter table public.platos      enable row level security;
alter table public.lugar_plato enable row level security;
alter table public.rutas_log   enable row level security;
alter table public.reportes    enable row level security;

create policy "lectura publica de lugares activos"
  on public.lugares for select using (activo);

create policy "lectura publica de platos"
  on public.platos for select using (true);

create policy "lectura publica de lugar_plato"
  on public.lugar_plato for select using (true);

-- rutas_log y reportes: sin políticas públicas => solo el backend accede.
