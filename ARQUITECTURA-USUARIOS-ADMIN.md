# Arquitectura de cuentas — BOLIVIA VIVA AI

## Decisión confirmada
- Una única cuenta `admin`.
- Visitantes con registro/cuenta.
- Visitantes pueden ver el catálogo y gestionar solo sus propios favoritos y rutas guardadas.
- Solo el administrador puede crear, editar o desactivar contenido del catálogo.

## Componentes
- Angular PWA: pantallas públicas, registro, login, perfil, favoritos, rutas guardadas y panel administrativo.
- Vercel API: autenticación, autorización por rol, catálogo y operaciones.
- Neon: usuarios, sesiones, favoritos, rutas guardadas y catálogo existente.
- Sesiones: token aleatorio opaco; la base conserva solo su hash SHA-256; caducidad 14 días; revocación al cerrar sesión.
- Contraseñas: scrypt con salt individual; nunca se guardan en texto plano.
- Admin único: índice único parcial en PostgreSQL y bootstrap inicial de un solo uso.

## Cambios incluidos en esta versión
- Migración aditiva `backend/db/migrations/0003_usuarios_favoritos_rutas.sql`.
- Endpoints `/api/auth/*`, `/api/favoritos`, `/api/rutas-guardadas` y `/api/admin/lugares`.
- Protección de endpoints mediante sesión y rol verificados en backend.
- Desactivación lógica de lugares desde el panel admin (no borrado físico).
- Campos opcionales de departamento e imágenes para lugares y platos.

## No se ha hecho
- No se ha ejecutado la migración en Neon.
- No se ha creado aún la cuenta admin real.
- No se ha conectado la interfaz Angular de cuentas/panel admin.
- No se ha integrado almacenamiento de imágenes.
- No se han ejecutado pruebas de compilación completas en este entorno.

## Orden seguro de implementación
1. Respaldar Neon desde su consola.
2. Aplicar una sola vez la migración 0003.
3. Desplegar backend actualizado.
4. Configurar temporalmente `ADMIN_BOOTSTRAP_SECRET`, crear admin y eliminar el secreto.
5. Implementar/conectar pantallas Angular.
6. Añadir rate limiting, verificación de correo y almacenamiento de imágenes antes de producción pública.
