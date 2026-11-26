# Backend: Ruta gastronómica Cochabamba (versión de práctica)

> **Importante:** esta es una versión para **practicar y estudiar** antes de la Hackathon.
> Las reglas exigen que el código se escriba durante las 12 horas, con commits continuos.
> **No subas este código tal cual al repositorio oficial.** Úsalo para entender la
> arquitectura, practicar la defensa técnica y llegar sabiendo qué construir.
> En el evento lo reescriben (con IA si quieren, declarándolo).

Stack: **Supabase** (Postgres + pgvector + Edge Functions en TypeScript/Deno) + **Claude** como modelo de IA.

---

## La idea central

**La IA entiende y redacta, pero el código decide.**

1. La IA convierte el texto del turista en datos: presupuesto, horas, tipos y preferencias.
2. La base de datos devuelve lugares **reales** del catálogo (filtros SQL y similitud con pgvector).
3. El **planificador** (código normal, sin IA) arma la ruta respetando presupuesto y tiempo.
4. La IA redacta el itinerario **solo con esos lugares y sin precios**.
5. Un validador rechaza el texto si inventa lugares o escribe precios. En ese caso se usa una plantilla sin IA.

---

## Estructura

```
supabase/
├── config.toml
├── seed.sql                          datos de EJEMPLO (reemplazar por datos verificados)
├── migrations/
│   ├── ..._extensiones.sql           pgvector
│   ├── ..._tablas.sql                tablas + seguridad RLS
│   └── ..._buscar_lugares.sql        función de búsqueda (filtros + similitud)
├── functions/
│   ├── _shared/
│   │   ├── deps.ts                   versiones de zod y supabase-js
│   │   ├── config/env.ts             variables de entorno
│   │   ├── http/                     handler, respuestas, validación de entradas
│   │   ├── db/cliente.ts             cliente con service role
│   │   ├── dominio/                  planificador, distancias, validadores, plantilla (SIN IA)
│   │   ├── ia/                       cliente de Claude, prompts, esquemas, tareas, embeddings
│   │   ├── repositorios/             acceso a tablas
│   │   └── servicios/                orquestan el flujo (ruta, escáner)
│   ├── ruta/                         POST  ruta con IA
│   ├── ruta-sin-ia/                  POST  ruta con formulario (comparación)
│   ├── escanear/                     POST  foto → plato
│   ├── lugares/                      GET   catálogo (mapa + offline)
│   ├── reporte/                      POST  usuario reporta dato incorrecto
│   └── generar-embeddings/           POST  admin: calcula embeddings
└── tests/
    ├── planificador.test.ts          10 pruebas unitarias
    ├── casos-prueba.json             20 casos para comparar con/sin IA
    └── evaluar.ts                    genera la tabla de métricas
```

---

## Puesta en marcha (sin computadora: GitHub Codespaces desde el navegador)

1. Crea un proyecto en **supabase.com** y guarda su `Project ref`.
2. **Base de datos.** En el panel de Supabase, abre *SQL Editor* y ejecuta en orden los 3 archivos
   de `migrations/` y después `seed.sql`. Esto funciona desde el celular.
3. **Secretos.** En *Edge Functions → Secrets* agrega:
   - `IA_API_KEY`: tu API key de Anthropic
   - `ADMIN_KEY`: una clave larga inventada por ti
   - opcionales: `IA_MODELO`, `IA_MODELO_VISION`, `CORS_ORIGIN` (la URL de tu app Angular)
4. **Desplegar funciones** (en Codespaces o en una laptop):
   ```bash
   npx supabase login
   npx supabase link --project-ref TU_REF
   npx supabase functions deploy
   ```
5. **Generar embeddings** del catálogo (repítelo cada vez que agregues lugares):
   ```bash
   curl -X POST https://TU_REF.supabase.co/functions/v1/generar-embeddings \
     -H "x-admin-key: TU_ADMIN_KEY"
   ```

---

## Endpoints

Todos responden `{ ok: true, datos }` o `{ ok: false, error, detalle }`.
Angular debe enviar la cabecera `Authorization: Bearer <ANON_KEY>`.

### POST `/ruta` (con IA)
```json
{ "texto": "Tengo Bs 60 y 2 horas, quiero comer algo típico", "idioma": "es",
  "origen": { "lat": -17.3936, "lng": -66.157 }, "soloAbiertos": true }
```
Posibles `estado`:
- `ok`: incluye `ruta` (paradas, costo_min, costo_max, minutos_total, km_total) e `itinerario`
- `faltan_datos`: `faltan: ["presupuesto"]`, así Angular pregunta solo lo que falta
- `sin_resultados`: incluye un aviso con sugerencias
- HTTP 503: la IA no responde, así que Angular muestra el formulario sin IA

### POST `/ruta-sin-ia`
```json
{ "presupuesto": 60, "horas": 2, "tipos": ["comida"], "zona": null, "idioma": "es" }
```

### POST `/escanear`
```json
{ "imagenBase64": "...", "mediaType": "image/jpeg", "idioma": "es" }
```
`estado`: `reconocido`, `confirmar` (confianza < 0.75: el usuario confirma) o `no_reconocido`.

### GET `/lugares`
El catálogo completo, para pintar el mapa y guardarlo en IndexedDB (modo offline).

### POST `/reporte`
```json
{ "lugar_id": "uuid", "tipo": "precio", "comentario": "Ahora cuesta más" }
```

---

## Pruebas y métricas

```bash
# Pruebas unitarias del planificador (sin internet ni base de datos)
deno test supabase/tests/planificador.test.ts

# Comparación con IA vs sin IA (necesita el backend desplegado)
BASE_URL=https://TU_REF.supabase.co/functions/v1 ANON_KEY=TU_ANON_KEY \
deno run --allow-net --allow-env --allow-read --allow-write supabase/tests/evaluar.ts
```

`evaluar.ts` imprime una tabla lista para el pitch:
- % de estado correcto (ok, faltan_datos, sin_resultados)
- % de extracción correcta (la IA entendió bien presupuesto y horas)
- % de rutas dentro del presupuesto y dentro del tiempo
- lugares inventados (debe ser 0)
- % de textos aceptados de la IA y latencia promedio

---

## Cómo responde cada criterio de la rúbrica

| Criterio | Dónde está |
|---|---|
| A: calidad y arquitectura | capas separadas: handler → servicio → dominio / IA / repositorios |
| B: comparación sin IA | `/ruta-sin-ia` reutiliza los mismos pasos 2 y 3 |
| B: evidencia | `tests/evaluar.ts` + 20 casos (incluye intento de manipulación del prompt, C16) |
| E: alucinaciones | la IA solo elige del catálogo; `validador-ruta.ts` rechaza lugares inventados y precios |
| E: errores del modelo | timeout, reintento, plantilla de respaldo y 503 con alternativa sin IA |
| E: privacidad | `rutas_log` no guarda el texto del usuario ni su ubicación |
| E: supervisión humana | `/reporte`, confirmación en el escáner y el campo `verificado` en cada lugar |
| F: costos | `rutas_log` guarda los tokens de cada ruta |
| Bonus | respuestas en inglés + `/lugares` para el modo offline |

---

## Supuestos explícitos (decirlos en el pitch)

- Presupuesto: se usa el **precio máximo** de cada lugar (conservador).
- Traslados: a pie hasta 1.5 km (4.5 km/h); más lejos en taxi o trufi (20 km/h + 5 min de espera);
  las calles suman ~30% a la distancia en línea recta. Están en `dominio/distancia.ts`.

---

## Qué se probó y qué falta probar

Se probó:
- Las 10 pruebas unitarias del planificador y los validadores.
- La revisión de tipos y el lint de todas las funciones.
- Las migraciones, el seed y la función `buscar_lugares` en Postgres 16 con pgvector.

Falta probar, porque solo funciona en Supabase con tu API key:
- Las llamadas a Claude.
- Los embeddings `gte-small`.
- El despliegue.

Pruébalo con `evaluar.ts` apenas despliegues.

## Datos

`seed.sql` trae **datos de ejemplo no verificados**. Antes de la demo:
- reemplázalos con precios y horarios reales;
- llena `fuente` y `fecha_verificacion`;
- marca `verificado = true`;
- vuelve a ejecutar `/generar-embeddings`.
