# BOLIVIA VIVA AI — frontend nacional

## Qué se adaptó
- Cambio de identidad de Viva Bolivia local a BOLIVIA VIVA AI.
- Home con saludo por departamento (estimación local a partir del GPS, si el usuario concede permiso).
- Búsqueda visual, acceso a VIVA AI, categorías y explorador de los nueve departamentos.
- Navegación inferior: Inicio, Explorar, Rutas, Guardados y Perfil.
- Vista de chat que envía el texto al endpoint de IA de rutas existente.
- Creador de rutas con el formulario Angular existente y sus resultados.
- Sección de mapa con permiso de geolocalización y enlaces a Google Maps.
- Vistas iniciales de Guardados y Pasaporte Cultural.
- Manifest y service worker básico para PWA (cachea shell estático; no cachea endpoints API).
- Skills de proyecto Impeccable, Taste, Emil Design Engineering y Animation Craft preservadas.

## Qué es funcional y qué queda como módulo visual
Funcional en el frontend actual:
- Navegación entre las cinco secciones.
- Selección manual de departamento.
- Solicitud voluntaria de geolocalización (el mapeo departamento-coordenadas es aproximado).
- Envío del prompt de chat al endpoint `/api/ruta`.
- Formulario manual/IA ya existente.
- Mapa embebido y apertura de Google Maps.

Módulos visuales/prototipo pendientes de backend:
- Guardado persistente de rutas y perfil de usuario.
- Pasaporte con visitas/medallas verificadas.
- VIVA LENS cámara + endpoint de escáner (backend ya tiene endpoint, falta conectar una UI segura de captura).
- Voz / dictado del chat.
- Eventos nacionales, reseñas, inventario real de restaurantes y alojamientos.
- Geolocalización exacta de departamento por polígonos oficiales; la estimación por rangos lat/lng es orientativa.
- Catálogo verificado de los nueve departamentos.

## PWA
Se incluye `public/manifest.webmanifest` y `public/sw.js`. El service worker cachea recursos de shell, excluye `/api/` para evitar guardar respuestas sensibles o desactualizadas. Para instalación PWA se necesita servir la app en HTTPS (localhost sirve para desarrollo).

## Datos y honestidad
Las tarjetas de departamentos son exploración editorial; no representan establecimientos o eventos verificados. El catálogo inicial del backend es de demostración y contiene precios/coordenadas aproximados; no debe publicarse como datos reales sin revisión.

## Ampliación VIVA LENS, voz y pasaporte
- VIVA LENS ahora permite capturar/seleccionar una imagen, comprimirla en el navegador y enviarla a `POST /api/escanear`.
- El escáner del backend reconoce únicamente platos presentes en la tabla `platos`; no identifica todavía lugares, objetos ni texto.
- Se añade dictado del mensaje mediante Web Speech API cuando el navegador lo soporta.
- Se añade lectura por voz mediante SpeechSynthesis en español.
- Las rutas generadas se pueden guardar y eliminar en localStorage del dispositivo. No es sincronización de cuenta ni nube.
- El pasaporte cultural tiene pantalla inicial, estado de progreso y sección Voces de Bolivia. No se conceden medallas automáticamente ni se publican testimonios inventados.
