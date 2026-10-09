import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * O projeto usa Vite, cujo prefixo de variáveis expostas ao front é `VITE_`.
 * Mantemos também `NEXT_PUBLIC_` como alias para quem migrar para Next.js no
 * futuro — assim a mesma base de código funciona nos dois empacotadores.
 */
function lerEnv(chaveVite: string, chaveNext: string): string {
  const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
  return env[chaveVite] || env[chaveNext] || '';
}

export const supabaseUrl = lerEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
export const supabaseAnonKey = lerEnv(
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);

/**
 * Sem credenciais o `createClient` lança no carregamento do módulo — e como
 * este arquivo é importado por `App`, a exception derrubava a página inteira
 * antes de a casa conseguir renderizar qualquer coisa.
 *
 * O site continua funcionando sem Supabase: os dados ficam no dispositivo e a
 * sincronização remota simplesmente não acontece. Por isso devolvemos um cliente
 * inerte no lugar de deixar o erro estourar.
 */
function criarCliente(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não configuradas. ' +
        'O site abrirá normalmente, mas a sincronização com o banco ficará desligada.'
    );
    return null as unknown as SupabaseClient<Database>;
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = criarCliente();
