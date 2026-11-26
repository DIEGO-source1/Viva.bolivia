import { consulta } from '../db/cliente';
import type { Tokens } from '../ia/cliente-ia';
import { PROMPT_VERSION } from '../ia/prompts';

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
    await consulta(
      `insert into rutas_log
         (tipo, estado, intencion, lugares_ids, costo_max, minutos_total, ms,
          tokens_entrada, tokens_salida, fallo_ia, texto_fuente, prompt_version)
       values ($1, $2, $3, $4::uuid[], $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        r.tipo,
        r.estado,
        r.intencion === undefined ? null : JSON.stringify(r.intencion),
        r.lugares_ids ?? [],
        r.costo_max ?? null,
        r.minutos_total ?? null,
        Math.round(r.ms),
        r.tokens?.entrada ?? 0,
        r.tokens?.salida ?? 0,
        r.fallo_ia ?? false,
        r.texto_fuente ?? null,
        r.tipo === 'ruta_sin_ia' ? null : PROMPT_VERSION,
      ],
    );
  } catch (e) {
    console.error('[log] no se pudo guardar:', e);
  }
}
