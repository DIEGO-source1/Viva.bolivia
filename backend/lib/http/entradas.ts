import { z } from 'zod';
import { TIPOS_LUGAR } from '../dominio/tipos';

// Esquemas de entrada de los endpoints (lo que manda Angular).

const Coordenada = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const Idioma = z.enum(['es', 'en']);

export const EntradaRutaIA = z.object({
  texto: z.string().trim().min(3, 'Escribe un poco más').max(500),
  idioma: Idioma.optional(),
  origen: Coordenada.optional(),
  soloAbiertos: z.boolean().optional(),
});

export const EntradaRutaSinIA = z.object({
  presupuesto: z.number().positive().max(10000),
  horas: z.number().min(0.25).max(24),
  tipos: z.array(z.enum(TIPOS_LUGAR)).max(6).default([]),
  zona: z.string().trim().max(80).nullable().optional(),
  idioma: Idioma.default('es'),
  origen: Coordenada.optional(),
  soloAbiertos: z.boolean().optional(),
});

// ~3 MB de imagen en base64 (Vercel acepta cuerpos de hasta ~4.5 MB)
const MAX_BASE64 = 4_000_000;

export const EntradaEscaner = z.object({
  imagenBase64: z.string().min(100).max(MAX_BASE64, "La imagen es demasiado grande (máx. 3 MB)")
    .transform((s) => s.replace(/^data:image\/\w+;base64,/, '')),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  idioma: Idioma.default('es'),
});

export const EntradaReporte = z.object({
  lugar_id: z.string().uuid(),
  tipo: z.enum(['precio', 'horario', 'cerrado', 'ubicacion', 'otro']),
  comentario: z.string().trim().max(500).optional(),
});
