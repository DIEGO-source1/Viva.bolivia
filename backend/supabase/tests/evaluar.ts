// deno-lint-ignore-file no-explicit-any
// Evaluación con IA vs sin IA sobre los mismos casos (criterio B).
//
// Uso:
//   BASE_URL=https://<proyecto>.supabase.co/functions/v1 \
//   ANON_KEY=<anon key> \
//   deno run --allow-net --allow-env --allow-read --allow-write supabase/tests/evaluar.ts
//
// Genera una tabla en consola y resultados-evaluacion.json para el pitch.

interface Caso {
  id: string;
  texto: string;
  sin_ia: { presupuesto: number; horas: number; tipos: string[]; zona?: string } | null;
  esperado: { estado: string; presupuesto?: number; horas?: number };
}

interface Resultado {
  caso: string;
  version: 'con_ia' | 'sin_ia';
  http: number;
  estado: string;
  estado_correcto: boolean;
  extraccion_correcta: boolean | null;
  dentro_presupuesto: boolean | null;
  dentro_tiempo: boolean | null;
  lugares_inventados: number;
  paradas: number;
  texto_fuente: string | null;
  ms: number;
}

const BASE = Deno.env.get('BASE_URL');
const KEY = Deno.env.get('ANON_KEY');
if (!BASE || !KEY) {
  console.error('Define BASE_URL y ANON_KEY');
  Deno.exit(1);
}
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}`, apikey: KEY };

const casos: Caso[] = JSON.parse(await Deno.readTextFile(new URL('./casos-prueba.json', import.meta.url)));

// IDs reales del catálogo para detectar lugares inventados
const catalogo = await (await fetch(`${BASE}/lugares`, { headers })).json();
const idsReales = new Set<string>(catalogo.datos.lugares.map((l: { id: string }) => l.id));

async function llamar(ruta: string, cuerpo: unknown) {
  const inicio = performance.now();
  const resp = await fetch(`${BASE}/${ruta}`, { method: 'POST', headers, body: JSON.stringify(cuerpo) });
  const json = await resp.json().catch(() => ({}));
  return { http: resp.status, json, ms: Math.round(performance.now() - inicio) };
}

function analizar(caso: Caso, version: Resultado['version'], r: { http: number; json: any; ms: number }, presupuesto?: number, horas?: number): Resultado {
  const d = r.json?.datos ?? {};
  const estado = r.http === 200 ? d.estado : `http_${r.http}`;
  const ruta = d.ruta;
  const p = presupuesto ?? d.intencion?.presupuesto;
  const h = horas ?? d.intencion?.horas;

  let extraccion: boolean | null = null;
  if (version === 'con_ia' && d.intencion) {
    const okP = caso.esperado.presupuesto === undefined || d.intencion.presupuesto === caso.esperado.presupuesto;
    const okH = caso.esperado.horas === undefined || d.intencion.horas === caso.esperado.horas;
    extraccion = okP && okH;
  }

  const ids: string[] = ruta?.paradas?.map((x: any) => x.lugar.id) ?? [];
  const idsTexto: string[] = d.itinerario?.paradas?.map((x: any) => x.lugar_id) ?? [];

  return {
    caso: caso.id,
    version,
    http: r.http,
    estado,
    estado_correcto: estado === caso.esperado.estado,
    extraccion_correcta: extraccion,
    dentro_presupuesto: ruta && p ? ruta.costo_max <= p : null,
    dentro_tiempo: ruta && h ? ruta.minutos_total <= h * 60 : null,
    lugares_inventados: [...ids, ...idsTexto].filter((id) => !idsReales.has(id)).length,
    paradas: ids.length,
    texto_fuente: d.texto_fuente ?? null,
    ms: r.ms,
  };
}

const resultados: Resultado[] = [];
for (const caso of casos) {
  const conIA = await llamar('ruta', { texto: caso.texto });
  resultados.push(analizar(caso, 'con_ia', conIA));

  if (caso.sin_ia) {
    const sinIA = await llamar('ruta-sin-ia', { ...caso.sin_ia, idioma: 'es' });
    resultados.push(analizar(caso, 'sin_ia', sinIA, caso.sin_ia.presupuesto, caso.sin_ia.horas));
  }
  console.log(`✓ ${caso.id}`);
}

function porcentaje(lista: (boolean | null)[]) {
  const validos = lista.filter((x) => x !== null) as boolean[];
  if (!validos.length) return '—';
  return `${Math.round((validos.filter(Boolean).length / validos.length) * 100)}% (${validos.filter(Boolean).length}/${validos.length})`;
}

function resumen(version: Resultado['version']) {
  const r = resultados.filter((x) => x.version === version);
  const conRuta = r.filter((x) => x.paradas > 0);
  return {
    casos: r.length,
    estado_correcto: porcentaje(r.map((x) => x.estado_correcto)),
    extraccion_correcta: porcentaje(r.map((x) => x.extraccion_correcta)),
    dentro_presupuesto: porcentaje(r.map((x) => x.dentro_presupuesto)),
    dentro_tiempo: porcentaje(r.map((x) => x.dentro_tiempo)),
    lugares_inventados: r.reduce((s, x) => s + x.lugares_inventados, 0),
    texto_por_ia: porcentaje(conRuta.map((x) => x.texto_fuente === 'ia')),
    paradas_promedio: conRuta.length ? (conRuta.reduce((s, x) => s + x.paradas, 0) / conRuta.length).toFixed(1) : '—',
    latencia_promedio_ms: Math.round(r.reduce((s, x) => s + x.ms, 0) / Math.max(1, r.length)),
  };
}

const tabla = { con_ia: resumen('con_ia'), sin_ia: resumen('sin_ia') };
console.log('\n| Métrica | Con IA | Sin IA |\n|---|---|---|');
for (const k of Object.keys(tabla.con_ia) as (keyof typeof tabla.con_ia)[]) {
  console.log(`| ${k} | ${tabla.con_ia[k]} | ${tabla.sin_ia[k]} |`);
}

await Deno.writeTextFile('resultados-evaluacion.json', JSON.stringify({ fecha: new Date().toISOString(), resumen: tabla, detalle: resultados }, null, 2));
console.log('\nGuardado en resultados-evaluacion.json');
