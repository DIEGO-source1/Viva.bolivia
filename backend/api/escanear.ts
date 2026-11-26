// POST /api/escanear  — foto de un plato → ficha + dónde probarlo
// Cuerpo: { imagenBase64, mediaType, idioma? }
// Nota: Vercel limita el cuerpo a ~4.5 MB; comprime la foto en Angular antes de enviarla.
import { crearHandler, leerJson } from '../lib/http/handler';
import { EntradaEscaner } from '../lib/http/entradas';
import { ok } from '../lib/http/respuestas';
import { escanearPlato } from '../lib/servicios/escaner.service';

const handler = crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaEscaner);
  return ok(await escanearPlato(entrada));
});

export { handler as OPTIONS, handler as POST };
