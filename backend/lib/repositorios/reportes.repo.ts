import { consulta } from '../db/cliente';

export interface NuevoReporte {
  lugar_id: string;
  tipo: 'precio' | 'horario' | 'cerrado' | 'ubicacion' | 'otro';
  comentario?: string;
}

export async function crearReporte(r: NuevoReporte): Promise<{ id: string }> {
  const [fila] = await consulta<{ id: string }>(
    'insert into reportes (lugar_id, tipo, comentario) values ($1, $2, $3) returning id',
    [r.lugar_id, r.tipo, r.comentario ?? null],
  );
  return { id: fila.id };
}
