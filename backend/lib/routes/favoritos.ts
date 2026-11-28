import { z } from 'zod';
import { crearHandler, leerJson } from '../http/handler';
import { ok, ErrorHttp } from '../http/respuestas';
import { autenticar } from '../auth/seguridad';
import { consulta } from '../db/cliente';

const Body = z.object({ lugar_id: z.string().uuid() });

const get = crearHandler('GET', async (req) => {
  const user = await autenticar(req);
  const rows = await consulta(
    `select l.* from favoritos f join lugares l on l.id = f.lugar_id
     where f.usuario_id = $1 and l.activo = true order by f.creado_en desc`,
    [user.id],
  );
  return ok({ favoritos: rows });
});
const post = crearHandler('POST', async (req) => {
  const user = await autenticar(req);
  const { lugar_id } = await leerJson(req, Body);
  const [place] = await consulta('select id from lugares where id = $1 and activo = true', [lugar_id]);
  if (!place) throw new ErrorHttp(404, 'Lugar no encontrado');
  await consulta('insert into favoritos(usuario_id,lugar_id) values($1,$2) on conflict do nothing', [user.id,lugar_id]);
  return ok({ guardado: true }, 201);
});
const del = crearHandler('DELETE', async (req) => {
  const user = await autenticar(req);
  const { lugar_id } = await leerJson(req, Body);
  await consulta('delete from favoritos where usuario_id = $1 and lugar_id = $2', [user.id,lugar_id]);
  return ok({ eliminado: true });
});
export { get as GET, post as POST, del as DELETE, get as OPTIONS };
