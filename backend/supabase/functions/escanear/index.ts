// POST /escanear  — foto de un plato → ficha + dónde probarlo
// Cuerpo: { imagenBase64, mediaType, idioma? }
import { crearHandler, leerJson } from '../_shared/http/handler.ts';
import { EntradaEscaner } from '../_shared/http/entradas.ts';
import { ok } from '../_shared/http/respuestas.ts';
import { escanearPlato } from '../_shared/servicios/escaner.service.ts';

Deno.serve(crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaEscaner);
  return ok(await escanearPlato(entrada));
}));
