-- =========================================================
-- 01 · Tablas (ejecutar primero en Neon Console → SQL Editor)
-- =========================================================

create table if not exists lugares (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  tipo                text not null check (tipo in ('comida','mercado','mirador','cultura','naturaleza','otro')),
  zona                text,
  descripcion         text,
  descripcion_en      text,
  -- Palabras clave para la búsqueda: platos, estilo, ambiente (ej. 'silpancho tradicional económico')
  etiquetas           text not null default '',
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
  -- Búsqueda de texto completo en español (se calcula sola)
  busqueda            tsvector generated always as (
                        setweight(to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(etiquetas, '')), 'A') ||
                        setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B') ||
                        setweight(to_tsvector('spanish', coalesce(tipo, '') || ' ' || coalesce(zona, '')), 'C')
                      ) stored,
  creado_en           timestamptz not null default now()
);

create index if not exists lugares_busqueda_idx on lugares using gin (busqueda);
create index if not exists lugares_tipo_idx on lugares (tipo) where activo;

create table if not exists platos (
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

create table if not exists lugar_plato (
  lugar_id  uuid not null references lugares(id) on delete cascade,
  plato_id  uuid not null references platos(id) on delete cascade,
  precio    numeric(10,2) check (precio >= 0),
  primary key (lugar_id, plato_id)
);

-- Registros de uso (métricas y costos) - SIN datos personales
create table if not exists rutas_log (
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

create index if not exists rutas_log_creado_idx on rutas_log (creado_en desc);

-- Reportes de usuarios (supervisión humana, criterio E)
create table if not exists reportes (
  id          uuid primary key default gen_random_uuid(),
  lugar_id    uuid not null references lugares(id) on delete cascade,
  tipo        text not null check (tipo in ('precio','horario','cerrado','ubicacion','otro')),
  comentario  text check (char_length(comentario) <= 500),
  estado      text not null default 'pendiente' check (estado in ('pendiente','revisado','descartado')),
  creado_en   timestamptz not null default now()
);
