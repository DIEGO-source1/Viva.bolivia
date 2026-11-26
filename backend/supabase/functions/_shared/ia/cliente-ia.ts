import { env } from '../config/env.ts';

// Cliente mínimo para la API de Claude (Anthropic) usando "tool use"
// para forzar respuestas en JSON. Para cambiar de proveedor
// (Gemini, OpenAI...) solo se reescribe este archivo.

const URL_API = 'https://api.anthropic.com/v1/messages';
const VERSION_API = '2023-06-01';

export interface Herramienta {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export type BloqueContenido =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

export interface Tokens {
  entrada: number;
  salida: number;
}

export interface ResultadoIA {
  datos: unknown;
  tokens: Tokens;
}

export class ErrorIA extends Error {}

interface OpcionesLlamada {
  sistema: string;
  contenido: BloqueContenido[];
  herramienta: Herramienta;
  modelo?: string;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Llama al modelo obligándolo a usar una herramienta (respuesta JSON).
 * - Timeout para que la app no se quede colgada.
 * - 1 reintento ante errores temporales (429, 5xx, red).
 */
export async function llamarHerramienta(op: OpcionesLlamada): Promise<ResultadoIA> {
  const cuerpo = {
    model: op.modelo ?? env.iaModelo,
    max_tokens: op.maxTokens ?? 1024,
    system: op.sistema,
    tools: [op.herramienta],
    tool_choice: { type: 'tool', name: op.herramienta.name },
    messages: [{ role: 'user', content: op.contenido }],
  };

  const intentos = 2;
  for (let intento = 1; intento <= intentos; intento++) {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), op.timeoutMs ?? 20000);

    try {
      const resp = await fetch(URL_API, {
        method: 'POST',
        signal: control.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.iaApiKey,
          'anthropic-version': VERSION_API,
        },
        body: JSON.stringify(cuerpo),
      });

      const temporal = resp.status === 429 || resp.status >= 500;
      if (temporal && intento < intentos) {
        await esperar(800 * intento);
        continue;
      }
      if (!resp.ok) {
        const detalle = await resp.text();
        throw new ErrorIA(`El modelo respondió ${resp.status}: ${detalle.slice(0, 300)}`);
      }

      const json = await resp.json();
      const bloque = (json.content ?? []).find((b: { type: string }) => b.type === 'tool_use');
      if (!bloque) throw new ErrorIA('El modelo no devolvió la herramienta');

      return {
        datos: bloque.input,
        tokens: {
          entrada: json.usage?.input_tokens ?? 0,
          salida: json.usage?.output_tokens ?? 0,
        },
      };
    } catch (e) {
      if (e instanceof ErrorIA) throw e;
      if (intento < intentos) {
        await esperar(800 * intento);
        continue;
      }
      throw new ErrorIA(`Fallo de red o tiempo agotado: ${(e as Error).message}`);
    } finally {
      clearTimeout(temporizador);
    }
  }
  throw new ErrorIA('Sin respuesta del modelo');
}

function esperar(ms: number) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}
