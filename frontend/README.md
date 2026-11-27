# Viva Bolivia · Frontend

Aplicación Angular para explorar rutas locales de turismo y gastronomía en Cochabamba. El frontend consume la API del directorio `backend` y mantiene separadas la presentación, la coordinación de pantalla y el acceso a datos.

## Desarrollo local

Necesitas Node.js y npm. Instala dependencias una vez:

```bash
npm install
```

Levanta el backend de demostración en una terminal:

```bash
cd ../backend
npm run demo
```

En otra terminal, desde `frontend`:

```bash
npm start
```

Abre [http://localhost:4200](http://localhost:4200). El servidor Angular redirige `/api` a `http://localhost:3000` mediante `proxy.conf.json`, por lo que el navegador no necesita configuración CORS adicional.

El modo **Completar datos** usa `/api/ruta-sin-ia` y funciona con la API de demostración. **Cuéntame tu plan** usa `/api/ruta` y requiere que el backend tenga `IA_API_KEY` configurada; si el servicio responde `503`, la pantalla ofrece continuar con el formulario manual.

## Estructura

```text
src/app/
├── app.ts                         # Shell de la aplicación
├── app.routes.ts                  # Rutas y carga diferida por feature
├── app.config.ts                  # Router y cliente HTTP
└── features/planificador/
    ├── data-access/               # Comunicación HTTP con la API
    ├── models/                    # Contratos de request y response
    ├── pages/                     # Coordinación de la página
    └── ui/                        # Formulario y presentación del resultado
```

Al ampliar el producto, cada capacidad puede vivir como una feature independiente; los componentes de UI no acceden directamente a HTTP y los modelos reflejan los contratos del backend.

## Comandos

```bash
npm start
npm run build
```

El workspace todavía no tiene un runner de pruebas configurado.
