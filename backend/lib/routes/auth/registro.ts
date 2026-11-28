import { z } from 'zod';
import { crearHandler, leerJson } from '../../http/handler';
import { ok } from '../../http/respuestas';
import { registrarVisitante } from '../../auth/seguridad';

const Schema = z.object({
  email: z.string().email().max(254),
  nombre: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(200),
});

const handler = crearHandler('POST', async (req) => {
  const data = await leerJson(req, Schema);
  return ok(await registrarVisitante(data.email, data.nombre, data.password), 201);
});
export { handler as POST, handler as OPTIONS };
