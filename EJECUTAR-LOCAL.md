# Ejecutar Viva Bolivia localmente (Windows)

## Requisito
- Node.js 22.22.3 o superior para Angular 22.3.
- Dos terminales abiertas en VS Code.

## Terminal 1 — Backend
```powershell
cd backend
npm install
Copy-Item .env.example .env
```
Edita `backend/.env` y completa `DATABASE_URL` con la cadena pooled de Neon. Para probar el endpoint de IA también se necesita `IA_API_KEY` de Anthropic. Nunca pongas estas claves en Angular ni las compartas por capturas.

Inicia:
```powershell
npm run dev
```
El servidor local escucha en el puerto indicado por `backend/servidor-local.ts` (por defecto 3000).

## Terminal 2 — Frontend
```powershell
cd frontend
npm install
npm start
```
Abre `http://localhost:4200`.

## Error Vite/Angular: ECONNREFUSED /api/salud
Ese mensaje significa que Angular está activo, pero no encuentra el backend en el puerto destino del proxy. No es un error de diseño ni del navegador. Comprueba:
1. Que la Terminal 1 siga ejecutando `npm run dev`.
2. Que `frontend/proxy.conf.json` apunte al mismo puerto del backend.
3. Que `http://localhost:3000/api/salud` (o el puerto configurado) responda.

## Importante
La vista inicial puede mostrarse sin backend, pero la comprobación de estado y las rutas requieren que el backend esté levantado y que Neon esté configurado.
