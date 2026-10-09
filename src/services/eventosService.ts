import type { Evento } from '../types';
import { supabase, supabaseConfigurado } from './supabase';
import { mapEventoFromDb, mapEventoToDb } from './supabaseMappers';

/**
 * Operações de leitura e escrita da tabela `eventos`.
 *
 * As funções lançam erro em caso de falha de conexão para que a camada de
 * armazenamento (`storageService`) decida entre manter o cache local ou exibir
 * uma mensagem amigável.
 */
export const eventosService = {
  /** Eventos visíveis ao público: ativos, ordenados pela data mais próxima. */
  async listarAtivos(): Promise<Evento[]> {
    if (!supabaseConfigurado) return [];
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('ativo', true)
      .order('data_evento', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapEventoFromDb);
  },

  /** Todos os eventos (inclusive inativos) — usado no painel administrativo. */
  async listarTodos(): Promise<Evento[]> {
    if (!supabaseConfigurado) return [];
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapEventoFromDb);
  },

  async criar(evento: Evento): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase.from('eventos').upsert(mapEventoToDb(evento), {
      onConflict: 'id',
    });
    if (error) throw error;
  },

  async atualizar(evento: Evento): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase.from('eventos').upsert(mapEventoToDb(evento), {
      onConflict: 'id',
    });
    if (error) throw error;
  },

  /** Marca um único evento como ativo e desativa todos os demais. */
  async definirAtivo(id: string): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error: erroDesativar } = await supabase
      .from('eventos')
      .update({ ativo: false })
      .neq('id', id);
    if (erroDesativar) throw erroDesativar;

    const { error: erroAtivar } = await supabase
      .from('eventos')
      .update({ ativo: true })
      .eq('id', id);
    if (erroAtivar) throw erroAtivar;
  },

  async excluir(id: string): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) throw error;
  },
};
