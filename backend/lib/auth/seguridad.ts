import {
  createHash, randomBytes, scryptSync, timingSafeEqual,
} from 'node:crypto';
import { consulta } from '../db/cliente';
import { ErrorHttp } from '../http/respuestas';

const SESION_DIAS = 14;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
}

export function crearHashPassword(password: string): string {
  if (password.length < 12) throw new ErrorHttp(400, 'La contraseña debe tener al menos 12 caracteres');
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${hashPassword(password, salt)}`;
}

export function verificarPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !expected) return false;
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const target = Buffer.from(expected, 'hex');
  return actual.length === target.length && timingSafeEqual(actual, target);
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'visitante';
}


export async function autenticar(req: Request): Promise<Usuario> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token.length > 512) throw new ErrorHttp(401, 'Inicia sesión para continuar');

  const [session] = await consulta<Usuario & { expires_at: string }>(
    `select u.id, u.email, u.nombre, u.rol, s.expires_at
     from sesiones_usuario s join usuarios u on u.id = s.usuario_id
     where s.token_hash = $1 and s.revocada_en is null and s.expires_at > now() and u.activo = true`,
    [hashToken(token)],
  );
  if (!session) throw new ErrorHttp(401, 'Sesión inválida o vencida');
  return { id: session.id, email: session.email, nombre: session.nombre, rol: session.rol };
}

export async function exigirAdmin(req: Request): Promise<Usuario> {
  const usuario = await autenticar(req);
  if (usuario.rol !== 'admin') throw new ErrorHttp(403, 'Acceso exclusivo para administración');
  return usuario;
}

export async function crearSesion(usuarioId: string): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESION_DIAS * 86400000).toISOString();
  await consulta(
    'insert into sesiones_usuario (usuario_id, token_hash, expires_at) values ($1, $2, $3)',
    [usuarioId, hashToken(token), expiresAt],
  );
  return { token, expiresAt };
}

export async function revocarSesion(req: Request): Promise<void> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return;
  await consulta(
    'update sesiones_usuario set revocada_en = now() where token_hash = $1 and revocada_en is null',
    [hashToken(token)],
  );
}

export async function iniciarUsuario(email: string, password: string) {
  const [u] = await consulta<Usuario & { password_hash: string }>(
    'select id, email, nombre, rol, password_hash from usuarios where lower(email) = lower($1) and activo = true',
    [email],
  );
  if (!u || !verificarPassword(password, u.password_hash)) {
    throw new ErrorHttp(401, 'Correo o contraseña incorrectos');
  }
  const sesion = await crearSesion(u.id);
  return { usuario: { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol }, ...sesion };
}

export async function registrarVisitante(email: string, nombre: string, password: string) {
  if (password.length < 12) throw new ErrorHttp(400, 'La contraseña debe tener al menos 12 caracteres');
  const hash = crearHashPassword(password);
  const [u] = await consulta<Usuario>(
    `insert into usuarios (email, nombre, password_hash, rol)
     values (lower($1), $2, $3, 'visitante')
     returning id, email, nombre, rol`,
    [email, nombre, hash],
  ).catch((e: unknown) => {
    if (String(e).includes('usuarios_email_key')) throw new ErrorHttp(409, 'Ese correo ya está registrado');
    throw e;
  });
  const sesion = await crearSesion(u.id);
  return { usuario: u, ...sesion };
}

export async function crearAdminInicial(email: string, nombre: string, password: string, secret: string) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected || expected.length < 32) throw new ErrorHttp(503, 'Configura ADMIN_BOOTSTRAP_SECRET en Vercel');
  const a = Buffer.from(secret);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ErrorHttp(403, 'Autorización de configuración inválida');
  const [existing] = await consulta<{ id: string }>("select id from usuarios where rol = 'admin' limit 1");
  if (existing) throw new ErrorHttp(409, 'La cuenta administradora ya fue creada');
  const hash = crearHashPassword(password);
  const [u] = await consulta<Usuario>(
    `insert into usuarios (email, nombre, password_hash, rol)
     values (lower($1), $2, $3, 'admin')
     returning id, email, nombre, rol`,
    [email, nombre, hash],
  );
  return u;
}
