import { ErrorHttp } from '../http/respuestas';
import type { Idioma } from '../dominio/tipos';
import { ErrorIA } from '../ia/cliente-ia';
import { detectarPlato } from '../ia/tareas';
import { guardarRegistro } from '../repositorios/logs.repo';
import { nombresPlatos, platoConLugares } from '../repositorios/platos.repo';

/** Debajo de este valor se pide confirmación al usuario (supervisión humana). */
export const UMBRAL_CONFIANZA = 0.75;

export interface EntradaEscaner {
  imagenBase64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  idioma: Idioma;
}

export async function escanearPlato(e: EntradaEscaner) {
  const inicio = performance.now();
  if (!process.env.GEMINI_API_KEY) {
    throw new ErrorHttp(503, 'VIVA LENS requiere configurar Gemini API. Mientras tanto puedes buscar el plato por nombre.');
  }
  const nombres = await nombresPlatos();
  if (nombres.length === 0) throw new ErrorHttp(500, 'El catálogo de platos está vacío');

  let resultado;
  try {
    resultado = await detectarPlato(e.imagenBase64, e.mediaType, nombres);
  } catch (err) {
    if (!(err instanceof ErrorIA)) throw err;
    await guardarRegistro({ tipo: 'escaner', estado: 'error_ia', ms: performance.now() - inicio, fallo_ia: true });
    throw new ErrorHttp(503, 'El escáner no está disponible ahora. Intenta de nuevo.');
  }

  const { deteccion, tokens } = resultado;
  const noReconocido = !deteccion || !deteccion.es_comida || deteccion.plato === 'desconocido';

  if (noReconocido) {
    await guardarRegistro({ tipo: 'escaner', estado: 'no_reconocido', ms: performance.now() - inicio, tokens });
    return {
      estado: 'no_reconocido' as const,
      mensaje: e.idioma === 'es'
        ? 'No pudimos reconocer el plato. Prueba con otra foto o búscalo por nombre.'
        : 'We could not recognise the dish. Try another photo or search by name.',
    };
  }

  const plato = await platoConLugares(deteccion.plato);
  const confirmar = deteccion.confianza < UMBRAL_CONFIANZA;

  await guardarRegistro({
    tipo: 'escaner',
    estado: confirmar ? 'confirmar' : 'reconocido',
    intencion: { plato: deteccion.plato, confianza: deteccion.confianza },
    ms: performance.now() - inicio,
    tokens,
  });

  return {
    estado: confirmar ? ('confirmar' as const) : ('reconocido' as const),
    confianza: deteccion.confianza,
    plato,
    mensaje: confirmar
      ? (e.idioma === 'es' ? `¿Es ${deteccion.plato}? Confírmalo para continuar.` : `Is this ${deteccion.plato}? Please confirm.`)
      : undefined,
  };
}
