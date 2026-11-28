import { z } from 'zod';
import { crearHandler, leerJson } from '../../lib/http/handler';
import { ok } from '../../lib/http/respuestas';
import { iniciarUsuario } from '../../lib/auth/seguridad';

const Schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
const handler = crearHandler('POST', async (req) => {
  const data = await leerJson(req, Schema);
  return ok(await iniciarUsuario(data.email, data.password));
});
export { handler as POST, handler as OPTIONS };
