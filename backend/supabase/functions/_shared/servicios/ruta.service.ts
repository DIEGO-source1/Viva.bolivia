import { ErrorHttp } from '../http/respuestas.ts';
import { planificar } from '../dominio/planificador.ts';
import { plantillaSimple } from '../dominio/plantilla.ts';
import { validarItinerario, validarRuta } from '../dominio/validador-ruta.ts';
import type { Coordenada, Idioma, Intencion, Itinerario, Ruta, TipoLugar } from '../dominio/tipos.ts';
import { ErrorIA, type Tokens } from '../ia/cliente-ia.ts';
import { generarEmbedding } from '../ia/embeddings.ts';
import { ItinerarioSchema } from '../ia/esquemas.ts';
import { extraerIntencion, redactarItinerario } from '../ia/tareas.ts';
import { buscarLugares } from '../repositorios/lugares.repo.ts';
import { guardarRegistro } from '../repositorios/logs.repo.ts';

export interface RespuestaRuta {
  estado: 'ok' | 'faltan_datos' | 'sin_resultados';
  faltan?: ('presupuesto' | 'horas')[];
  intencion?: Intencion;
  ruta?: Ruta;
  itinerario?: Itinerario;
  texto_fuente?: 'ia' | 'plantilla';
  avisos: string[];
}

export interface EntradaRutaIA {
  texto: string;
  idioma?: Idioma;
  origen?: Coordenada;
  soloAbiertos?: boolean;
}

export interface EntradaRutaSinIA {
  presupuesto: number;
  horas: number;
  tipos: TipoLugar[];
  zona?: string | null;
  preferencias?: string;
  idioma: Idioma;
  origen?: Coordenada;
  soloAbiertos?: boolean;
}

// =========================================================
// Ruta CON IA: texto libre → intención → catálogo → planificador → texto
// =========================================================
export async function generarRutaConIA(e: EntradaRutaIA): Promise<RespuestaRuta> {
  const inicio = performance.now();
  const tokens: Tokens = { entrada: 0, salida: 0 };
  let falloIA = false;

  // 1. Entender el pedido
  let intencion: Intencion | null = null;
  try {
    const r = await extraerIntencion(e.texto);
    intencion = r.intencion;
    sumar(tokens, r.tokens);
  } catch (err) {
    if (!(err instanceof ErrorIA)) throw err;
    console.error('[ruta] IA no disponible:', err.message);
    await guardarRegistro({ tipo: 'ruta_ia', estado: 'error_ia', ms: performance.now() - inicio, tokens, fallo_ia: true });
    // Manejo de errores: el frontend muestra el formulario sin IA.
    throw new ErrorHttp(503, 'El asistente no está disponible ahora. Usa el formulario.', { alternativa: '/ruta-sin-ia' });
  }

  if (!intencion) {
    await guardarRegistro({ tipo: 'ruta_ia', estado: 'faltan_datos', ms: performance.now() - inicio, tokens });
    return { estado: 'faltan_datos', faltan: ['presupuesto', 'horas'], avisos: [] };
  }

  const idioma = e.idioma ?? intencion.idioma;
  const faltan: ('presupuesto' | 'horas')[] = [];
  if (intencion.presupuesto === null) faltan.push('presupuesto');
  if (intencion.horas === null) faltan.push('horas');
  if (faltan.length) {
    await guardarRegistro({ tipo: 'ruta_ia', estado: 'faltan_datos', intencion, ms: performance.now() - inicio, tokens });
    return { estado: 'faltan_datos', faltan, intencion, avisos: [] };
  }

  // 2 y 3. Buscar en el catálogo y armar la ruta (sin IA)
  const ruta = await armarRuta({
    presupuesto: intencion.presupuesto!,
    horas: intencion.horas!,
    tipos: intencion.tipos,
    zona: intencion.zona,
    preferencias: intencion.preferencias,
    origen: e.origen,
    soloAbiertos: e.soloAbiertos,
  });

  if (ruta.paradas.length === 0) {
    await guardarRegistro({ tipo: 'ruta_ia', estado: 'sin_resultados', intencion, ms: performance.now() - inicio, tokens });
    return { estado: 'sin_resultados', intencion, avisos: [mensajeSinResultados(idioma)] };
  }

  // 4. Redactar con IA, validar, y usar plantilla si algo falla
  let itinerario: Itinerario | null = null;
  try {
    const r = await redactarItinerario(ruta, idioma, intencion.preferencias);
    sumar(tokens, r.tokens);
    const p = ItinerarioSchema.safeParse(r.datos);
    if (p.success) {
      const v = validarItinerario(p.data, ruta);
      if (v.valido) itinerario = p.data;
      else console.warn('[ruta] texto de IA rechazado:', v.problemas);
    }
  } catch (err) {
    if (!(err instanceof ErrorIA)) throw err;
    falloIA = true;
    console.error('[ruta] fallo al redactar:', err.message);
  }

  const texto_fuente = itinerario ? 'ia' : 'plantilla';
  itinerario ??= plantillaSimple(ruta, idioma);

  await guardarRegistro({
    tipo: 'ruta_ia',
    estado: 'ok',
    intencion,
    lugares_ids: ruta.paradas.map((p) => p.lugar.id),
    costo_max: ruta.costo_max,
    minutos_total: ruta.minutos_total,
    ms: performance.now() - inicio,
    tokens,
    fallo_ia: falloIA,
    texto_fuente,
  });

  return { estado: 'ok', intencion, ruta, itinerario, texto_fuente, avisos: avisosDeRuta(ruta, idioma) };
}

// =========================================================
// Ruta SIN IA (alternativa tradicional para comparar - criterio B)
// Mismos pasos 2 y 3; el usuario llena un formulario en vez de escribir.
// =========================================================
export async function generarRutaSinIA(e: EntradaRutaSinIA): Promise<RespuestaRuta> {
  const inicio = performance.now();
  const ruta = await armarRuta({ ...e, zona: e.zona ?? null, preferencias: '' });

  if (ruta.paradas.length === 0) {
    await guardarRegistro({ tipo: 'ruta_sin_ia', estado: 'sin_resultados', ms: performance.now() - inicio });
    return { estado: 'sin_resultados', avisos: [mensajeSinResultados(e.idioma)] };
  }

  await guardarRegistro({
    tipo: 'ruta_sin_ia',
    estado: 'ok',
    lugares_ids: ruta.paradas.map((p) => p.lugar.id),
    costo_max: ruta.costo_max,
    minutos_total: ruta.minutos_total,
    ms: performance.now() - inicio,
    texto_fuente: 'plantilla',
  });

  return {
    estado: 'ok',
    ruta,
    itinerario: plantillaSimple(ruta, e.idioma),
    texto_fuente: 'plantilla',
    avisos: avisosDeRuta(ruta, e.idioma),
  };
}

// =========================================================
// Pasos compartidos
// =========================================================
async function armarRuta(p: {
  presupuesto: number;
  horas: number;
  tipos: TipoLugar[];
  zona: string | null;
  preferencias: string;
  origen?: Coordenada;
  soloAbiertos?: boolean;
}): Promise<Ruta> {
  const textoBusqueda = [p.preferencias, ...p.tipos].join(' ').trim();
  const embedding = textoBusqueda ? await generarEmbedding(textoBusqueda) : null;

  const candidatos = await buscarLugares({
    presupuesto: p.presupuesto,
    tipos: p.tipos,
    zona: p.zona,
    hora: p.soloAbiertos ? horaLocalBolivia() : null,
    embedding,
  });

  const restricciones = { presupuesto: p.presupuesto, horas: p.horas, origen: p.origen };
  const ruta = planificar(candidatos, restricciones);

  // Red de seguridad: si esto falla es un bug del planificador, no del usuario.
  const v = validarRuta(ruta, restricciones);
  if (!v.valido) throw new Error(`Ruta inválida: ${v.problemas.join('; ')}`);
  return ruta;
}

function horaLocalBolivia(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function avisosDeRuta(ruta: Ruta, idioma: Idioma): string[] {
  const avisos: string[] = [];
  if (ruta.paradas.some((p) => !p.lugar.verificado)) {
    avisos.push(
      idioma === 'es'
        ? 'Algunos precios y horarios son estimados y no han sido verificados recientemente.'
        : 'Some prices and hours are estimates and have not been verified recently.',
    );
  }
  return avisos;
}

function mensajeSinResultados(idioma: Idioma): string {
  return idioma === 'es'
    ? 'No encontramos una ruta con ese presupuesto y tiempo. Prueba con más presupuesto, más tiempo u otro tipo de lugar.'
    : 'We could not build a route with that budget and time. Try a higher budget, more time or another type of place.';
}

function sumar(total: Tokens, parcial: Tokens) {
  total.entrada += parcial.entrada;
  total.salida += parcial.salida;
}
