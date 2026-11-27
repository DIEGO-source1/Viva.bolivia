# Viva Bolivia — preparación Neon + Vercel + Claude

## Resultado del análisis del ZIP recibido

El proyecto ya contiene una implementación backend orientada a Neon + Vercel + Claude. No hace falta sustituir el driver ni reescribir los endpoints.

### Dependencias detectadas
- Backend: `@neondatabase/serverless` para PostgreSQL sobre HTTP, `zod` para validar entradas.
- Backend de desarrollo: `tsx`, `typescript`, `@electric-sql/pglite` para pruebas locales.
- Frontend: Angular 22.3, RxJS 7.8 y TypeScript 6.
- La interfaz llama a `/api/ruta`, `/api/ruta-sin-ia` y `/api/salud`.
- Las funciones Vercel están en `backend/api/*.ts`.

### Modelo de IA
- El backend ya implementa llamadas a Anthropic Messages API en `backend/lib/ia/cliente-ia.ts`.
- La variable `IA_API_KEY` está vacía en el ejemplo; no se encontró ninguna clave real en el ZIP.
- El modelo configurado por defecto es `claude-haiku-5-5`, un ID válido de la documentación actual de Anthropic.
- El servidor valida la respuesta estructurada y dispone de plantilla de respaldo para la redacción del itinerario.

### Esquema PostgreSQL detectado
Tablas:
- `lugares`: catálogo, coordenadas, tipo, precios, horarios, fuente, verificación, búsqueda de texto.
- `platos`: catálogo gastronómico.
- `lugar_plato`: relación lugar/plato y precio.
- `rutas_log`: métricas técnicas y consumo de tokens; no guarda texto original del usuario ni su ubicación.
- `reportes`: observaciones de usuarios sobre lugares.

Función:
- `buscar_lugares(...)`: filtra por presupuesto, tipo, zona, hora y relevancia textual en español.

Índices:
- GIN para `tsvector` de `lugares`.
- Índice parcial por tipo y lugares activos.
- Índice temporal de logs.

### Migraciones heredadas
El ZIP también contiene migraciones Supabase y funciones Edge antiguas. Se conservan intactas por trazabilidad, pero NO se deben ejecutar en Neon: usan esquema `public` con pgvector/`extensions.vector` y pertenecen a la arquitectura anterior.
Las migraciones Neon válidas para esta arquitectura están ahora en `backend/db/migrations/`.

## Nueva base de datos Neon

La decisión confirmada es crear una base nueva. No se ha conectado ni modificado ningún proyecto remoto; no se han borrado datos ni credenciales.

1. Crea un proyecto nuevo en Neon Console.
2. Selecciona una región próxima a Bolivia (por ejemplo São Paulo si está disponible en tu cuenta).
3. Abre SQL Editor.
4. Ejecuta en orden:
   - `backend/db/migrations/0001_core_schema.sql`
   - `backend/db/migrations/0002_search_function.sql`
5. Comprueba que `schema_migrations` contenga `0001` y `0002`.
6. No ejecutes `backend/db/SEED_DEMO_SOLO_PRUEBAS.sql` en producción: contiene registros con precios, horarios y coordenadas de ejemplo no verificados.

Para runtime, copia la connection string pooled (hostname con `-pooler`) y guárdala como `DATABASE_URL` en Vercel. `DATABASE_URL_UNPOOLED` queda reservada para herramientas de migración que necesiten conexión directa.

## Despliegue recomendado: dos proyectos Vercel desde el mismo repositorio

### Proyecto 1: backend
- Importa el repositorio Git.
- Root Directory: `backend`.
- Framework preset: Other.
- Build command: `npm run typecheck` (opcional pero recomendado como control previo).
- Install command: `npm install`.
- Output directory: dejar vacío.
- Variables:
  - `DATABASE_URL`: connection string pooled de Neon.
  - `IA_API_KEY`: clave de Anthropic, solo en backend.
  - `IA_MODELO`: `claude-haiku-5-5`.
  - `IA_MODELO_VISION`: `claude-haiku-5-5` (si se utiliza escáner visual).
  - `CORS_ORIGIN`: URL exacta del frontend desplegado.
- Despliega y prueba `https://TU-BACKEND.vercel.app/api/salud`.

### Proyecto 2: frontend
- Importa el mismo repositorio como otro proyecto Vercel.
- Root Directory: `frontend`.
- Framework preset: Angular (si Vercel no lo detecta, usa Other).
- Build command: `npm run build`.
- Output directory: `dist/frontend/browser` (confirmar el directorio real que genera la versión Angular instalada).
- El frontend usa `/api` como base. Para mantenerlo sin cambiar el contrato, configura una rewrite/proxy en `frontend/vercel.json` que envíe `/api/:path*` al dominio del backend. Sustituye el dominio de ejemplo por el backend real después del primer deploy.
- Luego actualiza `CORS_ORIGIN` del backend con el dominio frontend exacto y haz Redeploy.

Ejemplo de rewrite (cambiar `BACKEND-PROJECT` por el dominio real):
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://BACKEND-PROJECT.vercel.app/api/:path*"
    }
  ]
}
```

## Variables y seguridad
- No subas `.env` a GitHub.
- No pongas `IA_API_KEY` ni `DATABASE_URL` en Angular, `src/environments`, `index.html` o variables `NG_APP_*`.
- No compartas claves en capturas ni en el chat.
- El ejemplo `.env.example` solo contiene marcadores, nunca credenciales reales.
- Configura límites de gasto/alertas en Anthropic y revisa el uso de Vercel/Neon antes de hacer público el endpoint.

## Verificación después del despliegue
1. `GET /api/salud` devuelve `ok: true` y `lugares_en_catalogo: 0` en la base nueva vacía.
2. `GET /api/lugares` devuelve arrays vacíos.
3. `POST /api/ruta-sin-ia` con catálogo vacío debe responder `sin_resultados`, no un error 500.
4. `POST /api/ruta` solo se prueba después de añadir `IA_API_KEY`.
5. Añadir lugares reales y verificados antes de habilitar recomendaciones públicas.

## Limitaciones y trabajo pendiente
- No se creó el proyecto Neon, no se generaron claves ni se desplegó a Vercel porque requieren acceso y autorización del titular.
- No se ejecutó una migración remota.
- La compilación no se ha certificado en este entorno. La instalación local previa encontró incompatibilidad de versión Node y un error de permisos.
- Google Maps Platform requiere su propia clave restringida y APIs activadas para dibujar rutas/consultar Places dentro de la página.
