-- =========================================================
-- DATOS DE EJEMPLO PARA PRACTICAR
-- Precios, horarios y coordenadas son APROXIMADOS y NO verificados.
-- Reemplázalos con datos reales (visita, menú, web oficial) antes de la demo
-- y actualiza: fuente, fecha_verificacion y verificado = true.
-- =========================================================

insert into lugares
  (nombre, tipo, zona, descripcion, descripcion_en, lat, lng, precio_min, precio_max, duracion_min, hora_apertura, hora_cierre, fuente, verificado)
values
  ('Plaza 14 de Septiembre', 'cultura', 'Centro',
   'Plaza principal de la ciudad, rodeada de la catedral y edificios coloniales.',
   'Main square of the city, surrounded by the cathedral and colonial buildings.',
   -17.3936, -66.1570, 0, 0, 30, null, null, 'EJEMPLO - verificar', false),

  ('Mercado La Cancha', 'mercado', 'La Cancha',
   'Uno de los mercados populares más grandes de Bolivia; comida, frutas y artesanías.',
   'One of the largest open-air markets in Bolivia; food, fruit and crafts.',
   -17.4006, -66.1557, 10, 40, 60, '07:00', '19:00', 'EJEMPLO - verificar', false),

  ('Cristo de la Concordia', 'mirador', 'Cerro San Pedro',
   'Mirador sobre la ciudad con la estatua del Cristo; se sube en teleférico o a pie.',
   'Viewpoint over the city with the Christ statue; reachable by cable car or on foot.',
   -17.3840, -66.1350, 0, 20, 60, '10:00', '18:00', 'EJEMPLO - verificar', false),

  ('Palacio Portales', 'cultura', 'Queru Queru',
   'Antigua residencia de Simón I. Patiño, hoy centro cultural con jardines.',
   'Former residence of Simón I. Patiño, now a cultural centre with gardens.',
   -17.3768, -66.1557, 10, 20, 60, '15:00', '18:00', 'EJEMPLO - verificar', false),

  ('Laguna Alalay', 'naturaleza', 'Alalay',
   'Laguna urbana para caminar y observar aves.',
   'Urban lagoon for walking and birdwatching.',
   -17.4050, -66.1400, 0, 0, 45, null, null, 'EJEMPLO - verificar', false),

  ('Silpanchería de barrio (ejemplo)', 'comida', 'Centro',
   'Puesto tradicional de silpancho cochabambino.',
   'Traditional stall serving Cochabamba-style silpancho.',
   -17.3950, -66.1590, 20, 35, 40, '11:00', '22:00', 'EJEMPLO - verificar', false),

  ('Picantería tradicional (ejemplo)', 'comida', 'Cala Cala',
   'Picantería con platos típicos del valle: pique macho, chicharrón y más.',
   'Traditional eatery with valley dishes: pique macho, chicharrón and more.',
   -17.3800, -66.1600, 30, 60, 60, '11:00', '16:00', 'EJEMPLO - verificar', false),

  ('Puesto de api y pasteles (ejemplo)', 'comida', 'La Cancha',
   'Api morado caliente con pastel, ideal para la mañana o la tarde.',
   'Hot purple corn drink (api) with fried pastry, great in the morning or afternoon.',
   -17.4000, -66.1545, 8, 15, 25, '06:30', '11:00', 'EJEMPLO - verificar', false),

  ('Chicharronería del valle (ejemplo)', 'comida', 'Quillacollo',
   'Chicharrón de cerdo con mote y llajua, plato fuerte de fin de semana.',
   'Pork chicharrón with hominy and llajua salsa, a weekend favourite.',
   -17.3950, -66.2780, 35, 60, 60, '09:00', '15:00', 'EJEMPLO - verificar', false),

  ('Trancapecho de esquina (ejemplo)', 'comida', 'Centro',
   'Sándwich de silpancho, rápido y económico.',
   'Silpancho sandwich, quick and cheap.',
   -17.3925, -66.1555, 8, 15, 20, '17:00', '23:00', 'EJEMPLO - verificar', false);

insert into platos (nombre, nombre_en, descripcion, descripcion_en, ingredientes, historia, fuente) values
  ('Silpancho', 'Silpancho',
   'Carne apanada muy delgada sobre arroz y papa, con huevo frito y ensalada.',
   'Thin breaded beef over rice and potatoes, topped with fried egg and salad.',
   array['carne de res','arroz','papa','huevo','tomate','cebolla'],
   'Plato emblemático de Cochabamba.', 'EJEMPLO - verificar'),
  ('Pique macho', 'Pique macho',
   'Trozos de carne y salchicha con papas fritas, locoto, cebolla y huevo.',
   'Chunks of beef and sausage with fries, locoto pepper, onion and egg.',
   array['carne de res','salchicha','papa','locoto','cebolla','huevo'],
   'Plato abundante para compartir, asociado a Cochabamba.', 'EJEMPLO - verificar'),
  ('Chicharrón', 'Chicharrón',
   'Carne de cerdo cocida en su propia grasa, servida con mote y llajua.',
   'Pork cooked in its own fat, served with hominy and llajua salsa.',
   array['cerdo','mote','llajua'],
   'Tradicional en Quillacollo y el valle.', 'EJEMPLO - verificar'),
  ('Api con pastel', 'Api with pastel',
   'Bebida caliente de maíz morado acompañada de pastel frito con queso.',
   'Hot purple corn drink served with a fried cheese pastry.',
   array['maíz morado','canela','clavo','harina','queso'],
   'Desayuno o merienda típica andina.', 'EJEMPLO - verificar'),
  ('Trancapecho', 'Trancapecho',
   'Sándwich relleno con los ingredientes del silpancho.',
   'Sandwich filled with silpancho ingredients.',
   array['pan','carne de res','arroz','papa','huevo'],
   'Versión callejera del silpancho.', 'EJEMPLO - verificar');

insert into lugar_plato (lugar_id, plato_id, precio)
select l.id, p.id, x.precio
from (values
  ('Silpanchería de barrio (ejemplo)',   'Silpancho',      25),
  ('Picantería tradicional (ejemplo)',   'Pique macho',    50),
  ('Picantería tradicional (ejemplo)',   'Chicharrón',     45),
  ('Puesto de api y pasteles (ejemplo)', 'Api con pastel', 10),
  ('Chicharronería del valle (ejemplo)', 'Chicharrón',     45),
  ('Trancapecho de esquina (ejemplo)',   'Trancapecho',    12),
  ('Mercado La Cancha',                  'Api con pastel', 10)
) as x(lugar, plato, precio)
join lugares l on l.nombre = x.lugar
join platos  p on p.nombre = x.plato;

-- Palabras clave para la búsqueda (platos, estilo, momento del día)
update lugares set etiquetas = x.etiquetas
from (values
  ('Plaza 14 de Septiembre',             'historia colonial catedral centro gratis caminar'),
  ('Mercado La Cancha',                  'mercado popular artesanías frutas comida barata api'),
  ('Cristo de la Concordia',             'vista panorámica teleférico mirador fotos'),
  ('Palacio Portales',                   'historia museo jardines patiño arquitectura'),
  ('Laguna Alalay',                      'naturaleza aves caminar gratis aire libre'),
  ('Silpanchería de barrio (ejemplo)',   'silpancho tradicional típico económico almuerzo cena'),
  ('Picantería tradicional (ejemplo)',   'pique macho chicharrón picante tradicional típico almuerzo compartir'),
  ('Puesto de api y pasteles (ejemplo)', 'api pastel desayuno merienda tradicional económico'),
  ('Chicharronería del valle (ejemplo)', 'chicharrón tradicional típico fin de semana quillacollo'),
  ('Trancapecho de esquina (ejemplo)',   'trancapecho silpancho sándwich rápido económico noche')
) as x(nombre, etiquetas)
where lugares.nombre = x.nombre;
