// POST /api/ruta  — ruta con IA a partir de texto libre
// Cuerpo: { texto, idioma?, origen?: {lat,lng}, soloAbiertos? }
import { crearHandler, leerJson } from '../lib/http/handler';
import { EntradaRutaIA } from '../lib/http/entradas';
import { ok } from '../lib/http/respuestas';
import { generarRutaConIA } from '../lib/servicios/ruta.service';

const handler = crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaRutaIA);
  return ok(await generarRutaConIA(entrada));
});

export { handler as OPTIONS, handler as POST };
