// POST /generar-embeddings  — ADMIN: calcula embeddings de lugares nuevos
// Cabecera obligatoria: x-admin-key: <ADMIN_KEY>
// Ejecutar después de cargar o editar el catálogo.
import { env } from '../_shared/config/env.ts';
import { crearHandler } from '../_shared/http/handler.ts';
import { ErrorHttp, ok } from '../_shared/http/respuestas.ts';
import { generarEmbedding } from '../_shared/ia/embeddings.ts';
import { guardarEmbedding, lugaresSinEmbedding } from '../_shared/repositorios/lugares.repo.ts';

Deno.serve(crearHandler('POST', async (req) => {
  if (req.headers.get('x-admin-key') !== env.adminKey) throw new ErrorHttp(401, 'No autorizado');

  const lugares = await lugaresSinEmbedding(50);
  let procesados = 0;
  const fallidos: string[] = [];

  for (const l of lugares) {
    // deno-lint-ignore no-explicit-any
    const platos = ((l as any).lugar_plato ?? []).map((r: any) => r.platos?.nombre).filter(Boolean);
    const texto = [l.nombre, l.tipo, l.zona, l.descripcion, platos.length ? `Platos: ${platos.join(', ')}` : '']
      .filter(Boolean)
      .join('. ');

    const embedding = await generarEmbedding(texto);
    if (!embedding) {
      fallidos.push(l.id as string);
      continue;
    }
    await guardarEmbedding(l.id as string, embedding);
    procesados++;
  }

  return ok({ procesados, fallidos, pendientes_en_lote: lugares.length === 50 });
}));
