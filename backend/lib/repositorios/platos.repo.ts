import { consulta } from '../db/cliente';

export async function nombresPlatos(): Promise<string[]> {
  const filas = await consulta<{ nombre: string }>('select nombre from platos order by nombre');
  return filas.map((f) => f.nombre);
}

/** Ficha del plato + lugares activos donde se sirve. */
export async function platoConLugares(nombre: string) {
  const [plato] = await consulta(
    `select id, nombre, nombre_en, descripcion, descripcion_en, ingredientes, historia, fuente
     from platos where nombre = $1`,
    [nombre],
  );
  if (!plato) return null;

  const donde_probar = await consulta(
    `select l.id, l.nombre, l.zona, l.lat, l.lng, l.verificado, lp.precio::float8 as precio
     from lugar_plato lp
     join lugares l on l.id = lp.lugar_id
     where lp.plato_id = $1 and l.activo
     order by l.verificado desc, l.nombre`,
    [plato.id],
  );
  return { ...plato, donde_probar };
}
