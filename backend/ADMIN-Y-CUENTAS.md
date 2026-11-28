# BOLIVIA VIVA AI — cuentas, roles y administración

## Roles
- `admin`: una sola cuenta global, protegida por índice único parcial en PostgreSQL.
- `visitante`: registro público; puede consultar catálogo, gestionar sus favoritos y guardar/eliminar sus propias rutas.
- La creación pública siempre asigna `visitante`; nunca se acepta un rol desde el navegador.

## Tablas nuevas
La migración `db/migrations/0003_usuarios_favoritos_rutas.sql` crea de forma aditiva:
- `usuarios`: correo único (case-insensitive), hash de contraseña scrypt, rol y estado.
- `sesiones_usuario`: tokens aleatorios opacos; solo se almacena SHA-256 del token; caducidad de 14 días y revocación.
- `favoritos`: relación usuario-lugar con clave primaria compuesta.
- `rutas_guardadas`: JSON de parámetros y resultado, siempre ligado al propietario.
- Añade `departamento`, `imagen_url` y `galeria_urls` a `lugares`, y `imagen_url` a `platos`.
No elimina ni recrea las tablas actuales ni toca sus filas.

## Endpoints nuevos
- `POST /api/auth/registro` — `{ email, nombre, password }`; siempre crea rol visitante.
- `POST /api/auth/login` — `{ email, password }`; devuelve `usuario`, `token`, `expiresAt`.
- `GET /api/auth/me` — requiere `Authorization: Bearer <token>`.
- `POST /api/auth/logout` — revoca el token.
- `POST /api/auth/bootstrap-admin` — endpoint de una sola ejecución; requiere header `x-admin-bootstrap-secret` y `ADMIN_BOOTSTRAP_SECRET` configurado temporalmente en Vercel. La base de datos impide un segundo admin.
- `GET /api/favoritos`, `POST /api/favoritos` `{ lugar_id }`, `DELETE /api/favoritos` `{ lugar_id }`.
- `GET /api/rutas-guardadas`, `POST /api/rutas-guardadas` `{ nombre, parametros, resultado }`, `DELETE /api/rutas-guardadas` `{ id }`.
- `GET /api/admin/lugares` y `POST /api/admin/lugares` con acción `crear`, `actualizar` o `eliminar`. Requiere rol admin. Eliminar desactiva (activo=false), no borra el registro.

Todas las operaciones privadas validan sesión en el backend. Favoritos y rutas siempre se filtran por `usuario_id` obtenido de la sesión, nunca por un ID de usuario enviado por el cliente.

## Aplicar sin perder datos
1. En Neon SQL Editor, ejecutar una sola vez el contenido de `db/migrations/0003_usuarios_favoritos_rutas.sql`.
2. Verificar que aparecen `usuarios`, `sesiones_usuario`, `favoritos`, `rutas_guardadas`.
3. No volver a ejecutar `01_tablas.sql`, `03_datos_ejemplo.sql` ni seeds de demo en la base productiva.

## Crear el administrador único
1. Crear un valor aleatorio largo para `ADMIN_BOOTSTRAP_SECRET` y agregarlo temporalmente a Vercel Backend → Settings → Environment Variables (Production).
2. Redeploy del backend.
3. Hacer una petición POST a `/api/auth/bootstrap-admin` con JSON `{ "email":"correo-admin", "nombre":"Administrador", "password":"contraseña-de-al-menos-12-caracteres" }` y header `x-admin-bootstrap-secret: <secreto-temporal>`.
4. Guardar de forma segura las credenciales del administrador.
5. Eliminar `ADMIN_BOOTSTRAP_SECRET` de Vercel y volver a desplegar. El endpoint queda inutilizable.
No crear credenciales reales en archivos del repositorio ni compartirlas por chat.

## Variables Vercel
Backend:
- `DATABASE_URL` (obligatoria, solo backend).
- `CORS_ORIGIN` (origen exacto del frontend publicado; durante desarrollo `http://localhost:4200`).
- `ADMIN_BOOTSTRAP_SECRET` (solo temporal durante la creación inicial; eliminar luego).
Frontend:
- No necesita `DATABASE_URL`, contraseña, bootstrap secret ni claves de proveedor IA.

## Límites actuales / pendientes
- La base queda preparada para guardar favoritos y rutas.
- Se han añadido endpoints backend para estas funciones y administración básica de lugares.
- La interfaz Angular de registro/login, perfil, favoritos, rutas guardadas y panel admin todavía debe conectarse/implementarse en el frontend; no se debe afirmar que ya está visible para usuarios.
- `imagen_url` y `galeria_urls` almacenan URLs; todavía no se ha integrado un servicio de subida de archivos. Para subir imágenes reales se debe conectar un almacenamiento de objetos con credenciales solo en backend.
- Añadir rate limiting y verificación de correo antes de abrir el registro al público.
