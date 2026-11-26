// Tipos del dominio. No dependen de la IA ni de la base de datos.

export const TIPOS_LUGAR = ['comida', 'mercado', 'mirador', 'cultura', 'naturaleza', 'otro'] as const;
export type TipoLugar = (typeof TIPOS_LUGAR)[number];

export type Idioma = 'es' | 'en';

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface LugarCandidato extends Coordenada {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  zona: string | null;
  descripcion: string | null;
  descripcion_en: string | null;
  precio_min: number;
  precio_max: number;
  duracion_min: number;
  verificado: boolean;
  fecha_verificacion: string | null;
  fuente: string;
  /** 0..1, qué tanto coincide con lo que pidió el usuario (pgvector). */
  similitud: number;
}

export interface Parada {
  orden: number;
  lugar: LugarCandidato;
  km_traslado: number;
  minutos_traslado: number;
}

export interface Ruta {
  paradas: Parada[];
  costo_min: number;
  costo_max: number;
  minutos_total: number;
  km_total: number;
}

export interface Restricciones {
  presupuesto: number;
  horas: number;
  origen?: Coordenada;
  maxParadas?: number;
}

/** Lo que la IA extrae del mensaje del usuario. */
export interface Intencion {
  presupuesto: number | null;
  horas: number | null;
  tipos: TipoLugar[];
  zona: string | null;
  preferencias: string;
  idioma: Idioma;
}

/** Texto del itinerario. Los precios NO van aquí: la app los muestra desde los datos. */
export interface Itinerario {
  titulo: string;
  introduccion: string;
  paradas: { lugar_id: string; texto: string }[];
  consejo: string;
}
