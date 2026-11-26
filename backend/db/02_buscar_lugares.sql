-- =========================================================
-- 02 · Búsqueda de candidatos
-- Filtros duros (SQL) + relevancia por texto (ts_rank).
-- La IA nunca elige fuera de lo que devuelve esta función.
-- =========================================================

create or replace function buscar_lugares(
  p_presupuesto  numeric,
  p_tipos        text[]  default null,
  p_zona         text    default null,
  p_hora         time    default null,
  p_consulta     text    default null,  -- ej. 'silpancho | picante' (lo arma el backend)
  p_limite       integer default 40
)
returns table (
  id                  uuid,
  nombre              text,
  tipo                text,
  zona                text,
  descripcion         text,
  descripcion_en      text,
  lat                 double precision,
  lng                 double precision,
  precio_min          numeric,
  precio_max          numeric,
  duracion_min        integer,
  verificado          boolean,
  fecha_verificacion  date,
  fuente              text,
  relevancia          real
)
language sql
stable
as $$
  with q as (
    select case when p_consulta is null or p_consulta = '' then null
                else to_tsquery('spanish', p_consulta) end as consulta
  )
  select
    l.id, l.nombre, l.tipo, l.zona, l.descripcion, l.descripcion_en,
    l.lat, l.lng, l.precio_min, l.precio_max, l.duracion_min,
    l.verificado, l.fecha_verificacion, l.fuente,
    coalesce(ts_rank(l.busqueda, q.consulta), 0)::real as relevancia
  from lugares l, q
  where l.activo
    and l.precio_max <= p_presupuesto  -- conservador: igual que el planificador
    and (p_tipos is null or cardinality(p_tipos) = 0 or l.tipo = any(p_tipos))
    and (p_zona is null or l.zona ilike '%' || p_zona || '%')
    and (
      p_hora is null
      or l.hora_apertura is null
      or l.hora_cierre is null
      or p_hora between l.hora_apertura and l.hora_cierre
    )
  order by relevancia desc, l.verificado desc, l.precio_min asc
  limit greatest(1, least(p_limite, 100));
$$;
