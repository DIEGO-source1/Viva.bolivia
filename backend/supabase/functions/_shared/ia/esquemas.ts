import { z } from '../deps.ts';
import { TIPOS_LUGAR } from '../dominio/tipos.ts';
import type { Herramienta } from './cliente-ia.ts';

// =========================================================
// Esquemas Zod (validan lo que devuelve el modelo)
// + definiciones de herramientas (obligan al modelo a responder en JSON)
// =========================================================

export const IntencionSchema = z.object({
  presupuesto: z.number().positive().max(10000).nullable(),
  horas: z.number().positive().max(24).nullable(),
  tipos: z.array(z.enum(TIPOS_LUGAR)).max(6).default([]),
  zona: z.string().trim().max(80).nullable().default(null),
  preferencias: z.string().trim().max(300).default(''),
  idioma: z.enum(['es', 'en']).default('es'),
});

export const herramientaIntencion: Herramienta = {
  name: 'registrar_intencion',
  description: 'Registra los datos extraídos del pedido del turista.',
  input_schema: {
    type: 'object',
    properties: {
      presupuesto: { type: ['number', 'null'], description: 'Presupuesto en bolivianos, o null' },
      horas: { type: ['number', 'null'], description: 'Horas disponibles, o null' },
      tipos: { type: 'array', items: { type: 'string', enum: [...TIPOS_LUGAR] } },
      zona: { type: ['string', 'null'] },
      preferencias: { type: 'string' },
      idioma: { type: 'string', enum: ['es', 'en'] },
    },
    required: ['presupuesto', 'horas', 'tipos', 'zona', 'preferencias', 'idioma'],
  },
};

export const ItinerarioSchema = z.object({
  titulo: z.string().trim().min(1).max(120),
  introduccion: z.string().trim().max(600),
  paradas: z.array(
    z.object({
      lugar_id: z.string().uuid(),
      texto: z.string().trim().min(1).max(400),
    }),
  ).min(1).max(8),
  consejo: z.string().trim().max(300),
});

export const herramientaItinerario: Herramienta = {
  name: 'registrar_itinerario',
  description: 'Registra el texto del itinerario para las paradas dadas.',
  input_schema: {
    type: 'object',
    properties: {
      titulo: { type: 'string' },
      introduccion: { type: 'string' },
      paradas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            lugar_id: { type: 'string', description: 'El id exacto recibido' },
            texto: { type: 'string' },
          },
          required: ['lugar_id', 'texto'],
        },
      },
      consejo: { type: 'string' },
    },
    required: ['titulo', 'introduccion', 'paradas', 'consejo'],
  },
};

export const PlatoDetectadoSchema = z.object({
  plato: z.string(),
  confianza: z.number().min(0).max(1),
  es_comida: z.boolean(),
});

/** La lista de platos viene de la base de datos: el modelo no puede inventar uno. */
export function herramientaPlato(nombresPermitidos: string[]): Herramienta {
  return {
    name: 'registrar_plato',
    description: 'Registra el plato reconocido en la foto.',
    input_schema: {
      type: 'object',
      properties: {
        plato: { type: 'string', enum: [...nombresPermitidos, 'desconocido'] },
        confianza: { type: 'number', minimum: 0, maximum: 1 },
        es_comida: { type: 'boolean' },
      },
      required: ['plato', 'confianza', 'es_comida'],
    },
  };
}
