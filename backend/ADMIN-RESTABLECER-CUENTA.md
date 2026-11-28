# Restablecer la contraseña del administrador existente

Este procedimiento cambia la contraseña de una cuenta `admin` ya creada. No crea otra cuenta, no cambia roles y no modifica lugares, platos ni otras tablas del catálogo.

## 1. Seguridad
La contraseña que se mostró en capturas debe considerarse comprometida. Elige una nueva, única y larga. No la compartas ni la escribas en GitHub.

## 2. Editar backend/.env
Mantén la `DATABASE_URL` existente y reemplaza:
```env
ADMIN_EMAIL=correo-real-de-la-cuenta-admin
ADMIN_PASSWORD=TU_NUEVA_CONTRASENA_PRIVADA_DE_12_O_MAS_CARACTERES
```
No uses el correo de ejemplo si no es el correo real de la cuenta. No incluyas comillas salvo que tu gestor de variables lo requiera.

## 3. Ejecutar desde backend
```powershell
npm install
npm run admin:reset-password
```

El script solo actualiza `password_hash` de la cuenta activa cuyo correo coincida y cuyo rol ya sea `admin`. Después revoca todas sus sesiones anteriores. Si no encuentra esa cuenta, termina sin modificar nada.

## 4. Después
- Inicia sesión con el correo configurado y la nueva contraseña.
- No ejecutes `admin:create` para cambiar contraseñas.
- Comprueba que `backend/.env` no aparezca en `git status`.
- No subas `.env` a GitHub ni lo agregues a Vercel.
- Si la contraseña anterior estuvo en capturas compartidas, no la reutilices.

## Nota
El restablecimiento requiere que la migración de identidad ya esté aplicada en la base Neon y que `DATABASE_URL` apunte a esa misma base. No ejecuta migraciones.
