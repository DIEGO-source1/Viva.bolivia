import type { Itinerario, Restricciones, Ruta } from './tipos.ts';

export interface Validacion {
  valido: boolean;
  problemas: string[];
}

/** Comprueba que la ruta respeta las restricciones (red de seguridad del planificador). */
export function validarRuta(ruta: Ruta, r: Restricciones): Validacion {
  const problemas: string[] = [];
  if (ruta.costo_max > r.presupuesto) problemas.push('La ruta supera el presupuesto');
  if (ruta.minutos_total > r.horas * 60) problemas.push('La ruta supera el tiempo disponible');
  const ids = ruta.paradas.map((p) => p.lugar.id);
  if (new Set(ids).size !== ids.length) problemas.push('Hay lugares repetidos');
  return { valido: problemas.length === 0, problemas };
}

// Detecta montos en el texto: "Bs 20", "Bs. 15", "20 Bs", "$5", "15 bolivianos".
const PATRON_PRECIO = /(bs\.?\s*\d)|(\d+\s*(bs\b|bolivianos?))|(\$\s*\d)|(\d+\s*(usd|d[oó]lares?))/i;

/**
 * Comprueba que el texto de la IA no inventó nada:
 *  - solo menciona lugares de la ruta, en el mismo número;
 *  - no repite lugares;
 *  - no escribe precios (esos los muestra la app desde la base de datos).
 */
export function validarItinerario(it: Itinerario, ruta: Ruta): Validacion {
  const problemas: string[] = [];
  const idsRuta = new Set(ruta.paradas.map((p) => p.lugar.id));
  const idsTexto = it.paradas.map((p) => p.lugar_id);

  for (const id of idsTexto) {
    if (!idsRuta.has(id)) problemas.push(`Lugar inventado o fuera de la ruta: ${id}`);
  }
  if (new Set(idsTexto).size !== idsTexto.length) problemas.push('El texto repite lugares');
  if (idsTexto.length !== idsRuta.size) problemas.push('El texto no cubre todas las paradas');

  const textos = [it.titulo, it.introduccion, it.consejo, ...it.paradas.map((p) => p.texto)];
  if (textos.some((t) => PATRON_PRECIO.test(t))) problemas.push('El texto menciona precios');

  return { valido: problemas.length === 0, problemas };
}
