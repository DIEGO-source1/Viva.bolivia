import { crearHandler } from '../../http/handler';
import { ok } from '../../http/respuestas';
import { autenticar } from '../../auth/seguridad';
const handler = crearHandler('GET', async (req) => ok({ usuario: await autenticar(req) }));
export { handler as GET, handler as OPTIONS };
