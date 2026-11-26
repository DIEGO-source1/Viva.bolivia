import { createClient, type SupabaseClient } from '../deps.ts';
import { env } from '../config/env.ts';

let cliente: SupabaseClient | null = null;

/** Cliente con service role: solo existe en el backend, nunca en Angular. */
export function db(): SupabaseClient {
  cliente ??= createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false },
  });
  return cliente;
}
