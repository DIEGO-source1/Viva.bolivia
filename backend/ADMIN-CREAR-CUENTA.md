# Crear la cuenta administradora desde código

## Requisitos previos
1. Backend conectado a la base Neon correcta mediante `DATABASE_URL`.
2. Haber respaldado Neon.
3. Haber aplicado una sola vez `db/migrations/0003_usuarios_favoritos_rutas.sql`.
4. Node.js 22 instalado.

## Preparar credenciales
En `backend`, copia `.env.example` a `.env` (PowerShell: `Copy-Item .env.example .env`).
Edita `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Usa una contraseña única de 12 a 200 caracteres.
No escribas la contraseña en el archivo TypeScript y no compartas el `.env`.

## Ejecutar
Desde la carpeta `backend`:
```powershell
npm install
npm run admin:create
```

El script consulta primero si ya existe un administrador. Si existe, no lo cambia. Si no existe, crea uno con contraseña hash scrypt. La restricción única parcial de la migración impide un segundo administrador incluso ante ejecuciones simultáneas.

## Seguridad
- `backend/.env` está excluido por `.gitignore`; confirma con `git status --short` que no aparece antes de hacer push.
- No configures `ADMIN_PASSWORD` en el frontend ni en Vercel.
- `DATABASE_URL` solo se utiliza localmente para ejecutar este script; no se imprime.
- No ejecutes la migración repetidamente ni borres tablas.
- Si el administrador ya existe y olvidaste su contraseña, no vuelvas a ejecutar el script esperando que la cambie: se necesita un procedimiento de restablecimiento autenticado y auditado.
