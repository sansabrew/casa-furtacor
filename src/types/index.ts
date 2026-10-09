export interface Admin {
  id: string;
  nome: string;
  email: string;
  senhaHash?: string;
  createdAt: string;
}

export interface Evento {
  id: string;
  titulo: string;
  local: string;
  endereco: string;
  dataEvento: string; // Ex: '2026-10-10'
  horario: string;    // Ex: '19:00h'
  valor: number;      // Ex: 20.00
  imagemUrl?: string;
  descricao?: string;
  capacidadeMaxima: number;
  ativo: boolean;
  tags?: string[];
  createdAt: string;
}

export interface Cliente {
  id: string;
  nomeCompleto: string;
  documento: string; // RG ou CPF
  whatsapp: string;  // Ex: '83999999999'
  createdAt: string;
}

export interface AmigoInscricao {
  nomeCompleto: string;
  documento: string;
  whatsapp?: string;
}

export interface Ingresso {
  id: string;
  eventoId: string;
  clienteId: string;
  codigoIngresso: string; // Ex: 'FURTA-2026-8841'
  statusPagamento: 'pago' | 'pendente' | 'cancelado';
  valorPago: number;
  checkInRealizado: boolean;
  checkInHora?: string;
  createdAt: string;
  // Campos desnormalizados para conveniência e performance
  clienteNome: string;
  clienteDocumento: string;
  clienteWhatsapp: string;
  eventoTitulo: string;
  pixPayload?: string;
  pedidoId?: string;
}

export interface PortariaStats {
  totalIngressos: number;
  totalPagos: number;
  totalPendentes: number;
  totalPresentes: number;
  arrecadacaoTotal: number;
  capacidade: number;
}

// ============================================
// Tipos do Chat Híbrido (IA + Humano)
// ============================================
export type ChatStatus = 'ia' | 'aguardando_humano' | 'em_atendimento' | 'finalizado';

export interface ChatSession {
  id: string;
  session_token: string;
  cliente_nome: string;
  status: ChatStatus;
  created_at: string;
  updated_at: string;
  ultima_mensagem?: string;
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  remetente: 'cliente' | 'ia' | 'admin';
  mensagem: string;
  timestamp: string;
}



