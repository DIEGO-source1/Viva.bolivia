import { z } from 'zod';
import { crearHandler, leerJson } from '../../http/handler';
import { ok, ErrorHttp } from '../../http/respuestas';
import { exigirAdmin } from '../../auth/seguridad';
import { consulta } from '../../db/cliente';

const Departamento = z.enum([
  'La Paz','Santa Cruz','Cochabamba','Oruro','Potosí','Chuquisaca','Tarija','Beni','Pando'
]);
const Lugar = z.object({
  nombre: z.string().trim().min(2).max(160),
  tipo: z.enum(['comida','mercado','mirador','cultura','naturaleza','otro']),
  zona: z.string().max(120).nullable().optional(),
  descripcion: z.string().max(5000).optional(),
  etiquetas: z.string().max(1000).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  precio_min: z.number().min(0),
  precio_max: z.number().min(0),
  duracion_min: z.number().int().min(1).max(1440),
  fuente: z.string().trim().min(2).max(300),
  departamento: Departamento,
  imagen_url: z.string().url().nullable().optional(),
  galeria_urls: z.array(z.string().url()).max(12).default([]),
});
const Action = z.discriminatedUnion('action', [
  z.object({ action: z.literal('crear'), lugar: Lugar }),
  z.object({ action: z.literal('actualizar'), id: z.string().uuid(), lugar: Lugar }),
  z.object({ action: z.literal('eliminar'), id: z.string().uuid() }),
]);

const get = crearHandler('GET', async (req) => {
  await exigirAdmin(req);
  const rows = await consulta('select * from lugares order by creado_en desc');
  return ok({ lugares: rows });
});
const post = crearHandler('POST', async (req) => {
  await exigirAdmin(req);
  const data = await leerJson(req, Action);
  if (data.action === 'eliminar') {
    const rows = await consulta('update lugares set activo=false where id=$1 returning id',[data.id]);
    if (!rows.length) throw new ErrorHttp(404,'Lugar no encontrado');
    return ok({ desactivado: true });
  }
  const l = data.lugar;
  if (l.precio_max < l.precio_min) throw new ErrorHttp(400,'El precio máximo no puede ser menor al mínimo');
  if (data.action === 'crear') {
    const [row] = await consulta(
      `insert into lugares(nombre,tipo,zona,descripcion,etiquetas,lat,lng,precio_min,precio_max,duracion_min,fuente,departamento,imagen_url,galeria_urls)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       returning id,nombre,departamento`,
      [l.nombre,l.tipo,l.zona??null,l.descripcion??'',l.etiquetas??'',l.lat,l.lng,l.precio_min,l.precio_max,l.duracion_min,l.fuente,l.departamento,l.imagen_url??null,l.galeria_urls],
    );
    return ok(row,201);
  }
  const [row] = await consulta(
    `update lugares set nombre=$2,tipo=$3,zona=$4,descripcion=$5,etiquetas=$6,lat=$7,lng=$8,
     precio_min=$9,precio_max=$10,duracion_min=$11,fuente=$12,departamento=$13,imagen_url=$14,galeria_urls=$15
     where id=$1 returning id,nombre,departamento`,
    [data.id,l.nombre,l.tipo,l.zona??null,l.descripcion??'',l.etiquetas??'',l.lat,l.lng,l.precio_min,l.precio_max,l.duracion_min,l.fuente,l.departamento,l.imagen_url??null,l.galeria_urls],
  );
  if (!row) throw new ErrorHttp(404,'Lugar no encontrado');
  return ok(row);
});
export { get as GET, post as POST, get as OPTIONS };
