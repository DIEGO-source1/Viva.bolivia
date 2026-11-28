import type { IncomingMessage, ServerResponse } from 'node:http';
import { GET as saludGET } from '../lib/routes/salud';
import { GET as lugaresGET } from '../lib/routes/lugares';
import { POST as rutaPOST } from '../lib/routes/ruta';
import { POST as rutaSinIAPOST } from '../lib/routes/ruta-sin-ia';
import { POST as escanearPOST } from '../lib/routes/escanear';
import { POST as reportePOST } from '../lib/routes/reporte';
import { GET as adminLugaresGET, POST as adminLugaresPOST } from '../lib/routes/admin/lugares';
import { POST as registroPOST } from '../lib/routes/auth/registro';
import { POST as loginPOST } from '../lib/routes/auth/login';
import { GET as meGET } from '../lib/routes/auth/me';
import { POST as logoutPOST } from '../lib/routes/auth/logout';
import { POST as bootstrapAdminPOST } from '../lib/routes/auth/bootstrap-admin';
import { GET as favoritosGET, POST as favoritosPOST, DELETE as favoritosDELETE } from '../lib/routes/favoritos';
import { GET as rutasGET, POST as rutasPOST, DELETE as rutasDELETE } from '../lib/routes/rutas-guardadas';

type WebHandler = (request: Request) => Promise<Response>;

const routes: Record<string, Partial<Record<string, WebHandler>>> = {
  '/api/salud': { GET: saludGET },
  '/api/lugares': { GET: lugaresGET },
  '/api/ruta': { POST: rutaPOST },
  '/api/ruta-sin-ia': { POST: rutaSinIAPOST },
  '/api/escanear': { POST: escanearPOST },
  '/api/reporte': { POST: reportePOST },
  '/api/admin/lugares': { GET: adminLugaresGET, POST: adminLugaresPOST },
  '/api/auth/registro': { POST: registroPOST },
  '/api/auth/login': { POST: loginPOST },
  '/api/auth/me': { GET: meGET },
  '/api/auth/logout': { POST: logoutPOST },
  '/api/auth/bootstrap-admin': { POST: bootstrapAdminPOST },
  '/api/favoritos': { GET: favoritosGET, POST: favoritosPOST, DELETE: favoritosDELETE },
  '/api/rutas-guardadas': { GET: rutasGET, POST: rutasPOST, DELETE: rutasDELETE },
};

async function leerBody(req: IncomingMessage & { body?: unknown }): Promise<string | undefined> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') return req.body;
    return JSON.stringify(req.body);
  }
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8') || undefined;
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  try {
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url || '/', `https://${host}`);
    const route = routes[url.pathname];
    if (!route) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Ruta no encontrada' }));
      return;
    }

    const method = (req.method || 'GET').toUpperCase();
    const selected = method === 'OPTIONS'
      ? route[Object.keys(route)[0]] // el handler común responde OPTIONS con CORS
      : route[method];

    if (!selected) {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }));
      return;
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(', '));
      else if (value !== undefined) headers.set(key, value);
    }

    const body = await leerBody(req);
    const webRequest = new Request(url, {
      method,
      headers,
      ...(body !== undefined && method !== 'GET' && method !== 'HEAD' ? { body } : {}),
    });
    const response = await selected(webRequest);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'Error interno del servidor' }));
  }
}
