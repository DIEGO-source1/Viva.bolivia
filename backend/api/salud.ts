// GET /api/salud  — comprueba que el backend y la base de datos responden
import { crearHandler } from '../lib/http/handler';
import { ok } from '../lib/http/respuestas';
import { consulta } from '../lib/db/cliente';

const handler = crearHandler('GET', async () => {
  const [fila] = await consulta<{ lugares: number }>('select count(*)::int as lugares from lugares');
  return ok({ estado: 'ok', lugares_en_catalogo: fila.lugares });
});

export { handler as GET, handler as OPTIONS };
