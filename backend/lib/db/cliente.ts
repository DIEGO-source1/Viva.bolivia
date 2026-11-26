import { neon } from '@neondatabase/serverless';
import { env } from '../config/env';

export type Fila = Record<string, unknown>;
type Ejecutor = (texto: string, parametros: unknown[]) => Promise<Fila[]>;

let ejecutor: Ejecutor | null = null;

/**
 * Ejecuta SQL parametrizado ($1, $2...) contra Neon por HTTP.
 * Nunca concatenes datos del usuario en el texto: usa parámetros.
 */
export async function consulta<T = Fila>(texto: string, parametros: unknown[] = []): Promise<T[]> {
  if (!ejecutor) {
    const sql = neon(env.databaseUrl);
    ejecutor = (t, p) => sql.query(t, p) as Promise<Fila[]>;
  }
  return (await ejecutor(texto, parametros)) as T[];
}

/** Solo para pruebas: permite usar otra conexión (por ejemplo, Postgres local). */
export function usarEjecutor(e: Ejecutor) {
  ejecutor = e;
}
