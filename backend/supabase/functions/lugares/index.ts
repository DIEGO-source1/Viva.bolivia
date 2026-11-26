// GET /lugares  — catálogo completo para el mapa y la descarga offline
import { crearHandler } from '../_shared/http/handler.ts';
import { ok } from '../_shared/http/respuestas.ts';
import { listarCatalogo } from '../_shared/repositorios/lugares.repo.ts';

Deno.serve(crearHandler('GET', async () => {
  const catalogo = await listarCatalogo();
  return ok({ generado_en: new Date().toISOString(), ...catalogo });
}));
