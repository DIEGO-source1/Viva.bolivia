# Viva Bolivia — rediseño editorial y exploración con mapas

## Dirección visual
- Referencia: composición cinematográfica editorial de la imagen de inspiración del usuario.
- Fotografía panorámica original generada para representar el valle de Cochabamba y la cordillera.
- Paleta bosque, arcilla, papel cálido y oro apagado; tipografía DM Serif Display + DM Sans.
- Skills de proyecto: `impeccable`, `taste`, `animation-craft`, `emil-design-engineering`.

## Funcionalidad preservada
- Se conserva Angular, los formularios IA/manuales, sus bindings, validaciones, eventos, modelos, llamadas de API, estados de carga y errores.

## Google Maps y ubicación
- Mapa de Google incrustado en la página.
- El usuario pulsa «Usar mi ubicación» y decide si concede el permiso del navegador.
- Con coordenadas de la ruta, se puede abrir el recorrido completo en Google Maps con origen, destino y paradas intermedias.
- Se añade acceso a una búsqueda de hospedajes en Google Maps cerca del destino final.
- El mapa incrustado centra la ubicación del usuario, primera parada o Cochabamba como alternativa.
- No se consulta inventario hotelero ni se presentan hospedajes como verificados; el botón abre una búsqueda en Google Maps.

## Google Maps Platform
La integración actual usa un mapa de búsqueda incrustado y Google Maps URLs para abrir rutas y búsquedas, sin API key propia. Para mostrar rutas dibujadas y datos Places dentro de la aplicación, hay que configurar una API key restringida en Google Cloud y habilitar Maps JavaScript API, Places API (New) y Routes API con facturación activa.

## Verificación
- Comprobación estructural de plantilla Angular y bindings existentes: correcta.
- La compilación no se pudo ejecutar: npm ci falló por permisos en el entorno y Node v22.16.0 es inferior al requisito de dependencias Angular 22.3 (Node v22.22.3 o superior).
- Pendiente: ejecutar instalación y `npm run build` en un entorno local con la versión Node compatible, y comprobar la geolocalización/mapa en navegador.

## Mejora adicional del mapa
- El mapa incrustado ahora busca la secuencia de destinos de la ruta generada, no solo la primera parada.
- Se muestra un resumen del recorrido y una lista numerada de paradas junto al mapa.
- La URL de indicaciones incluye origen, destino y hasta nueve puntos intermedios, sujeto a las limitaciones de Google Maps URLs.
- El mapa se actualiza al generar una nueva ruta.

## Revisión de dirección visual (27-11-2026)
- Se sustituyó el hero editorial claro anterior por una composición cinematográfica oscura inspirada en la referencia Voyage compartida por el usuario.
- Imagen panorámica local del valle como fondo del hero.
- Título grande de alto contraste, CTA y tres tarjetas visuales de inspiración.
- Navegación oscura y sección de planificador separada debajo del hero.
- Las tarjetas son accesos de inspiración al planificador; no afirman que esos tres destinos sean resultados verificados del catálogo.
- Se mantiene el formulario real, resultados, mapa, geolocalización voluntaria y enlaces a Google Maps.
