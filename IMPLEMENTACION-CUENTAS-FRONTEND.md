# BOLIVIA VIVA AI — cuentas y panel básico

## Conservación visual
Se mantuvo el Home Voyage, la paleta, tipografías, tarjetas, navegación inferior, planificador, mapa y módulos existentes. Se añadieron un diálogo de acceso y un bloque de cuenta/administración en la sección Perfil.

## Frontend añadido
- Registro de visitante: `POST /api/auth/registro`.
- Inicio de sesión: `POST /api/auth/login`.
- Recuperación de sesión: `GET /api/auth/me`.
- Cierre de sesión: `POST /api/auth/logout`.
- Acceso a Perfil desde el avatar superior.
- Si el usuario autenticado es admin, muestra un bloque administrativo básico para crear un lugar con `POST /api/admin/lugares`.
- Token guardado en localStorage como token opaco; la base solo conserva su hash.
- Se añadió `frontend/vercel.json` para enrutar `/api/*` al backend publicado.

## Requisitos de despliegue
- Frontend Vercel: Root Directory `frontend`, Build `npm run build`, Output `dist/frontend/browser`.
- Backend Vercel: Root Directory `backend`, Build `npm run typecheck`, Output `public`.
- Backend Environment Variables:
  - `DATABASE_URL`: la conexión pooled Neon existente.
  - `CORS_ORIGIN`: dominio exacto final del frontend (por ejemplo `https://bolivia-viva-web.vercel.app`).
  - `ADMIN_BOOTSTRAP_SECRET`: secreto temporal aleatorio de al menos 32 caracteres, solo durante el alta inicial.
- No configurar variables de base de datos ni secretos en el frontend.

## Migración Neon
Ejecutar `backend/db/migrations/0003_usuarios_favoritos_rutas.sql` una sola vez, después de hacer backup. Es aditiva: no borra ni recrea las tablas de catálogo existentes.

## Alta de administrador
Después de desplegar backend y aplicar migración, llamar una sola vez a:
`POST https://viva-bolivia-api.vercel.app/api/auth/bootstrap-admin`
Headers: `Content-Type: application/json`, `x-admin-bootstrap-secret: <secreto temporal>`
Body: `{"email":"correo-admin","nombre":"Nombre","password":"contraseña-de-12-o-más-caracteres"}`
Tras recibir 201, eliminar `ADMIN_BOOTSTRAP_SECRET` de Vercel y redeplegar. No incluir el secreto ni contraseña en GitHub, frontend o capturas.

## Limitaciones pendientes
- La UI añadida cubre registro/login, perfil básico y alta inicial de lugares para admin. Aún falta completar interfaz de edición, desactivación, gestión de platos, galería/almacenamiento de imágenes y administración de reportes.
- Los favoritos y rutas guardadas tienen endpoints backend, pero el frontend todavía conserva algunas rutas en localStorage y no se ha terminado la sincronización de favoritos/rutas en la cuenta.
- Se requiere rate limiting, verificación de correo, protección CSRF/origin y auditoría antes de abrir el registro al público.
- No se ha ejecutado la migración en Neon ni se ha certificado la compilación completa en este entorno.
