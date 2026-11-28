# Vercel Hobby: API consolidada en una función

## Qué cambió
Las 14 rutas API se movieron desde `backend/api/**` a `backend/lib/routes/**`.
Ahora Vercel detecta un único punto de entrada: `backend/api/[...path].ts`.
El enrutador conserva los paths públicos existentes, por ejemplo `/api/salud`, `/api/lugares`, `/api/auth/login`, `/api/favoritos` y `/api/admin/lugares`.

## Despliegue
- Backend Vercel: Root Directory `backend`.
- Framework Preset: Other.
- Build Command: `npm run typecheck`.
- Output Directory: `public`.
- Install Command: `npm install`.
- Variables privadas en backend Vercel: `DATABASE_URL`, `CORS_ORIGIN`, y las demás que realmente use el backend.
- No se necesitan variables de entorno de base de datos en el frontend.

## Verificación local
Desde `backend`:
```powershell
npm install
npm run typecheck
npm test
```
Luego prueba el servidor local y los endpoints existentes. El router es una función Node de Vercel que adapta IncomingMessage/ServerResponse a Request/Response Web estándar.

## Importante
Esta consolidación reduce el número de funciones detectadas por Vercel, pero concentra el tráfico en una sola función. Comprueba los logs y límites de duración/cuerpo, especialmente el escáner de imágenes. No ejecutes migraciones SQL como parte de este cambio: no modifica el esquema ni los datos de Neon.
