import { db } from '../db/cliente.ts';

export interface NuevoReporte {
  lugar_id: string;
  tipo: 'precio' | 'horario' | 'cerrado' | 'ubicacion' | 'otro';
  comentario?: string;
}

export async function crearReporte(r: NuevoReporte): Promise<{ id: string }> {
  const { data, error } = await db()
    .from('reportes')
    .insert({ lugar_id: r.lugar_id, tipo: r.tipo, comentario: r.comentario ?? null })
    .select('id')
    .single();
  if (error) throw new Error(`crearReporte: ${error.message}`);
  return { id: data.id as string };
}
