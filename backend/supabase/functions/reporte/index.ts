// POST /reporte  — un usuario avisa que un dato está mal (supervisión humana)
// Cuerpo: { lugar_id, tipo, comentario? }
import { crearHandler, leerJson } from '../_shared/http/handler.ts';
import { EntradaReporte } from '../_shared/http/entradas.ts';
import { ErrorHttp, ok } from '../_shared/http/respuestas.ts';
import { existeLugar } from '../_shared/repositorios/lugares.repo.ts';
import { crearReporte } from '../_shared/repositorios/reportes.repo.ts';

Deno.serve(crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaReporte);
  if (!(await existeLugar(entrada.lugar_id))) throw new ErrorHttp(404, 'El lugar no existe');
  const reporte = await crearReporte(entrada);
  return ok({ ...reporte, mensaje: 'Gracias, lo revisaremos.' }, 201);
}));
