import type { Idioma, Itinerario, Ruta } from './tipos.ts';

/**
 * Itinerario sin IA: se usa en /ruta-sin-ia y como respaldo
 * cuando el modelo falla o su texto no pasa la validación.
 */
export function plantillaSimple(ruta: Ruta, idioma: Idioma): Itinerario {
  const es = idioma === 'es';
  const horas = (ruta.minutos_total / 60).toFixed(1);

  return {
    titulo: es ? `Tu ruta de ${ruta.paradas.length} paradas` : `Your ${ruta.paradas.length}-stop route`,
    introduccion: es
      ? `Una ruta de aproximadamente ${horas} horas por Cochabamba.`
      : `A route of about ${horas} hours around Cochabamba.`,
    paradas: ruta.paradas.map((p) => {
      const desc = es ? p.lugar.descripcion : (p.lugar.descripcion_en ?? p.lugar.descripcion);
      const traslado = p.minutos_traslado > 0
        ? (es ? ` (a ${p.minutos_traslado} min de la parada anterior)` : ` (${p.minutos_traslado} min from the previous stop)`)
        : '';
      return { lugar_id: p.lugar.id, texto: `${p.lugar.nombre}${traslado}. ${desc ?? ''}`.trim() };
    }),
    consejo: es
      ? 'Confirma horarios antes de ir; algunos datos pueden cambiar.'
      : 'Check opening hours before going; some details may change.',
  };
}
