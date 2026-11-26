// Pruebas unitarias del dominio (no necesitan internet ni base de datos).
// Ejecutar: deno test supabase/tests/planificador.test.ts
import { equal as assertEquals, ok as assert } from 'node:assert/strict';
import { planificar } from '../functions/_shared/dominio/planificador.ts';
import { validarItinerario, validarRuta } from '../functions/_shared/dominio/validador-ruta.ts';
import { kmEntre, minutosTraslado } from '../functions/_shared/dominio/distancia.ts';
import type { LugarCandidato } from '../functions/_shared/dominio/tipos.ts';

let contador = 0;
function lugar(p: Partial<LugarCandidato>): LugarCandidato {
  contador++;
  return {
    id: `00000000-0000-4000-8000-${String(contador).padStart(12, '0')}`,
    nombre: `Lugar ${contador}`,
    tipo: 'comida',
    zona: 'Centro',
    descripcion: 'Descripción de prueba',
    descripcion_en: null,
    lat: -17.3936,
    lng: -66.157,
    precio_min: 10,
    precio_max: 20,
    duracion_min: 30,
    verificado: true,
    fecha_verificacion: null,
    fuente: 'test',
    similitud: 0.5,
    ...p,
  };
}

const catalogo = [
  lugar({ nombre: 'Silpancho', tipo: 'comida', precio_min: 20, precio_max: 35, duracion_min: 40, lat: -17.3950, lng: -66.1590 }),
  lugar({ nombre: 'Plaza', tipo: 'cultura', precio_min: 0, precio_max: 0, duracion_min: 30, lat: -17.3936, lng: -66.1570 }),
  lugar({ nombre: 'Mercado', tipo: 'mercado', precio_min: 10, precio_max: 40, duracion_min: 60, lat: -17.4006, lng: -66.1557 }),
  lugar({ nombre: 'Cristo', tipo: 'mirador', precio_min: 0, precio_max: 20, duracion_min: 60, lat: -17.3840, lng: -66.1350 }),
  lugar({ nombre: 'Api', tipo: 'comida', precio_min: 8, precio_max: 15, duracion_min: 25, lat: -17.4000, lng: -66.1545 }),
  lugar({ nombre: 'Chicharrón', tipo: 'comida', precio_min: 35, precio_max: 60, duracion_min: 60, lat: -17.3950, lng: -66.2780 }),
];

Deno.test('respeta el presupuesto (usa precio máximo)', () => {
  for (const presupuesto of [15, 30, 60, 100, 200]) {
    const ruta = planificar(catalogo, { presupuesto, horas: 8 });
    assert(ruta.costo_max <= presupuesto, `costo ${ruta.costo_max} > ${presupuesto}`);
  }
});

Deno.test('respeta el tiempo disponible, incluyendo traslados', () => {
  for (const horas of [0.5, 1, 2, 3, 6]) {
    const ruta = planificar(catalogo, { presupuesto: 500, horas });
    assert(ruta.minutos_total <= horas * 60, `${ruta.minutos_total} min > ${horas * 60}`);
  }
});

Deno.test('devuelve ruta vacía si nada entra', () => {
  const ruta = planificar(catalogo.filter((l) => l.precio_max > 0), { presupuesto: 5, horas: 3 });
  assertEquals(ruta.paradas.length, 0);
  assertEquals(ruta.costo_max, 0);
});

Deno.test('no repite lugares y respeta el máximo de paradas', () => {
  const ruta = planificar(catalogo, { presupuesto: 1000, horas: 24, maxParadas: 4 });
  const ids = ruta.paradas.map((p) => p.lugar.id);
  assertEquals(new Set(ids).size, ids.length);
  assert(ruta.paradas.length <= 4);
});

Deno.test('prefiere lo más relevante (similitud) en la primera parada', () => {
  const lista = catalogo.map((l) => ({ ...l, similitud: l.nombre === 'Cristo' ? 0.95 : 0.1 }));
  const ruta = planificar(lista, { presupuesto: 100, horas: 4 });
  assertEquals(ruta.paradas[0].lugar.nombre, 'Cristo');
});

Deno.test('con origen, a igual relevancia elige el más cercano', () => {
  const ruta = planificar(catalogo, { presupuesto: 100, horas: 4, origen: { lat: -17.3936, lng: -66.157 } });
  assertEquals(ruta.paradas[0].lugar.nombre, 'Plaza');
});

Deno.test('agrega variedad: no pone 3 lugares de comida seguidos si hay otras opciones', () => {
  const ruta = planificar(catalogo, { presupuesto: 300, horas: 6 });
  const tipos = ruta.paradas.map((p) => p.lugar.tipo);
  assert(new Set(tipos).size >= 2, `tipos: ${tipos.join(',')}`);
});

Deno.test('validarRuta detecta una ruta que se pasa', () => {
  const ruta = planificar(catalogo, { presupuesto: 100, horas: 4 });
  assertEquals(validarRuta(ruta, { presupuesto: 100, horas: 4 }).valido, true);
  assertEquals(validarRuta({ ...ruta, costo_max: 101 }, { presupuesto: 100, horas: 4 }).valido, false);
});

Deno.test('validarItinerario rechaza lugares inventados y precios en el texto', () => {
  const ruta = planificar(catalogo, { presupuesto: 60, horas: 3 });
  const base = {
    titulo: 'Ruta',
    introduccion: 'Hola',
    consejo: 'Lleva agua',
    paradas: ruta.paradas.map((p) => ({ lugar_id: p.lugar.id, texto: 'Un lugar lindo.' })),
  };
  assertEquals(validarItinerario(base, ruta).valido, true);

  const inventado = { ...base, paradas: [...base.paradas, { lugar_id: '11111111-1111-4111-8111-111111111111', texto: 'x' }] };
  assertEquals(validarItinerario(inventado, ruta).valido, false);

  const conPrecio = { ...base, consejo: 'Cuesta Bs 25 en total' };
  assertEquals(validarItinerario(conPrecio, ruta).valido, false);

  const conDolares = { ...base, introduccion: 'Unos $5 por persona' };
  assertEquals(validarItinerario(conDolares, ruta).valido, false);
});

Deno.test('distancias y traslados razonables', () => {
  const km = kmEntre({ lat: -17.3936, lng: -66.157 }, { lat: -17.4006, lng: -66.1557 });
  assert(km > 0.6 && km < 1.0, `km = ${km}`);
  assertEquals(minutosTraslado(0), 0);
  assert(minutosTraslado(0.5) < minutosTraslado(5));
});
