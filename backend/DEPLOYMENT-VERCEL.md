# Despliegue backend Vercel + Neon (modo sin API externa)

## Vercel project settings
- Root Directory: `backend`
- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: `npm run typecheck`
- Output Directory: `public`

`backend/vercel.json` también declara `outputDirectory: public` y las funciones `api/*.ts`.

## Variables
Obligatoria:
- `DATABASE_URL`: cadena pooled de Neon.

Temporal:
- `CORS_ORIGIN`: localhost durante pruebas locales. Tras desplegar frontend, cambiar al origen exacto `https://<dominio-frontend>`.

No añadir `IA_API_KEY`, `GEMINI_API_KEY`, `IA_MODELO` ni `IA_MODELO_VISION` en modo sin proveedor IA.

## Endpoints
- `GET /api/salud`: consulta la base Neon y devuelve número de lugares.
- `GET /api/lugares`: catálogo.
- `POST /api/ruta-sin-ia`: planificador por formulario, sin proveedor IA.
- `POST /api/ruta`: interpreta cantidades básicas (Bs y horas) mediante reglas locales y usa plantilla; si falta presupuesto/tiempo, responde `faltan_datos`. No es IA generativa.
- `POST /api/escanear`: devuelve 503 explicando que VIVA LENS requiere Gemini; no finge reconocimiento.
- `POST /api/reporte`: registra reportes.

## Seguridad y limitaciones
- No exponer `DATABASE_URL` en el frontend.
- No se han cambiado ni borrado datos de Neon.
- El parser local es deliberadamente limitado: para consultas ambiguas, el formulario `/api/ruta-sin-ia` es la alternativa fiable.
- El catálogo actual contiene 30 lugares y 5 platos según la verificación realizada por el usuario; validar los datos de ejemplo antes de mostrarlos públicamente.
