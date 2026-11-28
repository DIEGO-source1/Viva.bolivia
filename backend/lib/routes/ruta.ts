// POST /api/ruta  — ruta con IA a partir de texto libre
// Cuerpo: { texto, idioma?, origen?: {lat,lng}, soloAbiertos? }
import { crearHandler, leerJson } from '../http/handler';
import { EntradaRutaIA } from '../http/entradas';
import { ok } from '../http/respuestas';
import { generarRutaConIA } from '../servicios/ruta.service';

const handler = crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaRutaIA);
  return ok(await generarRutaConIA(entrada));
});

export { handler as OPTIONS, handler as POST };
