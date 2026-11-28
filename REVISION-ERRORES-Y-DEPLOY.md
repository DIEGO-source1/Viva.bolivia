# BOLIVIA VIVA AI — revisión y despliegue

## Correcciones incluidas
1. `backend/lib/http/handler.ts`: tipado Zod 4 (`z.ZodType<T>`), corrige TS2345/TS18046 originados en `leerJson`.
2. `backend/vercel.json`: declara `outputDirectory: public`, además del límite de funciones.
3. `backend/public/index.html`: salida estática mínima exigida por la configuración actual de Vercel.
4. `backend/lib/servicios/ruta.service.ts`: `/api/ruta` admite modo local sin IA para extraer importes en Bs y horas; usa el mismo catálogo, planificador y plantilla. No inventa resultados.
5. `backend/lib/servicios/escaner.service.ts`: responde 503 claro cuando no hay `GEMINI_API_KEY`; no simula reconocimiento visual.
6. `backend/.env.example`: documenta Neon obligatorio y Gemini opcional.

## Configuración Vercel (proyecto backend)
- Root Directory: `backend`
- Framework: Other
- Install Command: `npm install`
- Build Command: `npm run typecheck`
- Output Directory: `public` (también definido en vercel.json)
- Variables obligatorias: `DATABASE_URL`
- `CORS_ORIGIN`: temporal localhost; reemplazar por el dominio exacto del frontend cuando se publique.
- No agregar `IA_API_KEY` de Anthropic.
- No es necesario agregar `GEMINI_API_KEY` para el modo local sin IA.

## Endpoints esperados
- `GET /api/salud`: consulta Neon y devuelve recuento de lugares.
- `GET /api/lugares`: catálogo.
- `POST /api/ruta-sin-ia`: planificador sin proveedor IA.
- `POST /api/ruta`: parser local básico (Bs y horas) y planificador; para frases ambiguas usar el formulario.
- `POST /api/escanear`: 503 explicativo si Gemini no está configurado.
- `POST /api/reporte`: registra reportes.

## Comandos de comprobación antes de push
Desde `backend`:
```powershell
npm install
npm run typecheck
npm test
```
No se afirma que estas pruebas se hayan ejecutado en este entorno: la instalación de paquetes quedó interrumpida por el límite de ejecución de la herramienta. Deben ejecutarse localmente en VS Code.

## Publicar los cambios
Desde la raíz del repositorio:
```powershell
git add backend
git commit -m "fix: Vercel output, Zod 4 and no-API route fallback"
git push origin main
```
Vercel desplegará el nuevo commit automáticamente.

## Después del despliegue
Abrir `https://TU-DOMINIO-API.vercel.app/api/salud`.
Respuesta esperada: JSON con `ok: true` y `lugares_en_catalogo`.
Si responde error de CORS, actualizar `CORS_ORIGIN` al dominio exacto del frontend y hacer redeploy.

## Protección de datos
No ejecutar seeds de demostración ni migraciones sobre Neon para esta corrección. No se elimina ni recrea ninguna tabla. La aplicación conserva los datos existentes.
