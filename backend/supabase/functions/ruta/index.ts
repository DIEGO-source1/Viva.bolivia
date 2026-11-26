// POST /ruta  — ruta con IA a partir de texto libre
// Cuerpo: { texto, idioma?, origen?: {lat,lng}, soloAbiertos? }
import { crearHandler, leerJson } from '../_shared/http/handler.ts';
import { EntradaRutaIA } from '../_shared/http/entradas.ts';
import { ok } from '../_shared/http/respuestas.ts';
import { generarRutaConIA } from '../_shared/servicios/ruta.service.ts';

Deno.serve(crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaRutaIA);
  return ok(await generarRutaConIA(entrada));
}));
