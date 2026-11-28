import { z } from 'zod';
import { crearHandler, leerJson } from '../http/handler';
import { ok, ErrorHttp } from '../http/respuestas';
import { autenticar } from '../auth/seguridad';
import { consulta } from '../db/cliente';

const NuevaRuta = z.object({
  nombre: z.string().trim().min(2).max(120),
  parametros: z.record(z.string(), z.unknown()).default({}),
  resultado: z.record(z.string(), z.unknown()),
});
const get = crearHandler('GET', async (req) => {
  const user = await autenticar(req);
  const rutas = await consulta(
    'select id,nombre,parametros,resultado,creado_en,actualizado_en from rutas_guardadas where usuario_id=$1 order by creado_en desc',
    [user.id],
  );
  return ok({ rutas });
});
const post = crearHandler('POST', async (req) => {
  const user = await autenticar(req);
  const data = await leerJson(req, NuevaRuta);
  const [ruta] = await consulta(
    'insert into rutas_guardadas(usuario_id,nombre,parametros,resultado) values($1,$2,$3::jsonb,$4::jsonb) returning id,nombre,creado_en',
    [user.id,data.nombre,JSON.stringify(data.parametros),JSON.stringify(data.resultado)],
  );
  return ok(ruta, 201);
});
const del = crearHandler('DELETE', async (req) => {
  const user = await autenticar(req);
  const body = await leerJson(req, z.object({ id: z.string().uuid() }));
  const rows = await consulta('delete from rutas_guardadas where id=$1 and usuario_id=$2 returning id',[body.id,user.id]);
  if (!rows.length) throw new ErrorHttp(404,'Ruta no encontrada');
  return ok({ eliminado: true });
});
export { get as GET, post as POST, del as DELETE, get as OPTIONS };
