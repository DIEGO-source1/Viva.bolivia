import { z } from '../deps.ts';
import { corsHeaders, error, ErrorHttp, manejarError } from './respuestas.ts';

type Metodo = 'GET' | 'POST';

/**
 * Envuelve un endpoint: maneja CORS, valida el método y captura errores.
 * Así cada index.ts queda en pocas líneas.
 */
export function crearHandler(metodo: Metodo, fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });
    if (req.method !== metodo) return error('Método no permitido', 405);
    try {
      return await fn(req);
    } catch (e) {
      return manejarError(e);
    }
  };
}

/** Lee el cuerpo JSON y lo valida con un esquema Zod. */
export async function leerJson<T>(req: Request, esquema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    throw new ErrorHttp(400, 'El cuerpo debe ser JSON válido');
  }
  const resultado = esquema.safeParse(cuerpo);
  if (!resultado.success) {
    throw new ErrorHttp(400, 'Datos inválidos', resultado.error.flatten());
  }
  return resultado.data;
}
