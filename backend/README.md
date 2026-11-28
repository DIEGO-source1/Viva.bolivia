# Backend: Ruta gastronómica Cochabamba (Neon + Vercel) · versión de práctica

> **Importante:** esta versión es para **practicar y estudiar** antes de la Hackathon.
> Las reglas exigen que el código se escriba durante las 12 horas, con commits continuos.
> **No subas este código al repositorio oficial.** Ponlo en un repo aparte de práctica.

**Stack:**
- **Neon:** Postgres con búsqueda de texto en español.
- **Vercel Functions:** Node y TypeScript.
- **Gemini:** el modelo de IA.

---

## La idea central

**La IA entiende y redacta, pero el código decide.**

1. La IA convierte el texto del turista en datos: presupuesto, horas, tipos y palabras clave.
2. Postgres devuelve lugares **reales** del catálogo: aplica filtros y los ordena por relevancia de texto.
3. El **planificador** (código normal, sin IA) arma la ruta respetando presupuesto y tiempo.
4. La IA redacta el itinerario **solo con esos lugares y sin precios**.
5. Un validador rechaza el texto si inventa lugares o escribe precios. En ese caso se usa una plantilla sin IA.

---

## Estructura

```
api/                       ← cada archivo es un endpoint de Vercel
  ruta.ts                  POST /api/ruta          (con IA)
  ruta-sin-ia.ts           POST /api/ruta-sin-ia   (formulario, para comparar)
  escanear.ts              POST /api/escanear      (foto → plato)
  lugares.ts               GET  /api/lugares       (catálogo: mapa + offline)
  reporte.ts               POST /api/reporte       (usuario reporta un dato mal)
  salud.ts                 GET  /api/salud         (¿funciona la base de datos?)
lib/
  config/env.ts            variables de entorno
  http/                    handler, respuestas, validación de entradas (zod)
  db/cliente.ts            conexión a Neon (SQL parametrizado)
  dominio/                 planificador, distancias, validadores, plantilla (SIN IA)
  ia/                      cliente de Gemini, prompts, esquemas, tareas
  repositorios/            consultas SQL
  servicios/               orquestan el flujo (ruta, escáner)
db/
  01_tablas.sql            tablas + búsqueda de texto
  02_buscar_lugares.sql    función de búsqueda
  03_datos_ejemplo.sql     datos de EJEMPLO (reemplazar por datos verificados)
tests/
  planificador.test.ts     11 pruebas unitarias
  casos-prueba.json        20 casos para comparar con/sin IA
  evaluar.mts              genera la tabla de métricas
```

---

## Cómo correrlo

### 1. Pruebas locales (sin cuentas)
```powershell
npm install
npm test
```
Debe salir `pass 11` y `fail 0`.

### 2. Base de datos en Neon
1. En **console.neon.tech** crea un proyecto (región cercana: AWS São Paulo, si está disponible).
2. Abre **SQL Editor** y ejecuta en orden: `db/01_tablas.sql`, `db/02_buscar_lugares.sql`, `db/03_datos_ejemplo.sql`.
3. En el **Dashboard → Connect**, copia la **Connection string** con *Connection pooling* activado.
   Esa cadena es tu `DATABASE_URL`.

### 3. Subir a GitHub (repo de práctica, NO el oficial)
```powershell
git init
git add .
git commit -m "Backend de práctica"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/practica-backend.git
git push -u origin main
```

### 4. Desplegar en Vercel
1. En **vercel.com**, ve a **Add New → Project** e importa el repo `practica-backend`.
2. En **Framework Preset**, elige **Other**. No cambies Build ni Output.
3. En **Environment Variables**, agrega `DATABASE_URL` (la de Neon) e `GEMINI_API_KEY` (la de Google AI Studio, `sk-ant-...`).
4. Toca **Deploy**. Cuando termine, tendrás una URL como `https://practica-backend.vercel.app`.

> Si cambias una variable de entorno después, haz **Redeploy** para que se aplique.

### 5. Probar (PowerShell)
```powershell
$URL = "https://practica-backend.vercel.app/api"

Invoke-RestMethod "$URL/salud"

Invoke-RestMethod -Method Post -Uri "$URL/ruta" -ContentType "application/json" -Body '{"texto":"Tengo Bs 60 y 2 horas, quiero comer algo tipico"}' | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method Post -Uri "$URL/ruta-sin-ia" -ContentType "application/json" -Body '{"presupuesto":60,"horas":2,"tipos":["comida"]}' | ConvertTo-Json -Depth 10
```

### 6. Evaluación con IA vs sin IA (criterio B)
```powershell
$env:BASE_URL = "https://practica-backend.vercel.app/api"
npm run evaluar
```
Imprime una tabla y guarda `resultados-evaluacion.json`.

---

## Respuestas de `/api/ruta`

Todas tienen la forma `{ ok: true, datos }` o `{ ok: false, error, detalle }`.

- `estado: "ok"`: trae `ruta` (paradas, costo_min, costo_max, minutos_total, km_total), `itinerario` y `avisos`.
- `estado: "faltan_datos"`: trae `faltan: ["presupuesto"]`, así Angular pregunta solo lo que falta.
- `estado: "sin_resultados"`: no hay ruta posible; trae sugerencias.
- **HTTP 503**: la IA no responde. Angular debe mostrar el formulario sin IA.

---

## Si algo falla

| Síntoma | Causa probable |
|---|---|
| `/api/salud` → 500 `Falta la variable de entorno DATABASE_URL` | No agregaste la variable en Vercel o no hiciste Redeploy |
| `/api/salud` → error `relation "lugares" does not exist` | No ejecutaste los SQL en Neon, o lo hiciste en otra base o rama |
| `/api/ruta` → 503 | `GEMINI_API_KEY` incorrecta, sin crédito, o nombre de modelo inválido. Revisa los **Logs** del deploy en Vercel |
| 404 en `/api/ruta` | La URL debe incluir `/api/` |
| `sin_resultados` siempre | El presupuesto es muy bajo para los precios de ejemplo |

---

## Cómo responde cada criterio de la rúbrica

| Criterio | Dónde está |
|---|---|
| A: arquitectura | capas: endpoint → servicio → dominio / IA / repositorios |
| B: comparación sin IA | `/api/ruta-sin-ia` usa la misma búsqueda y el mismo planificador |
| B: evidencia | `tests/evaluar.mts` + 20 casos (incluye un intento de manipular el prompt, C16) |
| E: alucinaciones | la IA solo elige del catálogo; `validador-ruta.ts` rechaza lugares inventados y precios |
| E: errores del modelo | timeout, reintento, plantilla de respaldo y 503 con alternativa sin IA |
| E: privacidad | `rutas_log` no guarda el texto del usuario ni su ubicación |
| E: supervisión humana | `/api/reporte`, confirmación en el escáner y el campo `verificado` |
| F: costos | `rutas_log` guarda los tokens de cada ruta |
| Bonus | respuestas en inglés + `/api/lugares` para el modo offline |

## Supuestos explícitos (decirlos en el pitch)

- Presupuesto: se usa el **precio máximo** de cada lugar (conservador).
- Traslados: a pie hasta 1.5 km (4.5 km/h); más lejos en taxi o trufi (20 km/h + 5 min de espera);
  las calles suman ~30% a la distancia en línea recta. Están en `lib/dominio/distancia.ts`.

## Seguridad para una demo pública

Los endpoints son públicos. Para no llevarte sorpresas de costo:
- pon un **límite de gasto** en Google AI Studio;
- cuando tengas la URL de tu Angular, configura `CORS_ORIGIN` con ella.

## Datos

`03_datos_ejemplo.sql` trae **precios y horarios inventados** para practicar. Antes de la demo:
- reemplázalos con datos reales;
- llena `fuente` y `fecha_verificacion`;
- marca `verificado = true`;
- agrega `etiquetas` con platos y palabras clave, que mejoran la búsqueda.


## Proveedor de IA: Gemini
El backend usa Gemini Developer API mediante `generateContent` con salida JSON estructurada (`responseMimeType: application/json` y `responseSchema`). El mismo adaptador procesa texto e imágenes para el escáner. El modelo por defecto es `gemini-2.5-flash-lite`; el acceso gratuito está sujeto a cuotas, disponibilidad y condiciones de Google. En el nivel gratuito, Google indica que el contenido puede utilizarse para mejorar sus productos; no envíes datos sensibles.
