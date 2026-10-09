import type { Cliente } from '../types';
import { supabase, supabaseConfigurado } from './supabase';
import { mapClienteToDb } from './supabaseMappers';

/**
 * Operações da tabela `clientes` (os amigos e amigas da Casa Furtacor).
 *
 * O `id` é gerado no cliente (`crypto.randomUUID`) para que possamos gravar o
 * cliente e o ingresso sem precisar ler o registro de volta — a política de RLS
 * permite INSERT anônimo, mas não SELECT público.
 */
export const clientesService = {
  async criar(cliente: Cliente): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase.from('clientes').upsert(mapClienteToDb(cliente), {
      onConflict: 'id',
    });
    if (error) throw error;
  },
};
