import { env } from '../config/env';

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': env.corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key, x-admin-bootstrap-secret',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };
}

/** Error con código HTTP que el handler convierte en respuesta. */
export class ErrorHttp extends Error {
  constructor(
    public status: number,
    mensaje: string,
    public detalle?: unknown,
  ) {
    super(mensaje);
  }
}

function json(cuerpo: unknown, status: number): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8' },
  });
}

/** Formato único de éxito: { ok: true, datos } */
export function ok(datos: unknown, status = 200): Response {
  return json({ ok: true, datos }, status);
}

/** Formato único de error: { ok: false, error, detalle? } */
export function error(mensaje: string, status = 400, detalle?: unknown): Response {
  return json({ ok: false, error: mensaje, detalle }, status);
}

export function manejarError(e: unknown): Response {
  if (e instanceof ErrorHttp) return error(e.message, e.status, e.detalle);
  console.error('[error no controlado]', e);
  return error('Error interno del servidor', 500);
}
