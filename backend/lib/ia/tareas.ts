import { env } from '../config/env';
import type { Idioma, Intencion, Ruta } from '../dominio/tipos';
import { type BloqueContenido, llamarHerramienta, type Tokens } from './cliente-ia';
import {
  herramientaIntencion,
  herramientaItinerario,
  herramientaPlato,
  IntencionSchema,
  PlatoDetectadoSchema,
} from './esquemas';
import { PROMPT_INTENCION, PROMPT_PLATO, promptItinerario } from './prompts';
import { z } from 'zod';

// Las 3 tareas de IA del sistema. Cada una devuelve datos YA validados
// (o null si el modelo devolvió algo que no cumple el esquema).

/** 1. Texto libre del usuario → intención estructurada. */
export async function extraerIntencion(
  texto: string,
): Promise<{ intencion: Intencion | null; tokens: Tokens }> {
  const r = await llamarHerramienta({
    sistema: PROMPT_INTENCION,
    contenido: [{ type: 'text', text: `<mensaje_usuario>\n${texto}\n</mensaje_usuario>` }],
    herramienta: herramientaIntencion,
    maxTokens: 400,
  });
  const p = IntencionSchema.safeParse(r.datos);
  if (!p.success) console.warn('[ia] intención inválida', p.error.flatten());
  return { intencion: p.success ? p.data : null, tokens: r.tokens };
}

/**
 * 2. Ruta ya armada → texto del itinerario.
 * Al modelo NO se le envían precios: así no puede alterarlos.
 */
export async function redactarItinerario(
  ruta: Ruta,
  idioma: Idioma,
  preferencias: string,
): Promise<{ datos: unknown; tokens: Tokens }> {
  const paradas = ruta.paradas.map((p) => ({
    lugar_id: p.lugar.id,
    orden: p.orden,
    nombre: p.lugar.nombre,
    tipo: p.lugar.tipo,
    zona: p.lugar.zona,
    descripcion: idioma === 'en' ? (p.lugar.descripcion_en ?? p.lugar.descripcion) : p.lugar.descripcion,
    minutos_desde_anterior: p.minutos_traslado,
    minutos_en_el_lugar: p.lugar.duracion_min,
  }));

  const r = await llamarHerramienta({
    sistema: promptItinerario(idioma),
    contenido: [{
      type: 'text',
      text: JSON.stringify({ preferencias_del_turista: preferencias, paradas }, null, 2),
    }],
    herramienta: herramientaItinerario,
    maxTokens: 900,
  });
  return { datos: r.datos, tokens: r.tokens };
}

/** 3. Foto → plato del catálogo (o "desconocido"). */
export async function detectarPlato(
  imagenBase64: string,
  mediaType: string,
  nombresPermitidos: string[],
): Promise<{ deteccion: z.infer<typeof PlatoDetectadoSchema> | null; tokens: Tokens }> {
  const contenido: BloqueContenido[] = [
    { type: 'image', source: { type: 'base64', media_type: mediaType, data: imagenBase64 } },
    { type: 'text', text: `Lista permitida: ${nombresPermitidos.join(', ')}` },
  ];
  const r = await llamarHerramienta({
    sistema: PROMPT_PLATO,
    contenido,
    herramienta: herramientaPlato(nombresPermitidos),
    modelo: env.iaModeloVision,
    maxTokens: 200,
  });
  const p = PlatoDetectadoSchema.safeParse(r.datos);
  return { deteccion: p.success ? p.data : null, tokens: r.tokens };
}
