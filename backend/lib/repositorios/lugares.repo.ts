import { consulta, type Fila } from '../db/cliente';
import type { LugarCandidato, TipoLugar } from '../dominio/tipos';

export interface FiltrosBusqueda {
  presupuesto: number;
  tipos: TipoLugar[];
  zona: string | null;
  hora: string | null; // 'HH:mm' o null
  texto: string; // preferencias del usuario, para la búsqueda de texto
  limite?: number;
}

/**
 * Candidatos reales del catálogo: filtros SQL + orden por relevancia
 * (búsqueda de texto completo de Postgres en español).
 */
export async function buscarLugares(f: FiltrosBusqueda): Promise<LugarCandidato[]> {
  const filas = await consulta(
    'select * from buscar_lugares($1, $2, $3, $4, $5, $6)',
    [
      f.presupuesto,
      f.tipos.length ? f.tipos : null,
      f.zona,
      f.hora,
      aConsultaTexto(f.texto),
      f.limite ?? 40,
    ],
  );
  const candidatos = filas.map(normalizar);

  // La relevancia de Postgres (ts_rank) es pequeña; se escala a 0..1
  // dividiendo por la más alta, para que el planificador la pese bien.
  const maxima = Math.max(0, ...candidatos.map((c) => c.similitud));
  if (maxima > 0) for (const c of candidatos) c.similitud = c.similitud / maxima;
  return candidatos;
}

/**
 * Convierte "comida tradicional picante" en "comida | tradicional | picante":
 * basta con que coincida UNA palabra. Solo deja letras, así nadie puede
 * inyectar sintaxis de búsqueda.
 */
export function aConsultaTexto(texto: string): string | null {
  const palabras = texto
    .toLowerCase()
    .normalize('NFC')
    .split(/[^a-záéíóúüñ]+/i)
    .filter((p) => p.length > 2)
    .slice(0, 12);
  return palabras.length ? [...new Set(palabras)].join(' | ') : null;
}

/** Catálogo completo para el mapa y el modo offline. */
export async function listarCatalogo() {
  const [lugares, platos, lugar_plato] = await Promise.all([
    consulta(
      `select id, nombre, tipo, zona, descripcion, descripcion_en, lat, lng,
              precio_min::float8 as precio_min, precio_max::float8 as precio_max,
              duracion_min, to_char(hora_apertura, 'HH24:MI') as hora_apertura,
              to_char(hora_cierre, 'HH24:MI') as hora_cierre,
              fuente, fecha_verificacion, verificado
       from lugares where activo order by nombre`,
    ),
    consulta(
      `select id, nombre, nombre_en, descripcion, descripcion_en, ingredientes, historia, fuente
       from platos order by nombre`,
    ),
    consulta(`select lugar_id, plato_id, precio::float8 as precio from lugar_plato`),
  ]);
  return { lugares, platos, lugar_plato };
}

export async function existeLugar(id: string): Promise<boolean> {
  const filas = await consulta('select 1 from lugares where id = $1 and activo', [id]);
  return filas.length > 0;
}

// Los numeric de Postgres llegan como texto: se normalizan aquí.
function normalizar(fila: Fila): LugarCandidato {
  return {
    id: String(fila.id),
    nombre: String(fila.nombre),
    tipo: fila.tipo as TipoLugar,
    zona: (fila.zona as string) ?? null,
    descripcion: (fila.descripcion as string) ?? null,
    descripcion_en: (fila.descripcion_en as string) ?? null,
    lat: Number(fila.lat),
    lng: Number(fila.lng),
    precio_min: Number(fila.precio_min),
    precio_max: Number(fila.precio_max),
    duracion_min: Number(fila.duracion_min),
    verificado: Boolean(fila.verificado),
    fecha_verificacion: fila.fecha_verificacion ? String(fila.fecha_verificacion) : null,
    fuente: String(fila.fuente ?? ''),
    similitud: Number(fila.relevancia ?? 0),
  };
}
