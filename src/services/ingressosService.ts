import type { Ingresso } from '../types';
import { supabase, supabaseConfigurado } from './supabase';
import { mapIngressoFromDb, mapIngressoToDb } from './supabaseMappers';

/**
 * Operações da tabela `ingressos`.
 *
 * Inserção é pública (liberada por RLS). Leitura completa, atualização e
 * exclusão dependem de sessão autenticada — por isso o painel administrativo
 * é o único que lista todos os ingressos.
 */
export const ingressosService = {
  async criar(ingresso: Ingresso): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase.from('ingressos').upsert(mapIngressoToDb(ingresso), {
      onConflict: 'id',
    });
    if (error) throw error;
  },

  /** Lista todos os ingressos (apenas administradores autenticados). */
  async listarTodos(): Promise<Ingresso[]> {
    if (!supabaseConfigurado) return [];
    const { data, error } = await supabase
      .from('ingressos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapIngressoFromDb);
  },

  async atualizarStatus(id: string, status: Ingresso['statusPagamento']): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase
      .from('ingressos')
      .update({ status_pagamento: status })
      .eq('id', id);
    if (error) throw error;
  },

  async definirStatusDoPedido(pedidoId: string, status: Ingresso['statusPagamento']): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase
      .from('ingressos')
      .update({ status_pagamento: status })
      .eq('pedido_id', pedidoId);
    if (error) throw error;
  },

  async realizarCheckIn(
    id: string,
    realizado: boolean,
    hora: string | null,
    statusPagamento: Ingresso['statusPagamento']
  ): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase
      .from('ingressos')
      .update({
        check_in_realizado: realizado,
        check_in_hora: hora,
        status_pagamento: statusPagamento,
      })
      .eq('id', id);
    if (error) throw error;
  },

  async excluir(id: string): Promise<void> {
    if (!supabaseConfigurado) return;
    const { error } = await supabase.from('ingressos').delete().eq('id', id);
    if (error) throw error;
  },
};
