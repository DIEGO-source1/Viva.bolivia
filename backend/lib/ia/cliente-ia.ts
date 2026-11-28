import { env } from '../config/env';

// Adaptador REST para Gemini Developer API.
// Mantiene la interfaz Herramienta usada por las tareas existentes,
// convirtiendo input_schema en responseSchema JSON de Gemini.

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

function convertirEsquema(esquema: Record<string, unknown>): Record<string, unknown> {
  const properties = (esquema.properties ?? {}) as Record<string, Record<string, unknown>>;
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    converted[key] = convertirPropiedad(value);
  }
  return {
    type: 'OBJECT',
    properties: converted,
    required: Array.isArray(esquema.required) ? esquema.required : [],
  };
}

function convertirPropiedad(prop: Record<string, unknown>): Record<string, unknown> {
  const rawType = prop.type;
  let type = Array.isArray(rawType) ? rawType.find((t) => t !== 'null') : rawType;
  const nullable = Array.isArray(rawType) && rawType.includes('null');
  const map: Record<string, string> = {
    object: 'OBJECT', array: 'ARRAY', string: 'STRING',
    number: 'NUMBER', integer: 'INTEGER', boolean: 'BOOLEAN',
  };
  const result: Record<string, unknown> = {};
  if (typeof type === 'string' && map[type]) result.type = map[type];
  if (nullable) result.nullable = true;
  if (Array.isArray(prop.enum)) result.enum = prop.enum;
  if (typeof prop.description === 'string') result.description = prop.description;
  if (prop.items && typeof prop.items === 'object') {
    result.items = convertirPropiedad(prop.items as Record<string, unknown>);
  }
  if (prop.properties && typeof prop.properties === 'object') {
    const nested = prop.properties as Record<string, Record<string, unknown>>;
    const nestedProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(nested)) nestedProps[key] = convertirPropiedad(value);
    result.properties = nestedProps;
    result.required = Array.isArray(prop.required) ? prop.required : [];
  }
  if (typeof prop.minimum === 'number') result.minimum = prop.minimum;
  if (typeof prop.maximum === 'number') result.maximum = prop.maximum;
  return result;
}

/**
 * Gemini structured output (JSON schema) con soporte texto + imagen.
 * Reintenta una vez ante 429, 5xx o fallos temporales de red.
 */
export async function llamarHerramienta(op: OpcionesLlamada): Promise<ResultadoIA> {
  const model = op.modelo ?? env.iaModelo;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const parts = op.contenido.map((block) => {
    if (block.type === 'text') return { text: block.text };
    return {
      inlineData: {
        mimeType: block.source.media_type,
        data: block.source.data,
      },
    };
  });

  const body = {
    systemInstruction: { parts: [{ text: op.sistema }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      maxOutputTokens: op.maxTokens ?? 1024,
      responseMimeType: 'application/json',
      responseSchema: convertirEsquema(op.herramienta.input_schema),
      temperature: 0.2,
    },
  };

  for (let intento = 1; intento <= 2; intento++) {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), op.timeoutMs ?? 20000);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        signal: control.signal,
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': env.geminiApiKey,
        },
        body: JSON.stringify(body),
      });

      if ((resp.status === 429 || resp.status >= 500) && intento < 2) {
        await esperar(900 * intento);
        continue;
      }
      if (!resp.ok) {
        const detalle = await resp.text();
        throw new ErrorIA(`Gemini respondió ${resp.status}: ${detalle.slice(0, 300)}`);
      }

      const json = await resp.json();
      const texto = json.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? '')
        .join('')
        .trim();
      if (!texto) throw new ErrorIA('Gemini no devolvió contenido JSON');
      let datos: unknown;
      try {
        datos = JSON.parse(texto);
      } catch {
        throw new ErrorIA('Gemini devolvió una respuesta JSON inválida');
      }

      return {
        datos,
        tokens: {
          entrada: json.usageMetadata?.promptTokenCount ?? 0,
          salida: json.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof ErrorIA) throw error;
      if (intento < 2) {
        await esperar(900 * intento);
        continue;
      }
      throw new ErrorIA(`Fallo de red o tiempo agotado: ${(error as Error).message}`);
    } finally {
      clearTimeout(temporizador);
    }
  }
  throw new ErrorIA('Gemini no respondió después de los reintentos');
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
