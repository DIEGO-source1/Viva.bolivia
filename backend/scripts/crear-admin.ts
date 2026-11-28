import { consulta } from '../lib/db/cliente';
import { crearHashPassword } from '../lib/auth/seguridad';

function requerido(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Falta ${nombre} en backend/.env`);
  return valor;
}

async function main(): Promise<void> {
  const nombre = requerido('ADMIN_NAME');
  const email = requerido('ADMIN_EMAIL').toLowerCase();
  const password = requerido('ADMIN_PASSWORD');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL no tiene un formato válido.');
  }
  if (nombre.length < 2 || nombre.length > 100) {
    throw new Error('ADMIN_NAME debe tener entre 2 y 100 caracteres.');
  }
  if (password.length < 12 || password.length > 200) {
    throw new Error('ADMIN_PASSWORD debe tener entre 12 y 200 caracteres.');
  }

  // La restricción parcial usuarios_un_solo_admin_uq de la migración
  // hace que la regla de administrador único también se cumpla ante ejecuciones simultáneas.
  const [existente] = await consulta<{ id: string; email: string }>(
    "select id, email from public.usuarios where rol = 'admin' limit 1",
  );

  if (existente) {
    console.log(`Ya existe un administrador (${existente.email}). No se modificó ninguna cuenta.`);
    return;
  }

  const passwordHash = crearHashPassword(password);

  try {
    const [creado] = await consulta<{ id: string; email: string; nombre: string; rol: string }>(
      `insert into public.usuarios (email, nombre, password_hash, rol)
       values (lower($1), $2, $3, 'admin')
       returning id, email, nombre, rol`,
      [email, nombre, passwordHash],
    );

    if (!creado) throw new Error('La base de datos no confirmó la creación del administrador.');
    console.log('Administrador creado correctamente.');
    console.log(`Correo: ${creado.email}`);
    console.log(`Nombre: ${creado.nombre}`);
    console.log('Rol: admin');
    console.log('La contraseña no se muestra y se almacenó mediante hash scrypt.');
  } catch (error) {
    const mensaje = String(error);
    if (mensaje.includes('usuarios_un_solo_admin_uq')) {
      console.log('Otro proceso creó el administrador primero. No se modificó ninguna cuenta.');
      return;
    }
    if (mensaje.includes('usuarios_email_lower_uq') || mensaje.includes('usuarios_email_key')) {
      throw new Error('Ese correo ya está registrado. No se creó otro usuario.');
    }
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error('No se pudo crear el administrador:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
