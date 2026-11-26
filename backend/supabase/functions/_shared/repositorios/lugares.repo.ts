import { db } from '../db/cliente.ts';
import type { LugarCandidato, TipoLugar } from '../dominio/tipos.ts';

export interface FiltrosBusqueda {
  presupuesto: number;
  tipos: TipoLugar[];
  zona: string | null;
  hora: string | null; // 'HH:mm' o null
  embedding: number[] | null;
  limite?: number;
}

/** Candidatos reales del catálogo: filtros SQL + orden por similitud. */
export async function buscarLugares(f: FiltrosBusqueda): Promise<LugarCandidato[]> {
  const { data, error } = await db().rpc('buscar_lugares', {
    p_presupuesto: f.presupuesto,
    p_tipos: f.tipos.length ? f.tipos : null,
    p_zona: f.zona,
    p_hora: f.hora,
    p_embedding: f.embedding ? JSON.stringify(f.embedding) : null,
    p_limite: f.limite ?? 40,
  });
  if (error) throw new Error(`buscar_lugares: ${error.message}`);
  return (data ?? []).map(normalizar);
}

/** Catálogo completo para el mapa y el modo offline (sin embeddings). */
export async function listarCatalogo() {
  const columnas =
    'id, nombre, tipo, zona, descripcion, descripcion_en, lat, lng, precio_min, precio_max, duracion_min, hora_apertura, hora_cierre, fuente, fecha_verificacion, verificado';

  const [lugares, platos, relaciones] = await Promise.all([
    db().from('lugares').select(columnas).eq('activo', true).order('nombre'),
    db().from('platos').select('id, nombre, nombre_en, descripcion, descripcion_en, ingredientes, historia, fuente').order('nombre'),
    db().from('lugar_plato').select('lugar_id, plato_id, precio'),
  ]);

  for (const r of [lugares, platos, relaciones]) {
    if (r.error) throw new Error(`listarCatalogo: ${r.error.message}`);
  }
  return {
    lugares: lugares.data ?? [],
    platos: platos.data ?? [],
    lugar_plato: relaciones.data ?? [],
  };
}

export async function lugaresSinEmbedding(limite = 50) {
  const { data, error } = await db()
    .from('lugares')
    .select('id, nombre, tipo, zona, descripcion, lugar_plato(platos(nombre))')
    .is('embedding', null)
    .limit(limite);
  if (error) throw new Error(`lugaresSinEmbedding: ${error.message}`);
  return data ?? [];
}

export async function guardarEmbedding(id: string, embedding: number[]) {
  const { error } = await db()
    .from('lugares')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', id);
  if (error) throw new Error(`guardarEmbedding: ${error.message}`);
}

export async function existeLugar(id: string): Promise<boolean> {
  const { data, error } = await db().from('lugares').select('id').eq('id', id).maybeSingle();
  if (error) throw new Error(`existeLugar: ${error.message}`);
  return data !== null;
}

// PostgREST puede devolver numeric como string: se normaliza aquí.
function normalizar(fila: Record<string, unknown>): LugarCandidato {
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
    fecha_verificacion: (fila.fecha_verificacion as string) ?? null,
    fuente: String(fila.fuente ?? ''),
    similitud: Number(fila.similitud ?? 0),
  };
}
