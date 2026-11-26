// GET /api/lugares  — catálogo completo para el mapa y la descarga offline
import { crearHandler } from '../lib/http/handler';
import { ok } from '../lib/http/respuestas';
import { listarCatalogo } from '../lib/repositorios/lugares.repo';

const handler = crearHandler('GET', async () => {
  const catalogo = await listarCatalogo();
  return ok({ generado_en: new Date().toISOString(), ...catalogo });
});

export { handler as GET, handler as OPTIONS };
