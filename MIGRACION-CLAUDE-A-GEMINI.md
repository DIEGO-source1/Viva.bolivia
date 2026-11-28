# Cambio de proveedor IA: Claude → Gemini

## Cambios
- Se reemplazó el cliente Anthropic por una llamada REST a Gemini `generateContent`.
- Se conserva la interfaz `llamarHerramienta`, por lo que las tareas de extracción de intención, redacción de itinerario y escáner no necesitan cambiar.
- Los esquemas de herramienta se convierten a `responseSchema` de Gemini para salida JSON estructurada.
- Se conserva soporte de imágenes mediante `inlineData`.
- Se conservan los contadores de tokens y el reintento ante errores temporales.
- Se cambia `IA_API_KEY` por `GEMINI_API_KEY`.
- Modelo predeterminado: `gemini-2.5-flash-lite`.

## Configuración Vercel
Mantener `DATABASE_URL` y `CORS_ORIGIN`. Añadir:
- `GEMINI_API_KEY`: clave creada en Google AI Studio.
- `IA_MODELO`: `gemini-2.5-flash-lite`.
- `IA_MODELO_VISION`: `gemini-2.5-flash-lite`.

Eliminar del proyecto Vercel la variable `IA_API_KEY` de Anthropic si se había añadido, para evitar confusión. No eliminar `DATABASE_URL`.

## Límites y privacidad
El nivel gratuito de Gemini está sujeto a límites por modelo, región y cuenta, y puede cambiar. Google señala que en el nivel gratuito el contenido puede usarse para mejorar sus productos. No enviar datos personales sensibles. La clave solo debe existir en el backend.

## Antes de desplegar
- Ejecutar `npm run typecheck` dentro de `backend`.
- Probar `/api/salud`.
- Probar `/api/ruta` con una consulta breve.
- Probar `/api/escanear` con una foto no sensible y un plato incluido en la tabla `platos`.
