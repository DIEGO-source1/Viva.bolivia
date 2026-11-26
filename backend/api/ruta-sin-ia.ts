// POST /api/ruta-sin-ia  — ruta desde un formulario, sin IA (para comparar)
// Cuerpo: { presupuesto, horas, tipos?, zona?, idioma?, origen?, soloAbiertos? }
import { crearHandler, leerJson } from '../lib/http/handler';
import { EntradaRutaSinIA } from '../lib/http/entradas';
import { ok } from '../lib/http/respuestas';
import { generarRutaSinIA } from '../lib/servicios/ruta.service';

const handler = crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaRutaSinIA);
  return ok(await generarRutaSinIA(entrada));
});

export { handler as OPTIONS, handler as POST };
