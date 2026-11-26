import { db } from '../db/cliente.ts';

export async function nombresPlatos(): Promise<string[]> {
  const { data, error } = await db().from('platos').select('nombre').order('nombre');
  if (error) throw new Error(`nombresPlatos: ${error.message}`);
  return (data ?? []).map((p) => p.nombre as string);
}

/** Ficha del plato + lugares activos donde se sirve. */
export async function platoConLugares(nombre: string) {
  const { data, error } = await db()
    .from('platos')
    .select(
      'id, nombre, nombre_en, descripcion, descripcion_en, ingredientes, historia, fuente, lugar_plato(precio, lugares(id, nombre, zona, lat, lng, verificado, activo))',
    )
    .eq('nombre', nombre)
    .maybeSingle();
  if (error) throw new Error(`platoConLugares: ${error.message}`);
  if (!data) return null;

  // deno-lint-ignore no-explicit-any
  const relaciones = (data.lugar_plato ?? []) as any[];
  const donde_probar = relaciones
    .filter((r) => r.lugares?.activo)
    .map((r) => ({ ...r.lugares, precio: r.precio === null ? null : Number(r.precio) }));

  const { lugar_plato: _omitido, ...plato } = data;
  return { ...plato, donde_probar };
}
