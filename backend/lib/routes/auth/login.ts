import { z } from 'zod';
import { crearHandler, leerJson } from '../../http/handler';
import { ok } from '../../http/respuestas';
import { iniciarUsuario } from '../../auth/seguridad';

const Schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
const handler = crearHandler('POST', async (req) => {
  const data = await leerJson(req, Schema);
  return ok(await iniciarUsuario(data.email, data.password));
});
export { handler as POST, handler as OPTIONS };
