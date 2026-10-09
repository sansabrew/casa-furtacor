import { supabase } from './supabase';
import { usuarioEhAdmin } from './authService';
import { ChatSession, ChatMessage, ChatStatus } from '../types';
import { CONTATO_CONFIG } from '../utils/pix';
import { consultarLimite, registrarAcao, formatarEspera, LIMITES } from '../utils/throttle';

const STORAGE_KEYS = {
  CHAT_TOKEN: 'casa_furtacor_chat_session_token',
  CHAT_CLIENT_NAME: 'casa_furtacor_chat_client_name',
  LOCAL_SESSIONS: 'casa_furtacor_local_chat_sessions',
  LOCAL_MESSAGES_PREFIX: 'casa_furtacor_chat_msgs_',
};

// Respostas inteligentes e acolhedoras para o modo IA da Casa Furtacor
function gerarRespostaIAContextual(mensagem: string, nomeCliente: string): string {
  const m = mensagem.toLowerCase().trim();

  if (
    m.includes('humano') ||
    m.includes('atendente') ||
    m.includes('pessoa') ||
    m.includes('dona rosa') ||
    m.includes('alguém') ||
    m.includes('atendimento')
  ) {
    return `Com certeza, ${nomeCliente}! 💛 Já estou chamando um atendente humano da nossa equipe. A Dona Rosa ou alguém da portaria vai te responder diretamente aqui em instantes.`;
  }

  if (m.includes('ingresso') || m.includes('comprar') || m.includes('valor') || m.includes('preço') || m.includes('pix') || m.includes('quanto')) {
    return `Que maravilha você vir celebrar com a gente! 🎟️ Nossos ingressos afetivos custam apenas R$ 20,00 por pessoa, sem taxas abusivas de conveniência. Você pode reservar aqui mesmo no site via PIX com aprovação instantânea e receber seu bilhete com QR Code nominal.`;
  }

  if (m.includes('endereço') || m.includes('onde') || m.includes('local') || m.includes('chegar') || m.includes('bairro') || m.includes('localização')) {
    return `A Casa Furtacor fica na ${CONTATO_CONFIG.endereco}, no bairro Castelo Branco I em João Pessoa - PB, bem pertinho da pracinha e da UFPB. É uma rua residencial tranquila, com vagas fáceis para estacionar! 🌿`;
  }

  if (m.includes('hospedagem') || m.includes('cabana') || m.includes('dormir') || m.includes('airbnb') || m.includes('quarto') || m.includes('pousada')) {
    return `Sim! Além dos eventos culturais, nós temos uma Cabana Afetiva muito charmosa no quintal, disponível para hospedagem pelo Airbnb. É um refúgio acolhedor, calmo e cercado de plantas para relaxar em João Pessoa. Você pode falar no nosso WhatsApp (+55 83 9148-2353) para receber o link do Airbnb! 🏡✨`;
  }

  if (m.includes('comida') || m.includes('cardápio') || m.includes('bebida') || m.includes('comer') || m.includes('beber')) {
    return `Nos encontros e luaus da casa sempre preparamos comidinhas caseiras e afetivas, além de bebidas para brindar a noite sob as árvores. Tudo feito com ingredientes frescos e muito carinho! ☕🍲`;
  }

  if (m.includes('contato') || m.includes('whatsapp') || m.includes('telefone') || m.includes('zap') || m.includes('insta') || m.includes('instagram')) {
    return `Nossos contatos oficiais são:\n📱 WhatsApp Oficial: ${CONTATO_CONFIG.whatsappNumero}\n📷 Instagram: ${CONTATO_CONFIG.instagramUser} (${CONTATO_CONFIG.instagramUrl})\nFique à vontade para nos acompanhar nas redes!`;
  }

  if (m.includes('horário') || m.includes('hora') || m.includes('quando') || m.includes('data')) {
    return `Nossos luaus e encontros costumam começar por volta das 19h00/19h30, aproveitando a brisa gostosa da noite no quintal. Confira os detalhes completos do próximo evento logo acima na nossa página principal! 🌙✨`;
  }

  if (m.includes('olá') || m.includes('oi') || m.includes('boa noite') || m.includes('boa tarde') || m.includes('bom dia')) {
    return `Olá, ${nomeCliente}! Que alegria ter você aqui no quintal virtual da Casa Furtacor. 🦎✨ Como posso te acolher hoje? Posso tirar dúvidas sobre nossos eventos, ingressos por R$ 20, localização ou sobre a hospedagem na nossa Cabana.`;
  }

  return `Obrigado pela sua mensagem, ${nomeCliente}! 🌿 Na Casa Furtacor prezamos pelo encontro e pelo aconchego. Nossos ingressos custam R$ 20,00, nosso endereço é ${CONTATO_CONFIG.endereco} e temos também hospedagem via Airbnb. Se preferir falar com alguém da equipe agora mesmo, basta clicar em "Falar com Atendente Humano"!`;
}

class ChatService {
  private listenersSession: Map<string, Set<(msgs: ChatMessage[]) => void>> = new Map();
  private listenersAllSessions: Set<(sessions: ChatSession[]) => void> = new Set();
  private sessionSnapshots: Map<string, () => void> = new Map();
  private allSessionsUnsubscribe: (() => void) | null = null;

  public getSessionToken(): string {
    let token = localStorage.getItem(STORAGE_KEYS.CHAT_TOKEN);
    if (!token) {
      token = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.CHAT_TOKEN, token);
    }
    return token;
  }

  public getSavedClientName(): string {
    return localStorage.getItem(STORAGE_KEYS.CHAT_CLIENT_NAME) || 'Visitante do Quintal';
  }

  public setSavedClientName(nome: string): void {
    localStorage.setItem(STORAGE_KEYS.CHAT_CLIENT_NAME, nome.trim());
  }

  // Obter ou inicializar sessão do visitante
  public async getOrCreateSession(clienteNome?: string): Promise<ChatSession> {
    const token = this.getSessionToken();
    const sessionId = `sess_${token}`;
    const nomeFinal = (clienteNome || this.getSavedClientName()).trim();
    if (clienteNome) {
      this.setSavedClientName(clienteNome);
    }

    // Tentar buscar do Firestore
    try {
      const { data, error } = await supabase.from('chat_sessions').select('*').eq('id', sessionId).single();
      if (!error && data) {
        return { id: data.id, session_token: data.session_token, cliente_nome: data.cliente_nome, status: data.status as any, created_at: data.created_at, updated_at: data.updated_at, ultima_mensagem: data.ultima_mensagem ?? undefined, unread_count: data.unread_count ?? undefined };
      }
    } catch (e) {
      console.warn('Busca de sessão Firestore em cache local:', e);
    }

    // Criar nova sessão
    const novaSessao: ChatSession = {
      id: sessionId,
      session_token: token,
      cliente_nome: nomeFinal,
      status: 'ia',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ultima_mensagem: 'Conversa iniciada',
    };

    // Salvar local
    this.salvarSessaoLocal(novaSessao);

    // Salvar no Firestore
    try {
      await supabase.from('chat_sessions').upsert({ id: novaSessao.id, session_token: novaSessao.session_token, cliente_nome: novaSessao.cliente_nome, status: novaSessao.status, created_at: novaSessao.created_at, updated_at: novaSessao.updated_at, ultima_mensagem: novaSessao.ultima_mensagem, unread_count: novaSessao.unread_count });
    } catch (e) {
      console.warn('Erro ao salvar nova sessão no Firestore:', e);
    }

    // Adicionar mensagem de boas-vindas da IA
    const msgBoasVindas: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      session_id: sessionId,
      remetente: 'ia',
      mensagem: `Olá, ${nomeFinal}! Que alegria te ver no quintal da Casa Furtacor! 🦎 Sou o assistente virtual da casa. Posso te ajudar com ingressos afetivos por R$ 20, próximos encontros, localização ou hospedagem na nossa Cabana (Airbnb). Como posso te acolher hoje?`,
      timestamp: new Date().toISOString(),
    };

    await this.salvarMensagem(msgBoasVindas);

    return novaSessao;
  }

  // Histórico local da conversa. Um valor corrompido é descartado em vez de
  // interromper o carregamento: perder o histórico local ainda é melhor que
  // deixar a página em branco.
  private lerMensagensLocais(key: string): ChatMessage[] {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
      const lista: unknown = JSON.parse(raw);
      return Array.isArray(lista) ? (lista as ChatMessage[]) : [];
    } catch {
      localStorage.removeItem(key);
      return [];
    }
  }

  // Salvar mensagem no Firestore e localmente
  public async salvarMensagem(msg: ChatMessage): Promise<void> {
    // 1. Local
    const key = `${STORAGE_KEYS.LOCAL_MESSAGES_PREFIX}${msg.session_id}`;
    const msgs = this.lerMensagensLocais(key);
    if (!msgs.some((m) => m.id === msg.id)) {
      msgs.push(msg);
      localStorage.setItem(key, JSON.stringify(msgs));
    }

    // 2. Atualizar última mensagem na sessão
    try {
      await supabase.from('chat_messages').upsert({ id: msg.id, session_id: msg.session_id, remetente: msg.remetente, mensagem: msg.mensagem, timestamp: msg.timestamp });
      await supabase.from('chat_sessions').update({ updated_at: msg.timestamp, ultima_mensagem: msg.mensagem }).eq('id', msg.session_id);
    } catch (e) {
      console.warn('Erro ao salvar mensagem no Firestore:', e);
    }
  }

  // Enviar mensagem do visitante ou admin
  public async enviarMensagem(
    sessionId: string,
    remetente: 'cliente' | 'ia' | 'admin',
    mensagemTexto: string,
    clienteNome: string = 'Visitante'
  ): Promise<void> {
    const textoLimpo = mensagemTexto.trim();
    if (!textoLimpo) return;

    // Trava de ritmo para quem não é da portaria. A equipe responde em
    // qualquer frequência, então fica de fora.
    if (remetente === 'cliente' && !usuarioEhAdmin()) {
      const limite = consultarLimite(
        LIMITES.chatMensagens.chave,
        LIMITES.chatMensagens.maximo,
        LIMITES.chatMensagens.janelaMs
      );
      if (!limite.permitido) {
        throw new Error(
          `Você está enviando mensagens muito rápido. Tente de novo em ${formatarEspera(limite.esperaSegundos)}.`
        );
      }
      registrarAcao(
        LIMITES.chatMensagens.chave,
        LIMITES.chatMensagens.maximo,
        LIMITES.chatMensagens.janelaMs
      );
    }

    const novaMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      session_id: sessionId,
      remetente,
      mensagem: textoLimpo,
      timestamp: new Date().toISOString(),
    };

    await this.salvarMensagem(novaMsg);

    // Se o cliente enviou e a sessão estiver no modo IA
    if (remetente === 'cliente') {
      const sessaoAtual = await this.getSessao(sessionId);
      const querHumano =
        textoLimpo.toLowerCase().includes('humano') ||
        textoLimpo.toLowerCase().includes('atendente') ||
        textoLimpo.toLowerCase().includes('dona rosa');

      if (querHumano || sessaoAtual?.status === 'aguardando_humano') {
        await this.atualizarStatus(sessionId, 'aguardando_humano');
        // Resposta da IA confirmando o repasse
        setTimeout(async () => {
          const respostaConfirm: ChatMessage = {
            id: `msg_ia_${Date.now()}`,
            session_id: sessionId,
            remetente: 'ia',
            mensagem: `Notifiquei a equipe da Casa Furtacor e a Dona Rosa! 💛 Você já está na fila de atendimento humano e logo alguém responderá por aqui.`,
            timestamp: new Date().toISOString(),
          };
          await this.salvarMensagem(respostaConfirm);
        }, 600);
      } else if (sessaoAtual?.status === 'ia' || !sessaoAtual) {
        // Resposta contextual da IA
        setTimeout(async () => {
          const respostaTexto = gerarRespostaIAContextual(textoLimpo, clienteNome);
          const msgIa: ChatMessage = {
            id: `msg_ia_${Date.now()}`,
            session_id: sessionId,
            remetente: 'ia',
            mensagem: respostaTexto,
            timestamp: new Date().toISOString(),
          };
          await this.salvarMensagem(msgIa);
        }, 750);
      }
    }
  }

  // Solicitar Atendente Humano
  public async chamarAtendenteHumano(sessionId: string): Promise<void> {
    await this.atualizarStatus(sessionId, 'aguardando_humano');
    const msgAviso: ChatMessage = {
      id: `msg_humano_${Date.now()}`,
      session_id: sessionId,
      remetente: 'ia',
      mensagem: `🛎️ Atendimento humano solicitado! Notificamos a Dona Rosa e a equipe da Casa Furtacor no painel da portaria. Por favor, aguarde só um instante que responderemos aqui mesmo.`,
      timestamp: new Date().toISOString(),
    };
    await this.salvarMensagem(msgAviso);
  }

  // Admin assume a conversa
  public async assumirConversaAdmin(sessionId: string): Promise<void> {
    await this.atualizarStatus(sessionId, 'em_atendimento');
    const msgEntrada: ChatMessage = {
      id: `msg_admin_entry_${Date.now()}`,
      session_id: sessionId,
      remetente: 'admin',
      mensagem: `Olá querido(a)! Aqui é a Dona Rosa / equipe da Casa Furtacor. Assumi a conversa para te atender pessoalmente. Como posso te ajudar? 🏡💛`,
      timestamp: new Date().toISOString(),
    };
    await this.salvarMensagem(msgEntrada);
  }

  // Alternar entre modo IA e modo manual
  public async alternarModoIA(sessionId: string, ativarIA: boolean): Promise<void> {
    const novoStatus: ChatStatus = ativarIA ? 'ia' : 'em_atendimento';
    await this.atualizarStatus(sessionId, novoStatus);
    const msgStatus: ChatMessage = {
      id: `msg_status_${Date.now()}`,
      session_id: sessionId,
      remetente: 'admin',
      mensagem: ativarIA
        ? `🤖 Modo Assistente Virtual (IA) reativado para este atendimento.`
        : `👤 Modo Manual (Atendente Humano) ativado. A IA está pausada.`,
      timestamp: new Date().toISOString(),
    };
    await this.salvarMensagem(msgStatus);
  }

  public async finalizarAtendimento(sessionId: string): Promise<void> {
    await this.atualizarStatus(sessionId, 'finalizado');
    const msgFim: ChatMessage = {
      id: `msg_fim_${Date.now()}`,
      session_id: sessionId,
      remetente: 'admin',
      mensagem: `Atendimento finalizado com muito carinho. Sempre que precisar de nós, estamos de portas abertas! Um abraço da Casa Furtacor. ✨`,
      timestamp: new Date().toISOString(),
    };
    await this.salvarMensagem(msgFim);
  }

  public async atualizarStatus(sessionId: string, status: ChatStatus): Promise<void> {
    try {
      await supabase.from('chat_sessions').update({ status, updated_at: new Date().toISOString() }).eq('id', sessionId);
    } catch (e) {
      console.warn('Erro ao atualizar status da sessão no Firestore:', e);
    }
  }

  public async getSessao(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data } = await supabase.from('chat_sessions').select('*').eq('id', sessionId).single();
      if (data) {
        return { id: data.id, session_token: data.session_token, cliente_nome: data.cliente_nome, status: data.status as any, created_at: data.created_at, updated_at: data.updated_at, ultima_mensagem: data.ultima_mensagem ?? undefined, unread_count: data.unread_count ?? undefined };
      }
    } catch {}
    return null;
  }

  // Escutar mensagens de uma sessão específica em tempo real
  public subscribeMessages(sessionId: string, callback: (msgs: ChatMessage[]) => void): () => void {
    // 1. Notificar dados locais imediatamente
    callback(this.lerMensagensLocais(`${STORAGE_KEYS.LOCAL_MESSAGES_PREFIX}${sessionId}`));

    // 2. Conectar Firestore em tempo real.
    // A consulta é restrita à própria sessão: as regras não permitem que um
    // visitante anônimo liste o histórico de mensagens dos outros amigos.
    const key = `${STORAGE_KEYS.LOCAL_MESSAGES_PREFIX}${sessionId}`;
    try {
      const channel = supabase
        .channel(`chat_messages_${sessionId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` }, async () => {
          const { data } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('timestamp', { ascending: true });
          if (data) {
            localStorage.setItem(key, JSON.stringify(data));
            callback(data.map(m => ({ id: m.id, session_id: m.session_id, remetente: m.remetente, mensagem: m.mensagem, timestamp: m.timestamp })) as any);
          }
        })
        .subscribe();
      const unsubscribe = () => { supabase.removeChannel(channel); };

      return () => unsubscribe();
    } catch (e) {
      console.warn('Fallback para mensagens locais:', e);
      return () => {};
    }
  }

  // Escutar todas as sessões em tempo real (para o Painel Admin)
  public subscribeAllSessions(callback: (sessions: ChatSession[]) => void): () => void {
    // Só a portaria tem permissão de listar as conversas da casa.
    if (!usuarioEhAdmin()) {
      callback([]);
      return () => {};
    }
    try {
      const channel = supabase
        .channel('chat_sessions_all')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, async () => {
          const { data } = await supabase.from('chat_sessions').select('*').order('updated_at', { ascending: false }).limit(50);
          if (data) {
            callback(data.map(d => ({ id: d.id, session_token: d.session_token, cliente_nome: d.cliente_nome, status: d.status as any, created_at: d.created_at, updated_at: d.updated_at, ultima_mensagem: d.ultima_mensagem, unread_count: d.unread_count })) as any);
          }
        })
        .subscribe();
      const unsubscribe = () => { supabase.removeChannel(channel); };

      return () => unsubscribe();
    } catch (e) {
      console.warn('Fallback sessões:', e);
      return () => {};
    }
  }

  // Escutar novas mensagens de visitantes para alertas sonoros no painel administrativo
  public subscribeNovasMensagensVisitantes(callback: (msg: ChatMessage) => void): () => void {
    if (!usuarioEhAdmin()) return () => {};
    try {
      let isInitial = true;
      const channel = supabase
        .channel('chat_new_msgs')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          const m: any = payload.new;
          if (m.remetente === 'cliente') {
            callback({ id: m.id, session_id: m.session_id, remetente: m.remetente, mensagem: m.mensagem, timestamp: m.timestamp });
          }
        })
        .subscribe();
      const unsubscribe = () => { supabase.removeChannel(channel); };

      return () => unsubscribe();
    } catch {
      return () => {};
    }
  }

  private salvarSessaoLocal(sessao: ChatSession) {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_SESSIONS);
    let sessions: ChatSession[] = [];
    if (raw) {
      try {
        const lista: unknown = JSON.parse(raw);
        if (Array.isArray(lista)) sessions = lista as ChatSession[];
      } catch {
        localStorage.removeItem(STORAGE_KEYS.LOCAL_SESSIONS);
      }
    }
    const idx = sessions.findIndex((s) => s.id === sessao.id);
    if (idx !== -1) {
      sessions[idx] = sessao;
    } else {
      sessions.unshift(sessao);
    }
    localStorage.setItem(STORAGE_KEYS.LOCAL_SESSIONS, JSON.stringify(sessions));
  }
}

export const chatService = new ChatService();
