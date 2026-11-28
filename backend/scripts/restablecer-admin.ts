import { consulta } from '../lib/db/cliente';
import { crearHashPassword } from '../lib/auth/seguridad';

function requerido(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Falta ${nombre} en backend/.env`);
  return valor;
}

async function main(): Promise<void> {
  const email = requerido('ADMIN_EMAIL').toLowerCase();
  const password = requerido('ADMIN_PASSWORD');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL no tiene un formato válido.');
  }
  if (password.length < 12 || password.length > 200) {
    throw new Error('ADMIN_PASSWORD debe tener entre 12 y 200 caracteres.');
  }

  const passwordHash = crearHashPassword(password);

  // Solo actualiza la cuenta indicada si ya es administradora.
  // No crea usuarios, no cambia roles y no toca el catálogo.
  const actualizados = await consulta<{ id: string; email: string; nombre: string }>(
    `update public.usuarios
       set password_hash = $2, actualizado_en = now()
     where lower(email) = lower($1)
       and rol = 'admin'
       and activo = true
     returning id, email, nombre`,
    [email, passwordHash],
  );

  const admin = actualizados[0];
  if (!admin) {
    throw new Error('No existe una cuenta admin activa con ese correo. No se modificó ninguna cuenta.');
  }

  // Revoca las sesiones anteriores para cerrar cualquier sesión con la credencial expuesta.
  await consulta(
    `update public.sesiones_usuario
        set revocada_en = now()
      where usuario_id = $1 and revocada_en is null`,
    [admin.id],
  );

  console.log('Contraseña del administrador actualizada correctamente.');
  console.log(`Correo: ${admin.email}`);
  console.log('Las sesiones anteriores fueron revocadas.');
  console.log('La contraseña nueva no se muestra en pantalla.');
}

main().catch((error: unknown) => {
  console.error('No se pudo restablecer la contraseña:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
