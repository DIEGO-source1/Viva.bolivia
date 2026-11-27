// Variables de entorno. En Vercel se configuran en:
// Project → Settings → Environment Variables.

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

export const env = {
  /** Cadena de conexión de Neon (Connection string, la "pooled"). */
  get databaseUrl() {
    return requerida('DATABASE_URL');
  },
  get iaApiKey() {
    return requerida('IA_API_KEY');
  },
  get iaModelo() {
    return process.env.IA_MODELO || 'claude-haiku-5-5';
  },
  get iaModeloVision() {
    return process.env.IA_MODELO_VISION || this.iaModelo;
  },
  get corsOrigin() {
    const configured = process.env.CORS_ORIGIN;
    if (process.env.VERCEL && !configured) {
      throw new Error('Falta CORS_ORIGIN: configura el dominio exacto del frontend en Vercel');
    }
    return configured || 'http://localhost:4200';
  },
};
