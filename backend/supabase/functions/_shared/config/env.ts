// Lectura de variables de entorno con error claro si falta alguna.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase automáticamente.
// IA_API_KEY y ADMIN_KEY se configuran con: supabase secrets set NOMBRE=valor

function requerida(nombre: string): string {
  const valor = Deno.env.get(nombre);
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

export const env = {
  get supabaseUrl() {
    return requerida('SUPABASE_URL');
  },
  get serviceRoleKey() {
    return requerida('SUPABASE_SERVICE_ROLE_KEY');
  },
  get iaApiKey() {
    return requerida('IA_API_KEY');
  },
  get iaModelo() {
    return Deno.env.get('IA_MODELO') ?? 'claude-haiku-5-5';
  },
  get iaModeloVision() {
    return Deno.env.get('IA_MODELO_VISION') ?? this.iaModelo;
  },
  get adminKey() {
    return requerida('ADMIN_KEY');
  },
  get corsOrigin() {
    return Deno.env.get('CORS_ORIGIN') ?? '*';
  },
};
