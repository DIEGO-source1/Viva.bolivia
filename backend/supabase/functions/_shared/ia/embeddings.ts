// Embeddings con el modelo gte-small que Supabase ejecuta dentro de
// las Edge Functions: gratis, sin API externa, 384 dimensiones.
// Si no está disponible (por ejemplo en tests locales), devuelve null
// y la búsqueda sigue funcionando solo con filtros SQL.

// deno-lint-ignore no-explicit-any
declare const Supabase: any;

// deno-lint-ignore no-explicit-any
let sesion: any = null;

export async function generarEmbedding(texto: string): Promise<number[] | null> {
  const limpio = texto.trim();
  if (!limpio) return null;
  try {
    sesion ??= new Supabase.ai.Session('gte-small');
    const vector = await sesion.run(limpio, { mean_pool: true, normalize: true });
    return Array.from(vector as ArrayLike<number>);
  } catch (e) {
    console.warn('[embeddings] no disponible:', (e as Error).message);
    return null;
  }
}
