import { kmEntre, minutosTraslado } from './distancia.ts';
import type { Coordenada, LugarCandidato, Parada, Restricciones, Ruta } from './tipos.ts';

/**
 * Arma una ruta que respeta presupuesto y tiempo. NO usa IA.
 *
 * Algoritmo voraz (greedy):
 *  1. Descarta lugares que solos ya no entran en el presupuesto o el tiempo.
 *  2. En cada paso elige el lugar con mejor puntaje que todavía entra.
 *  3. Para cuando no entra nada más o se llega al máximo de paradas.
 *
 * Usa precio_max para el presupuesto: es conservador, así la ruta
 * nunca se pasa del monto aunque el lugar cobre su precio más alto.
 */
export function planificar(candidatos: LugarCandidato[], r: Restricciones): Ruta {
  const maxParadas = r.maxParadas ?? 5;
  const minutosDisponibles = Math.floor(r.horas * 60);

  const pendientes = candidatos.filter(
    (c) => c.precio_max <= r.presupuesto && c.duracion_min <= minutosDisponibles,
  );

  const paradas: Parada[] = [];
  const tiposUsados = new Map<string, number>();
  let posicion: Coordenada | null = r.origen ?? null;
  let costoMin = 0;
  let costoMax = 0;
  let minutos = 0;
  let km = 0;

  while (paradas.length < maxParadas && pendientes.length > 0) {
    let mejorIndice = -1;
    let mejorPuntaje = -Infinity;
    let mejorKm = 0;
    let mejorMin = 0;

    for (let i = 0; i < pendientes.length; i++) {
      const c = pendientes[i];
      const kmT = posicion ? kmEntre(posicion, c) : 0;
      const minT = posicion ? minutosTraslado(kmT) : 0;

      if (costoMax + c.precio_max > r.presupuesto) continue;
      if (minutos + minT + c.duracion_min > minutosDisponibles) continue;

      const puntaje = puntuar(c, minT, tiposUsados.get(c.tipo) ?? 0, r.presupuesto);
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorIndice = i;
        mejorKm = kmT;
        mejorMin = minT;
      }
    }

    if (mejorIndice === -1) break;

    const [elegido] = pendientes.splice(mejorIndice, 1);
    paradas.push({
      orden: paradas.length + 1,
      lugar: elegido,
      km_traslado: redondear(mejorKm, 2),
      minutos_traslado: mejorMin,
    });
    tiposUsados.set(elegido.tipo, (tiposUsados.get(elegido.tipo) ?? 0) + 1);
    costoMin += elegido.precio_min;
    costoMax += elegido.precio_max;
    minutos += mejorMin + elegido.duracion_min;
    km += mejorKm;
    posicion = elegido;
  }

  return {
    paradas,
    costo_min: redondear(costoMin, 2),
    costo_max: redondear(costoMax, 2),
    minutos_total: minutos,
    km_total: redondear(km, 2),
  };
}

/**
 * Puntaje de un candidato (más alto = mejor):
 *  - 50% relevancia: qué tanto coincide con lo que pidió el usuario.
 *  - 40% cercanía: menos minutos de traslado, mejor.
 *  - penaliza repetir el mismo tipo (variedad).
 *  - bonus pequeño si el dato está verificado.
 *  - desempate: más barato primero.
 */
export function puntuar(
  c: LugarCandidato,
  minutosTraslado: number,
  repetidosDelTipo: number,
  presupuesto: number,
): number {
  const relevancia = Math.max(0, Math.min(1, c.similitud));
  const cercania = 1 / (1 + minutosTraslado / 10);
  const variedad = -0.3 * repetidosDelTipo;
  const confianza = c.verificado ? 0.1 : 0;
  const economia = presupuesto > 0 ? -0.05 * (c.precio_max / presupuesto) : 0;
  return relevancia * 0.5 + cercania * 0.4 + variedad + confianza + economia;
}

function redondear(n: number, decimales: number): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}
