// POST /api/ruta-sin-ia  — ruta desde un formulario, sin IA (para comparar)
// Cuerpo: { presupuesto, horas, tipos?, zona?, idioma?, origen?, soloAbiertos? }
import { crearHandler, leerJson } from '../http/handler';
import { EntradaRutaSinIA } from '../http/entradas';
import { ok } from '../http/respuestas';
import { generarRutaSinIA } from '../servicios/ruta.service';

const handler = crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaRutaSinIA);
  return ok(await generarRutaSinIA(entrada));
});

export { handler as OPTIONS, handler as POST };
