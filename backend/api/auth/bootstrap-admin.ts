import { z } from 'zod';
import { crearHandler, leerJson } from '../../lib/http/handler';
import { ok } from '../../lib/http/respuestas';
import { crearAdminInicial } from '../../lib/auth/seguridad';

// Endpoint de configuración inicial. Solo funciona una vez y requiere secreto fuerte.
const Schema = z.object({
  email: z.string().email().max(254),
  nombre: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(200),
});
const handler = crearHandler('POST', async (req) => {
  const data = await leerJson(req, Schema);
  const secret = req.headers.get('x-admin-bootstrap-secret') ?? '';
  const usuario = await crearAdminInicial(data.email, data.nombre, data.password, secret);
  return ok({ usuario, mensaje: 'Administrador inicial creado. Elimina ADMIN_BOOTSTRAP_SECRET de Vercel y redepliega.' }, 201);
});
export { handler as POST, handler as OPTIONS };
