import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  UserCheck,
  Bot,
  User,
  Sparkles,
  PhoneCall,
  Clock,
  Minimize2,
  ChevronDown,
  Heart,
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { ChatSession, ChatMessage, ChatStatus } from '../types';
import { ChameleonLogo } from './ChameleonLogo';
import { CONTATO_CONFIG } from '../utils/pix';

export const ChatWidget: React.FC = () => {
  const [aberto, setAberto] = useState(false);
  const [sessao, setSessao] = useState<ChatSession | null>(null);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [nomeCliente, setNomeCliente] = useState(() => chatService.getSavedClientName());
  const [editandoNome, setEditandoNome] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializar sessão ao montar
  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;

    async function initChat() {
      const s = await chatService.getOrCreateSession(nomeCliente);
      setSessao(s);

      unsubscribeMessages = chatService.subscribeMessages(s.id, (msgs) => {
        setMensagens(msgs);
        // Atualizar status da sessão caso tenha mudado
        chatService.getSessao(s.id).then((atualizada) => {
          if (atualizada) setSessao(atualizada);
        });
      });
    }

    initChat();

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  // Rolar para a última mensagem
  useEffect(() => {
    if (aberto) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, aberto]);

  const handleEnviar = async (e?: React.FormEvent, customTexto?: string) => {
    if (e) e.preventDefault();
    const mensagemFinal = customTexto || texto;
    if (!mensagemFinal.trim() || !sessao) return;

    setTexto('');
    setEnviando(true);
    setErro(null);
    try {
      await chatService.enviarMensagem(sessao.id, 'cliente', mensagemFinal, nomeCliente);
    } catch (err) {
      // Devolve o texto para a pessoa não perder o que escreveu.
      setTexto(mensagemFinal);
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar agora.');
    } finally {
      setEnviando(false);
    }
  };

  const handleChamarHumano = async () => {
    if (!sessao) return;
    await chatService.chamarAtendenteHumano(sessao.id);
    const atualizada = await chatService.getSessao(sessao.id);
    if (atualizada) setSessao(atualizada);
  };

  const handleSalvarNome = () => {
    if (nomeCliente.trim()) {
      chatService.setSavedClientName(nomeCliente.trim());
      setEditandoNome(false);
    }
  };

  const getStatusBadge = (status: ChatStatus) => {
    switch (status) {
      case 'aguardando_humano':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/40 animate-pulse">
            <Clock className="w-3 h-3 text-amber-300" />
            <span>Aguardando Dona Rosa / Atendente</span>
          </span>
        );
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
            <UserCheck className="w-3 h-3 text-emerald-300" />
            <span>Atendente Humano Conectado</span>
          </span>
        );
      case 'finalizado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/20 text-gray-200 border border-gray-400/40">
            <span>Atendimento Finalizado</span>
          </span>
        );
      case 'ia':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/40">
            <Bot className="w-3 h-3 text-purple-300" />
            <span>Assistente Virtual da Casa</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end pointer-events-auto">
      {/* Botão Flutuante (quando fechado) */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="group flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white text-[#2C241E] rounded-full shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 border border-[#E6DCD1] cursor-pointer backdrop-blur-sm"
          aria-label="Abrir chat de atendimento direto da Casa Furtacor"
          title="Tire suas dúvidas aqui"
        >
          <ChameleonLogo size="sm" animated={false} />
          <span className="text-xs font-medium whitespace-nowrap">
            Tire suas dúvidas aqui
          </span>
        </button>
      )}

      {/* Janela Expansível do Chat */}
      {aberto && (
        <div className="w-[92vw] sm:w-[380px] h-[540px] max-h-[82vh] bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Topo do Chat */}
          <div className="bg-[#2C241E] text-white p-4 shrink-0 flex items-center justify-between border-b border-[#3D322A]">
            <div className="flex items-center gap-2.5 min-w-0">
              <ChameleonLogo size="sm" animated={false} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-serif font-bold text-white truncate">
                    Fale com a Casa Furtacor
                  </h4>
                </div>
                <div className="mt-0.5">
                  {sessao ? getStatusBadge(sessao.status) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setAberto(false)}
                className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimizar chat"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Barra de Identificação do Visitante & Chamado Humano */}
          <div className="bg-[#F4EDE4] px-4 py-2 text-xs flex items-center justify-between border-b border-[#E6DCD1] shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3.5 h-3.5 text-[#8A7869] shrink-0" />
              {editandoNome ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSalvarNome()}
                    className="px-2 py-0.5 bg-white border border-[#DDD3C5] rounded text-xs outline-none text-[#2C241E] w-28"
                    placeholder="Seu nome..."
                  />
                  <button
                    onClick={handleSalvarNome}
                    className="text-[11px] font-bold text-[#C85A32] hover:underline cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 truncate">
                  <span className="font-medium text-[#2C241E] truncate">{nomeCliente}</span>
                  <button
                    onClick={() => setEditandoNome(true)}
                    className="text-[10px] text-[#8A7869] hover:text-[#C85A32] underline cursor-pointer"
                  >
                    (editar)
                  </button>
                </div>
              )}
            </div>

            {sessao?.status === 'ia' && (
              <button
                onClick={handleChamarHumano}
                className="text-[11px] font-semibold text-[#C85A32] hover:text-[#A34220] flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-full border border-[#C85A32]/30 shadow-2xs hover:bg-[#FAF7F2] transition-colors"
                title="Chamar um atendente humano para esta conversa"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Chamar Humano</span>
              </button>
            )}
          </div>

          {/* Área de Mensagens com Scroll */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs sm:text-sm">
            {mensagens.map((msg) => {
              const isCliente = msg.remetente === 'cliente';
              const isAdmin = msg.remetente === 'admin';
              const isIa = msg.remetente === 'ia';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCliente ? 'items-end' : 'items-start'}`}
                >
                  {/* Identificação do Remetente */}
                  <span className="text-[10px] text-[#8A7869] mb-1 px-1 flex items-center gap-1">
                    {isCliente && <span>Você</span>}
                    {isIa && (
                      <span className="font-semibold text-purple-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        Assistente Furtacor (IA)
                      </span>
                    )}
                    {isAdmin && (
                      <span className="font-semibold text-[#C85A32] flex items-center gap-1">
                        <Heart className="w-3 h-3 fill-[#C85A32]" />
                        Dona Rosa / Equipe
                      </span>
                    )}
                    <span>·</span>
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>

                  {/* Bolha da Mensagem */}
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      isCliente
                        ? 'bg-[#2C241E] text-white rounded-br-xs shadow-xs'
                        : isAdmin
                        ? 'bg-[#EFE3D5] text-[#2C241E] border border-[#DDD3C5] rounded-bl-xs shadow-xs font-medium'
                        : 'bg-white text-[#2C241E] border border-[#E6DCD1] rounded-bl-xs shadow-xs'
                    }`}
                  >
                    {msg.mensagem}
                  </div>
                </div>
              );
            })}

            {enviando && (
              <div className="flex items-center gap-1.5 text-xs text-[#8A7869] italic">
                <span className="w-2 h-2 rounded-full bg-[#C85A32] animate-bounce" />
                <span>Pensando com carinho...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas (Chips) */}
          <div className="px-3 py-1.5 bg-[#FAF7F2] border-t border-[#E6DCD1] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => handleEnviar(undefined, 'Quanto custa o ingresso do luau?')}
              className="px-2.5 py-1 bg-white hover:bg-[#F4EDE4] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap transition-colors cursor-pointer"
            >
              🎟️ Quanto custa o ingresso?
            </button>
            <button
              onClick={() => handleEnviar(undefined, 'Como funciona a hospedagem na Cabana pelo Airbnb?')}
              className="px-2.5 py-1 bg-white hover:bg-[#F4EDE4] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap transition-colors cursor-pointer"
            >
              🏡 Cabana no Airbnb
            </button>
            <button
              onClick={() => handleEnviar(undefined, 'Onde fica a Casa Furtacor?')}
              className="px-2.5 py-1 bg-white hover:bg-[#F4EDE4] text-[#6B5A4D] rounded-full border border-[#DDD3C5] text-[11px] whitespace-nowrap transition-colors cursor-pointer"
            >
              📍 Onde fica a Casa?
            </button>
            <button
              onClick={handleChamarHumano}
              className="px-2.5 py-1 bg-[#FDF2F0] hover:bg-[#FBE4E1] text-[#C85A32] rounded-full border border-[#E08A68]/40 text-[11px] whitespace-nowrap font-medium transition-colors cursor-pointer"
            >
              👤 Falar com Dona Rosa
            </button>
          </div>

          {/* Formulário de Envio */}
          <form
            onSubmit={handleEnviar}
            className="p-3 bg-white border-t border-[#E6DCD1] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite sua mensagem acolhedora..."
              className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-xs sm:text-sm text-[#2C241E] placeholder:text-[#A8988A]"
            />
            <button
              type="submit"
              disabled={!texto.trim()}
              className="p-2.5 bg-[#2C241E] hover:bg-[#43372F] disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shrink-0"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {erro && (
            <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 text-amber-900 text-[11px]">
              {erro}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
