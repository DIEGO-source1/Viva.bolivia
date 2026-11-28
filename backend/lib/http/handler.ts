import { z } from 'zod';
import { corsHeaders, error, ErrorHttp, manejarError } from './respuestas';

type Metodo = 'GET' | 'POST';

/**
 * Envuelve un endpoint: maneja CORS,
 * valida el método y captura errores.
 */
export function crearHandler(
  metodo: Metodo,
  fn: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: corsHeaders()
      });
    }

    if (req.method !== metodo) {
      return error('Método no permitido', 405);
    }

    try {
      return await fn(req);
    } catch (e) {
      return manejarError(e);
    }
  };
}

/**
 * Lee el JSON y valida los datos usando Zod 4.
 */
export async function leerJson<T>(
  req: Request,
  esquema: z.ZodType<T>
): Promise<T> {
  let cuerpo: unknown;

  try {
    cuerpo = await req.json();
  } catch {
    throw new ErrorHttp(400, 'El cuerpo debe ser JSON válido');
  }

  const resultado = esquema.safeParse(cuerpo);

  if (!resultado.success) {
    throw new ErrorHttp(
      400,
      'Datos inválidos',
      resultado.error.flatten()
    );
  }

  return resultado.data;
}