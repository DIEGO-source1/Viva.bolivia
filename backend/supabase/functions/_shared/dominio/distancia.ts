import type { Coordenada } from './tipos.ts';

const RADIO_TIERRA_KM = 6371;

/** Distancia en línea recta entre dos puntos (fórmula de haversine). */
export function kmEntre(a: Coordenada, b: Coordenada): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

// SUPUESTOS EXPLÍCITOS (mencionarlos en el pitch, criterio C):
// - Hasta 1.5 km se camina a 4.5 km/h.
// - Más lejos se toma taxi o trufi a 20 km/h promedio + 5 min de espera.
// - La distancia real por calles es ~1.3 veces la línea recta.
export const SUPUESTOS_TRASLADO = {
  kmMaxCaminando: 1.5,
  velocidadCaminandoKmh: 4.5,
  velocidadTransporteKmh: 20,
  minutosEsperaTransporte: 5,
  factorCalles: 1.3,
} as const;

export function minutosTraslado(kmLineaRecta: number): number {
  const s = SUPUESTOS_TRASLADO;
  const km = kmLineaRecta * s.factorCalles;
  if (km === 0) return 0;
  if (km <= s.kmMaxCaminando) return Math.ceil((km / s.velocidadCaminandoKmh) * 60);
  return Math.ceil((km / s.velocidadTransporteKmh) * 60) + s.minutosEsperaTransporte;
}
