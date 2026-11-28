import { crearHandler } from '../../lib/http/handler';
import { ok } from '../../lib/http/respuestas';
import { revocarSesion } from '../../lib/auth/seguridad';
const handler = crearHandler('POST', async (req) => {
  await revocarSesion(req);
  return ok({ mensaje: 'Sesión cerrada' });
});
export { handler as POST, handler as OPTIONS };
