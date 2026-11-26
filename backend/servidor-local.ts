// Servidor local para desarrollo: corre los mismos endpoints de /api
// en http://localhost:3000 sin necesitar Vercel.
//
//   npm run dev    → usa Neon (DATABASE_URL del archivo .env)
//   npm run demo   → base de datos de prueba EN MEMORIA (PGlite), sin Neon.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { usarEjecutor } from './lib/db/cliente';
import * as escanear from './api/escanear';
import * as lugares from './api/lugares';
import * as reporte from './api/reporte';
import * as ruta from './api/ruta';
import * as rutaSinIA from './api/ruta-sin-ia';
import * as salud from './api/salud';

type Handler = (req: Request) => Promise<Response>;
type Modulo = Partial<Record<'GET' | 'POST' | 'OPTIONS', Handler>>;

const endpoints: Record<string, Modulo> = {
  '/api/ruta': ruta,
  '/api/ruta-sin-ia': rutaSinIA,
  '/api/escanear': escanear,
  '/api/lugares': lugares,
  '/api/reporte': reporte,
  '/api/salud': salud,
};

const PUERTO = Number(process.env.PORT ?? 3000);
const MODO_DEMO = process.argv.includes('--demo');

/** Crea una base Postgres en memoria con las tablas y los datos de ejemplo. */
async function prepararBaseDemo() {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  for (const archivo of ['01_tablas.sql', '02_buscar_lugares.sql', '03_datos_ejemplo.sql']) {
    await db.exec(readFileSync(join(__dirname, 'db', archivo), 'utf8'));
  }
  usarEjecutor(async (texto, parametros) => (await db.query(texto, parametros)).rows as Record<string, unknown>[]);
  console.log('Modo DEMO: base de datos en memoria lista (10 lugares de ejemplo).');
  console.log('Los cambios (reportes, logs) se pierden al detener el servidor.');
}

async function iniciar() {
  if (MODO_DEMO) {
    // En demo el .env es opcional: solo se usa si tiene IA_API_KEY.
    const archivoEnv = join(__dirname, '.env');
    if (existsSync(archivoEnv)) {
      try {
        process.loadEnvFile(archivoEnv);
      } catch {
        console.log('No se pudo leer .env (requiere Node 20.12 o superior); se sigue sin él.');
      }
    }
    await prepararBaseDemo();
    if (!process.env.IA_API_KEY) {
      console.log('Sin IA_API_KEY: /api/ruta y /api/escanear responderán 503 (usa /api/ruta-sin-ia).');
    }
  }

  createServer(async (req, res) => {
    const inicio = Date.now();
    const url = new URL(req.url ?? '/', `http://localhost:${PUERTO}`);
    const modulo = endpoints[url.pathname];

    if (!modulo) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: `No existe ${url.pathname}`, disponibles: Object.keys(endpoints) }));
      return;
    }

    const handler = modulo.POST ?? modulo.GET ?? modulo.OPTIONS!;

    const partes: Buffer[] = [];
    for await (const parte of req) partes.push(parte as Buffer);
    const metodo = req.method ?? 'GET';
    const cuerpo = metodo === 'GET' || metodo === 'HEAD' ? undefined : Buffer.concat(partes);

    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (typeof v === 'string') headers.set(k, v);
    }

    try {
      const respuesta = await handler(new Request(url, { method: metodo, headers, body: cuerpo }));
      const cabeceras: Record<string, string> = {};
      respuesta.headers.forEach((valor, clave) => (cabeceras[clave] = valor));
      res.writeHead(respuesta.status, cabeceras);
      res.end(Buffer.from(await respuesta.arrayBuffer()));
      console.log(`${metodo} ${url.pathname} → ${respuesta.status} (${Date.now() - inicio} ms)`);
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end('Error interno');
    }
  }).listen(PUERTO, () => {
    console.log(`\nBackend local en http://localhost:${PUERTO}`);
    console.log(`Prueba en el navegador: http://localhost:${PUERTO}/api/salud\n`);
  });
}

iniciar().catch((e) => {
  console.error('No se pudo iniciar el servidor:', e);
  process.exit(1);
});