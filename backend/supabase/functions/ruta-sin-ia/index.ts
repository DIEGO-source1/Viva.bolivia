// POST /ruta-sin-ia  — ruta desde un formulario, sin IA (para comparar)
// Cuerpo: { presupuesto, horas, tipos?, zona?, idioma?, origen?, soloAbiertos? }
import { crearHandler, leerJson } from '../_shared/http/handler.ts';
import { EntradaRutaSinIA } from '../_shared/http/entradas.ts';
import { ok } from '../_shared/http/respuestas.ts';
import { generarRutaSinIA } from '../_shared/servicios/ruta.service.ts';

Deno.serve(crearHandler('POST', async (req) => {
  const entrada = await leerJson(req, EntradaRutaSinIA);
  return ok(await generarRutaSinIA(entrada));
}));
