import { crearHandler } from '../../lib/http/handler';
import { ok } from '../../lib/http/respuestas';
import { autenticar } from '../../lib/auth/seguridad';
const handler = crearHandler('GET', async (req) => ok({ usuario: await autenticar(req) }));
export { handler as GET, handler as OPTIONS };
