import { ErrorHttp } from '../http/respuestas';
import { planificar } from '../dominio/planificador';
import { plantillaSimple } from '../dominio/plantilla';
import { validarItinerario, validarRuta } from '../dominio/validador-ruta';
import type { Coordenada, Idioma, Intencion, Itinerario, Ruta, TipoLugar } from '../dominio/tipos';
import { ErrorIA, type Tokens } from '../ia/cliente-ia';
import { ItinerarioSchema } from '../ia/esquemas';
import { extraerIntencion, redactarItinerario } from '../ia/tareas';
import { buscarLugares } from '../repositorios/lugares.repo';
import { guardarRegistro } from '../repositorios/logs.repo';

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

  // 1. Interpretar datos básicos sin proveedor externo.
  // El modo gratuito usa reglas deterministas y nunca necesita una API key.
  let intencion: Intencion | null = null;
  const datosLocales = extraerIntencionLocal(e.texto, e.idioma ?? 'es');
  if (datosLocales) {
    intencion = datosLocales;
  } else if (process.env.GEMINI_API_KEY) {
    try {
      const r = await extraerIntencion(e.texto);
      intencion = r.intencion;
      sumar(tokens, r.tokens);
    } catch (err) {
      if (!(err instanceof ErrorIA)) throw err;
      console.warn('[ruta] Gemini no disponible; se solicita completar el formulario:', err.message);
    }
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
  if (process.env.GEMINI_API_KEY) {
    try {
      const r = await redactarItinerario(ruta, idioma, intencion.preferencias);
      sumar(tokens, r.tokens);
      const p = ItinerarioSchema.safeParse(r.datos);
      if (p.success) {
        const v = validarItinerario(p.data, ruta);
        if (v.valido) itinerario = p.data;
        else console.warn('[ruta] texto de Gemini rechazado:', v.problemas);
      }
    } catch (err) {
      if (!(err instanceof ErrorIA)) throw err;
      falloIA = true;
      console.error('[ruta] fallo al redactar con Gemini:', err.message);
    }
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
  const candidatos = await buscarLugares({
    presupuesto: p.presupuesto,
    tipos: p.tipos,
    zona: p.zona,
    hora: p.soloAbiertos ? horaLocalBolivia() : null,
    texto: p.preferencias,
  });

  const restricciones = { presupuesto: p.presupuesto, horas: p.horas, origen: p.origen };
  const ruta = planificar(candidatos, restricciones);

  // Red de seguridad: si esto falla es un bug del planificador, no del usuario.
  const v = validarRuta(ruta, restricciones);
  if (!v.valido) throw new Error(`Ruta inválida: ${v.problemas.join('; ')}`);
  return ruta;
}

function extraerIntencionLocal(texto: string, idioma: Idioma): Intencion | null {
  const normalizado = texto.toLowerCase().replace(/,/g, '.');
  const presupuestoMatch =
    normalizado.match(/(?:bs\.?\s*|bolivianos?\s*)(\d+(?:\.\d+)?)/i) ??
    normalizado.match(/(\d+(?:\.\d+)?)\s*(?:bs\.?|bolivianos?)/i);
  const horasMatch = normalizado.match(/(\d+(?:\.\d+)?)\s*(?:horas?|hrs?)/i);
  const minutosMatch = normalizado.match(/(\d+)\s*minutos?/i);
  const presupuesto = presupuestoMatch ? Number(presupuestoMatch[1]) : null;
  const horas = horasMatch
    ? Number(horasMatch[1])
    : minutosMatch
      ? Number(minutosMatch[1]) / 60
      : null;
  if (presupuesto === null && horas === null) return null;

  const tipos: TipoLugar[] = [];
  if (/comer|comida|gastronom|almorz|cenar|desayun|plato|silpancho|salteñ|pique macho/i.test(normalizado)) tipos.push('comida');
  if (/museo|historia|cultura|iglesia|colonial/i.test(normalizado)) tipos.push('cultura');
  if (/parque|laguna|naturaleza|mirador|paisaje/i.test(normalizado)) tipos.push('naturaleza');
  if (/aventura|trekking|sender|caminata/i.test(normalizado)) tipos.push('naturaleza');

  const zonaMatch = normalizado.match(/(?:en|por|cerca de)\s+([a-záéíóúñ ]{3,50})/i);
  const zona = zonaMatch?.[1]?.trim() ?? null;
  const stopWords = /\b(tengo|bs|bolivianos?|horas?|hrs?|minutos?|quiero|hacer|conocer|visitar|comer|una|un|en|por|cerca|de|la|el|y|dos|tres|cuatro)\b/gi;
  const preferencias = normalizado.replace(stopWords, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);

  return {
    presupuesto: presupuesto !== null && Number.isFinite(presupuesto) && presupuesto > 0 ? presupuesto : null,
    horas: horas !== null && Number.isFinite(horas) && horas > 0 ? horas : null,
    tipos,
    zona,
    preferencias,
    idioma,
  };
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
