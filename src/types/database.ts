/**
 * Tipagem do banco de dados Supabase da Casa Furtacor.
 *
 * Este arquivo descreve as tabelas usadas pela aplicação e é passado como
 * parâmetro genérico para `createClient<Database>` em `src/services/supabase.ts`,
 * garantindo autocomplete e checagem de tipos em todas as consultas.
 *
 * O formato segue o esperado pelo `@supabase/supabase-js` (GenericSchema):
 * cada schema expõe `Tables`, `Views` e `Functions`.
 *
 * Observação: `data_evento` fica como `string` (TEXT no banco) porque a portaria
 * cadastra datas livres, por exemplo "14 de Novembro de 2026".
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      eventos: {
        Row: {
          id: string;
          titulo: string;
          local: string | null;
          endereco: string | null;
          data_evento: string;
          horario: string;
          valor: number;
          imagem_url: string | null;
          descricao: string | null;
          capacidade_maxima: number;
          ativo: boolean;
          tags: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          local?: string | null;
          endereco?: string | null;
          data_evento: string;
          horario: string;
          valor: number;
          imagem_url?: string | null;
          descricao?: string | null;
          capacidade_maxima?: number;
          ativo?: boolean;
          tags?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          titulo?: string;
          local?: string | null;
          endereco?: string | null;
          data_evento?: string;
          horario?: string;
          valor?: number;
          imagem_url?: string | null;
          descricao?: string | null;
          capacidade_maxima?: number;
          ativo?: boolean;
          tags?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          nome_completo: string;
          documento: string;
          whatsapp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome_completo: string;
          documento: string;
          whatsapp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome_completo?: string;
          documento?: string;
          whatsapp?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ingressos: {
        Row: {
          id: string;
          evento_id: string | null;
          cliente_id: string | null;
          codigo_ingresso: string;
          status_pagamento: string;
          valor_pago: number;
          check_in_realizado: boolean;
          check_in_hora: string | null;
          created_at: string;
          cliente_nome: string;
          cliente_documento: string;
          cliente_whatsapp: string;
          evento_titulo: string;
          pix_payload: string | null;
          pedido_id: string | null;
        };
        Insert: {
          id?: string;
          evento_id?: string | null;
          cliente_id?: string | null;
          codigo_ingresso: string;
          status_pagamento?: string;
          valor_pago: number;
          check_in_realizado?: boolean;
          check_in_hora?: string | null;
          created_at?: string;
          cliente_nome: string;
          cliente_documento: string;
          cliente_whatsapp: string;
          evento_titulo: string;
          pix_payload?: string | null;
          pedido_id?: string | null;
        };
        Update: {
          id?: string;
          evento_id?: string | null;
          cliente_id?: string | null;
          codigo_ingresso?: string;
          status_pagamento?: string;
          valor_pago?: number;
          check_in_realizado?: boolean;
          check_in_hora?: string | null;
          created_at?: string;
          cliente_nome?: string;
          cliente_documento?: string;
          cliente_whatsapp?: string;
          evento_titulo?: string;
          pix_payload?: string | null;
          pedido_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ingressos_evento_id_fkey';
            columns: ['evento_id'];
            isOneToOne: false;
            referencedRelation: 'eventos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ingressos_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          },
        ];
      };
      chat_sessions: {
        Row: {
          id: string;
          session_token: string;
          cliente_nome: string;
          status: string;
          created_at: string;
          updated_at: string;
          ultima_mensagem: string | null;
          unread_count: number | null;
        };
        Insert: {
          id?: string;
          session_token: string;
          cliente_nome: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          ultima_mensagem?: string | null;
          unread_count?: number | null;
        };
        Update: {
          id?: string;
          session_token?: string;
          cliente_nome?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          ultima_mensagem?: string | null;
          unread_count?: number | null;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          remetente: string;
          mensagem: string;
          timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          remetente: string;
          mensagem: string;
          timestamp?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          remetente?: string;
          mensagem?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chat_messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'chat_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type EventoRow = Database['public']['Tables']['eventos']['Row'];
export type EventoInsert = Database['public']['Tables']['eventos']['Insert'];
export type ClienteRow = Database['public']['Tables']['clientes']['Row'];
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert'];
export type IngressoRow = Database['public']['Tables']['ingressos']['Row'];
export type IngressoInsert = Database['public']['Tables']['ingressos']['Insert'];
