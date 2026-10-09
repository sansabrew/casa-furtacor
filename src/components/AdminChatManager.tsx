import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  UserCheck,
  Clock,
  Send,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { ChatSession, ChatMessage, ChatStatus } from '../types';
import { audioAlert } from '../utils/audioAlert';

export const AdminChatManager: React.FC = () => {
  const [sessoes, setSessoes] = useState<ChatSession[]>([]);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<ChatSession | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [textoAdmin, setTextoAdmin] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [somHabilitado, setSomHabilitado] = useState(true);
  const [ultimoAvisoHumano, setUltimoAvisoHumano] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escutar todas as sessões em tempo real
  useEffect(() => {
    const unsub = chatService.subscribeAllSessions((todas) => {
      setSessoes(todas);

      // Verificar se há alguém aguardando humano para emitir alerta sonoro/visual
      const temAguardando = todas.find((s) => s.status === 'aguardando_humano');
      if (temAguardando && temAguardando.id !== ultimoAvisoHumano) {
        setUltimoAvisoHumano(temAguardando.id);
        audioAlert.tocarSinetaRecepcao();
      }

      // Manter a sessão selecionada sincronizada
      if (sessaoSelecionada) {
        const atual = todas.find((s) => s.id === sessaoSelecionada.id);
        if (atual) setSessaoSelecionada(atual);
      }
    });

    return () => unsub();
  }, [sessaoSelecionada, ultimoAvisoHumano, somHabilitado]);

  // Escutar mensagens da sessão selecionada
  useEffect(() => {
    if (!sessaoSelecionada) {
      setMensagens([]);
      return;
    }

    const unsub = chatService.subscribeMessages(sessaoSelecionada.id, (msgs) => {
      setMensagens(msgs);
    });

    return () => unsub();
  }, [sessaoSelecionada?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviarMensagem = async (e?: React.FormEvent, customTexto?: string) => {
    if (e) e.preventDefault();
    const txt = customTexto || textoAdmin;
    if (!txt.trim() || !sessaoSelecionada) return;

    setTextoAdmin('');
    await chatService.enviarMensagem(sessaoSelecionada.id, 'admin', txt, 'Dona Rosa / Equipe');
  };

  const handleAssumirConversa = async () => {
    if (!sessaoSelecionada) return;
    await chatService.assumirConversaAdmin(sessaoSelecionada.id);
  };

  const handleAlternarIA = async () => {
    if (!sessaoSelecionada) return;
    const isAtualmenteIA = sessaoSelecionada.status === 'ia';
    await chatService.alternarModoIA(sessaoSelecionada.id, !isAtualmenteIA);
  };

  const handleFinalizar = async () => {
    if (!sessaoSelecionada) return;
    await chatService.finalizarAtendimento(sessaoSelecionada.id);
  };

  // Filtragem das sessões
  const sessoesFiltradas = sessoes.filter((s) => {
    const matchBusca =
      s.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
      (s.ultima_mensagem && s.ultima_mensagem.toLowerCase().includes(busca.toLowerCase()));

    if (!matchBusca) return false;
    if (filtroStatus === 'todos') return true;
    return s.status === filtroStatus;
  });

  const totalAguardandoHumano = sessoes.filter((s) => s.status === 'aguardando_humano').length;

  return (
    <div className="space-y-4">
      {/* Alerta de Fila de Espera Humana */}
      {totalAguardandoHumano > 0 && (
        <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-amber-900 dark:text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-semibold">
              Atenção: {totalAguardandoHumano} {totalAguardandoHumano === 1 ? 'visitante está' : 'visitantes estão'} aguardando atendimento humano!
            </span>
          </div>
          <button
            onClick={() => setFiltroStatus('aguardando_humano')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Ver fila
          </button>
        </div>
      )}

      {/* Interface Principal do Chat em Duas Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[580px] bg-white rounded-3xl border border-[#DDD3C5] shadow-xs overflow-hidden">
        {/* Coluna da Esquerda: Lista de Conversas (4 colunas) */}
        <div className="md:col-span-5 border-r border-[#E6DCD1] flex flex-col h-full bg-[#FAF7F2]">
          {/* Topo da Lista: Busca e Filtros */}
          <div className="p-3.5 border-b border-[#E6DCD1] space-y-2.5 shrink-0 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#2C241E] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#C85A32]" />
                Conversas Ativas ({sessoes.length})
              </span>
              <button
                type="button"
                onClick={() => setSomHabilitado(!somHabilitado)}
                className="p-1 text-[#8A7869] hover:text-[#2C241E] transition-colors"
                title={somHabilitado ? 'Silenciar avisos sonoros' : 'Ativar avisos sonoros'}
              >
                {somHabilitado ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </button>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A7869]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar visitante ou mensagem..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-xs outline-none text-[#2C241E]"
              />
            </div>

            {/* Filtros rápidos de status */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'aguardando_humano', label: `Aguardando (${totalAguardandoHumano})` },
                { id: 'em_atendimento', label: 'Em Atendimento' },
                { id: 'ia', label: 'Modo IA' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltroStatus(f.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer border ${
                    filtroStatus === f.id
                      ? 'bg-[#2C241E] text-white border-[#2C241E] font-semibold'
                      : 'bg-white text-[#6B5A4D] border-[#DDD3C5] hover:border-[#2C241E]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista com Rolagem */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E6DCD1]">
            {sessoesFiltradas.map((s) => {
              const selecionada = sessaoSelecionada?.id === s.id;
              const isAguardando = s.status === 'aguardando_humano';

              return (
                <button
                  key={s.id}
                  onClick={() => setSessaoSelecionada(s)}
                  className={`w-full p-3.5 text-left flex items-start justify-between gap-2.5 transition-colors cursor-pointer ${
                    selecionada
                      ? 'bg-[#EFE7DC] border-l-4 border-l-[#C85A32]'
                      : isAguardando
                      ? 'bg-amber-50/80 hover:bg-amber-100/60'
                      : 'hover:bg-white/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs text-[#2C241E] truncate">
                        {s.cliente_nome}
                      </span>
                      <span className="text-[10px] text-[#8A7869] shrink-0">
                        {new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#6B5A4D] line-clamp-1">
                      {s.ultima_mensagem || 'Iniciou a conversa'}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      {s.status === 'aguardando_humano' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                          <PhoneCall className="w-2.5 h-2.5" />
                          <span>Chamar Humano</span>
                        </span>
                      )}
                      {s.status === 'em_atendimento' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Em atendimento</span>
                        </span>
                      )}
                      {s.status === 'ia' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-800">
                          <Bot className="w-2.5 h-2.5 text-purple-600" />
                          <span>IA Ativa</span>
                        </span>
                      )}
                      {s.status === 'finalizado' && (
                        <span className="text-[10px] text-gray-500">Finalizado</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#DDD3C5] shrink-0 mt-1" />
                </button>
              );
            })}

            {sessoesFiltradas.length === 0 && (
              <div className="p-6 text-center text-xs text-[#8A7869]">
                Nenhuma conversa encontrada.
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Janela do Chat Selecionado (7 colunas) */}
        <div className="md:col-span-7 flex flex-col h-full bg-white">
          {sessaoSelecionada ? (
            <>
              {/* Barra de Ações da Conversa Ativa */}
              <div className="p-3.5 border-b border-[#E6DCD1] bg-[#FAF7F2] flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#2C241E]">
                    {sessaoSelecionada.cliente_nome}
                  </h4>
                  <span className="text-[11px] text-[#8A7869]">
                    Sessão: <code className="font-mono text-[10px]">{sessaoSelecionada.id}</code>
                  </span>
                </div>

                {/* Controles de Atendimento */}
                <div className="flex items-center gap-2">
                  {sessaoSelecionada.status === 'aguardando_humano' ? (
                    <button
                      onClick={handleAssumirConversa}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assumir Conversa</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleAlternarIA}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        sessaoSelecionada.status === 'ia'
                          ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {sessaoSelecionada.status === 'ia' ? (
                        <>
                          <Bot className="w-3.5 h-3.5 text-purple-600" />
                          <span>IA Ativa (Pausar)</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Modo Manual (Reativar IA)</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleFinalizar}
                    className="px-2.5 py-1.5 text-xs text-[#8A7869] hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    title="Encerrar este atendimento"
                  >
                    Finalizar
                  </button>
                </div>
              </div>

              {/* Mensagens com Rolagem */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs sm:text-sm bg-white">
                {mensagens.map((m) => {
                  const isAdmin = m.remetente === 'admin';
                  const isCliente = m.remetente === 'cliente';
                  const isIa = m.remetente === 'ia';

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[10px] text-[#8A7869] mb-1 px-1 flex items-center gap-1">
                        {isAdmin && (
                          <span className="font-semibold text-[#C85A32] flex items-center gap-1">
                            <Heart className="w-2.5 h-2.5 fill-[#C85A32]" />
                            Você (Dona Rosa / Equipe)
                          </span>
                        )}
                        {isCliente && (
                          <span className="font-semibold text-[#2C241E]">
                            {sessaoSelecionada.cliente_nome}
                          </span>
                        )}
                        {isIa && (
                          <span className="font-semibold text-purple-700 flex items-center gap-1">
                            <Bot className="w-2.5 h-2.5" />
                            Assistente Virtual (IA)
                          </span>
                        )}
                        <span>·</span>
                        <span>
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>

                      <div
                        className={`max-w-[80%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                          isAdmin
                            ? 'bg-[#2C241E] text-white rounded-br-xs shadow-xs'
                            : isCliente
                            ? 'bg-[#FAF7F2] text-[#2C241E] border border-[#E6DCD1] rounded-bl-xs shadow-xs'
                            : 'bg-purple-50 text-purple-900 border border-purple-200 rounded-bl-xs'
                        }`}
                      >
                        {m.mensagem}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Respostas Rápidas / Templates da Dona Rosa */}
              <div className="px-3 py-1.5 bg-[#FAF7F2] border-t border-[#E6DCD1] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-[#8A7869] uppercase shrink-0">
                  Respostas Rápidas:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleEnviarMensagem(
                      undefined,
                      'Olá querido(a)! Seja muito bem-vindo(a) à Casa Furtacor. Como podemos te acolher hoje?'
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-[#EFE7DC] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  👋 Boas-vindas
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleEnviarMensagem(
                      undefined,
                      'Nossos ingressos afetivos custam R$ 20,00 via PIX direto aqui pelo site, sem taxas abusivas e com QR Code nominal!'
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-[#EFE7DC] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  🎟️ Ingressos R$ 20
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleEnviarMensagem(
                      undefined,
                      'A Casa Furtacor fica na Av. São Rafael, 376 - Castelo Branco I, pertinho da pracinha e da UFPB. Tem estacionamento fácil na rua!'
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-[#EFE7DC] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  📍 Endereço da Casa
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleEnviarMensagem(
                      undefined,
                      'Temos nossa charmosa Cabana Afetiva no Airbnb para quem deseja se hospedar no quintal! Fale no nosso WhatsApp (+55 83 9148-2353) para enviarmos o link direto.'
                    )
                  }
                  className="px-2.5 py-1 bg-white hover:bg-[#EFE7DC] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  🏡 Cabana Airbnb
                </button>
              </div>

              {/* Caixa de Digitação do Atendente */}
              <form
                onSubmit={handleEnviarMensagem}
                className="p-3 bg-white border-t border-[#E6DCD1] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={textoAdmin}
                  onChange={(e) => setTextoAdmin(e.target.value)}
                  placeholder={`Responder como Dona Rosa para ${sessaoSelecionada.cliente_nome}...`}
                  className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-xs sm:text-sm text-[#2C241E] placeholder:text-[#A8988A]"
                />
                <button
                  type="submit"
                  disabled={!textoAdmin.trim()}
                  className="px-4 py-2 bg-[#2C241E] hover:bg-[#43372F] disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-[#E08A68]" />
                  <span>Enviar</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8A7869]">
              <MessageSquare className="w-12 h-12 text-[#DDD3C5] mb-2" />
              <h5 className="font-serif font-bold text-base text-[#2C241E]">
                Nenhuma conversa selecionada
              </h5>
              <p className="text-xs max-w-sm mt-1">
                Escolha uma conversa na lista ao lado para responder visitantes, assumir chamados humanos ou alternar com a IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
