import type { Evento, Cliente, Ingresso } from '../types';
import type {
  EventoRow,
  EventoInsert,
  ClienteRow,
  ClienteInsert,
  IngressoRow,
  IngressoInsert,
} from '../types/database';

/**
 * Conversores entre as linhas (`snake_case`) do Supabase e os modelos de
 * domínio (`camelCase`) usados nos componentes da Casa Furtacor.
 */

export function mapEventoFromDb(row: EventoRow): Evento {
  return {
    id: row.id,
    titulo: row.titulo,
    local: row.local ?? 'Casa Furtacor',
    endereco: row.endereco ?? '',
    dataEvento: row.data_evento,
    horario: row.horario,
    valor: Number(row.valor),
    imagemUrl: row.imagem_url ?? undefined,
    descricao: row.descricao ?? undefined,
    capacidadeMaxima: row.capacidade_maxima ?? 50,
    ativo: row.ativo,
    tags: row.tags ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapEventoToDb(evento: Evento): EventoInsert {
  return {
    id: evento.id,
    titulo: evento.titulo,
    local: evento.local,
    endereco: evento.endereco,
    data_evento: evento.dataEvento,
    horario: evento.horario,
    valor: evento.valor,
    imagem_url: evento.imagemUrl ?? null,
    descricao: evento.descricao ?? null,
    capacidade_maxima: evento.capacidadeMaxima,
    ativo: evento.ativo,
    tags: evento.tags ?? null,
  };
}

export function mapClienteFromDb(row: ClienteRow): Cliente {
  return {
    id: row.id,
    nomeCompleto: row.nome_completo,
    documento: row.documento,
    whatsapp: row.whatsapp,
    createdAt: row.created_at,
  };
}

export function mapClienteToDb(cliente: Cliente): ClienteInsert {
  return {
    id: cliente.id,
    nome_completo: cliente.nomeCompleto,
    documento: cliente.documento,
    whatsapp: cliente.whatsapp,
  };
}

export function mapIngressoFromDb(row: IngressoRow): Ingresso {
  return {
    id: row.id,
    eventoId: row.evento_id ?? '',
    clienteId: row.cliente_id ?? '',
    codigoIngresso: row.codigo_ingresso,
    statusPagamento: (row.status_pagamento as Ingresso['statusPagamento']) ?? 'pendente',
    valorPago: Number(row.valor_pago),
    checkInRealizado: row.check_in_realizado,
    checkInHora: row.check_in_hora ?? undefined,
    createdAt: row.created_at,
    clienteNome: row.cliente_nome,
    clienteDocumento: row.cliente_documento,
    clienteWhatsapp: row.cliente_whatsapp,
    eventoTitulo: row.evento_titulo,
    pixPayload: row.pix_payload ?? undefined,
    pedidoId: row.pedido_id ?? undefined,
  };
}

export function mapIngressoToDb(ingresso: Ingresso): IngressoInsert {
  return {
    id: ingresso.id,
    evento_id: ingresso.eventoId || null,
    cliente_id: ingresso.clienteId || null,
    codigo_ingresso: ingresso.codigoIngresso,
    status_pagamento: ingresso.statusPagamento,
    valor_pago: ingresso.valorPago,
    check_in_realizado: ingresso.checkInRealizado,
    check_in_hora: ingresso.checkInHora ?? null,
    cliente_nome: ingresso.clienteNome,
    cliente_documento: ingresso.clienteDocumento,
    cliente_whatsapp: ingresso.clienteWhatsapp,
    evento_titulo: ingresso.eventoTitulo,
    pix_payload: ingresso.pixPayload ?? null,
    pedido_id: ingresso.pedidoId ?? null,
  };
}
