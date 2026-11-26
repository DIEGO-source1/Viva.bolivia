import { db } from '../db/cliente.ts';
import type { Tokens } from '../ia/cliente-ia.ts';
import { PROMPT_VERSION } from '../ia/prompts.ts';

export interface RegistroUso {
  tipo: 'ruta_ia' | 'ruta_sin_ia' | 'escaner';
  estado: string;
  intencion?: unknown;
  lugares_ids?: string[];
  costo_max?: number;
  minutos_total?: number;
  ms: number;
  tokens?: Tokens;
  fallo_ia?: boolean;
  texto_fuente?: 'ia' | 'plantilla';
}

/**
 * Guarda métricas de uso SIN datos personales (no se guarda el texto
 * original del usuario ni su ubicación). Nunca rompe la respuesta:
 * si falla, solo se registra en consola.
 */
export async function guardarRegistro(r: RegistroUso): Promise<void> {
  try {
    const { error } = await db().from('rutas_log').insert({
      tipo: r.tipo,
      estado: r.estado,
      intencion: r.intencion ?? null,
      lugares_ids: r.lugares_ids ?? [],
      costo_max: r.costo_max ?? null,
      minutos_total: r.minutos_total ?? null,
      ms: Math.round(r.ms),
      tokens_entrada: r.tokens?.entrada ?? 0,
      tokens_salida: r.tokens?.salida ?? 0,
      fallo_ia: r.fallo_ia ?? false,
      texto_fuente: r.texto_fuente ?? null,
      prompt_version: r.tipo === 'ruta_sin_ia' ? null : PROMPT_VERSION,
    });
    if (error) console.error('[log] no se pudo guardar:', error.message);
  } catch (e) {
    console.error('[log] no se pudo guardar:', e);
  }
}
