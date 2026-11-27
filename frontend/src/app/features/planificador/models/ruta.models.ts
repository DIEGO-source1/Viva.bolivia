export type TipoLugar = 'comida' | 'mercado' | 'mirador' | 'cultura' | 'naturaleza' | 'otro';
export type Idioma = 'es' | 'en';

export interface ApiExito<T> {
  ok: true;
  datos: T;
}

export interface ApiError {
  ok: false;
  error: string;
  detalle?: unknown;
}

export type RespuestaApi<T> = ApiExito<T> | ApiError;

export interface Coordenada {
  lat: number;
  lng: number;
}

export interface Lugar {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  zona: string | null;
  descripcion: string | null;
  descripcion_en: string | null;
  lat: number;
  lng: number;
  precio_min: number;
  precio_max: number;
  duracion_min: number;
  verificado: boolean;
  fecha_verificacion: string | null;
  fuente: string;
  similitud: number;
}

export interface Parada {
  orden: number;
  lugar: Lugar;
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

export interface Itinerario {
  titulo: string;
  introduccion: string;
  paradas: { lugar_id: string; texto: string }[];
  consejo: string;
}

export interface Intencion {
  presupuesto: number | null;
  horas: number | null;
  tipos: TipoLugar[];
  zona: string | null;
  preferencias: string;
  idioma: Idioma;
}

export interface RespuestaRuta {
  estado: 'ok' | 'faltan_datos' | 'sin_resultados';
  faltan?: ('presupuesto' | 'horas')[];
  intencion?: Intencion;
  ruta?: Ruta;
  itinerario?: Itinerario;
  texto_fuente?: 'ia' | 'plantilla';
  avisos: string[];
}

export interface SaludApi {
  estado: 'ok';
  lugares_en_catalogo: number;
}

export interface EntradaRutaIA {
  texto: string;
  idioma: Idioma;
  soloAbiertos: boolean;
}

export interface EntradaRutaSinIA {
  presupuesto: number;
  horas: number;
  tipos: TipoLugar[];
  zona: string | null;
  idioma: Idioma;
  soloAbiertos: boolean;
}

export type SolicitudRuta =
  | { modo: 'ia'; entrada: EntradaRutaIA }
  | { modo: 'manual'; entrada: EntradaRutaSinIA };

export type CampoFaltanteRuta = 'presupuesto' | 'horas';
