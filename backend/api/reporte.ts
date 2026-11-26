// POST /api/reporte  — un usuario avisa que un dato está mal (supervisión humana)
// Cuerpo: { lugar_id, tipo, comentario? }
import { crearHandler, leerJson } from '../lib/http/handler';
import { EntradaReporte } from '../lib/http/entradas';
import { ErrorHttp, ok } from '../lib/http/respuestas';
import { existeLugar } from '../lib/repositorios/lugares.repo';
import { crearReporte } from '../lib/repositorios/reportes.repo';

const handler = crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaReporte);
  if (!(await existeLugar(entrada.lugar_id))) throw new ErrorHttp(404, 'El lugar no existe');
  const reporte = await crearReporte(entrada);
  return ok({ ...reporte, mensaje: 'Gracias, lo revisaremos.' }, 201);
});

export { handler as OPTIONS, handler as POST };
