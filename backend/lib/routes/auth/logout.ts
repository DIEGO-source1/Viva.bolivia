import { crearHandler } from '../../http/handler';
import { ok } from '../../http/respuestas';
import { revocarSesion } from '../../auth/seguridad';
const handler = crearHandler('POST', async (req) => {
  await revocarSesion(req);
  return ok({ mensaje: 'Sesión cerrada' });
});
export { handler as POST, handler as OPTIONS };
