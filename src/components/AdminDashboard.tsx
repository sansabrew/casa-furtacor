import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  X,
  Users,
  Search,
  CheckCircle,
  Clock,
  PlusCircle,
  Share2,
  Printer,
  Calendar,
  DollarSign,
  UserCheck,
  RotateCcw,
  LogOut,
  QrCode,
  Sparkles,
  Phone,
  Trash2,
  Check,
  AlertCircle,
  Sliders,
  Camera,
  Maximize2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Bell,
  BellOff,
  Coffee,
  MessageSquare,
} from 'lucide-react';
import { Evento, Ingresso, PortariaStats } from '../types';
import { storage } from '../services/storageService';
import { authService } from '../services/authService';
import { formatarTelefone } from '../utils/pix';
// O leitor de câmera arrasta a biblioteca de varredura de QR Code, que é
// grande e só é usada no momento em que a portaria abre a câmera.
const CameraQrScanner = lazy(() =>
  import('./CameraQrScanner').then((m) => ({ default: m.CameraQrScanner }))
);

const CarregandoCamera = () => (
  <div className="flex items-center justify-center py-10 text-[#8A7869]">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-[#E08A68] border-t-transparent animate-spin" />
      <span className="text-sm">Abrindo a câmera…</span>
    </div>
  </div>
);
import { EventosManager } from './EventosManager';
import { ThemeToggle } from './ThemeToggle';
import { ChameleonLogo } from './ChameleonLogo';
import { AdminChatManager } from './AdminChatManager';
import { chatService } from '../services/chatService';
import { audioAlert } from '../utils/audioAlert';

interface AdminDashboardProps {
  evento: Evento;
  stats: PortariaStats;
  ingressos: Ingresso[];
  onClose: () => void;
  onLogout: () => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  evento,
  stats,
  ingressos,
  onClose,
  onLogout,
  onRefreshData,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<
    'portaria' | 'participantes' | 'evento' | 'chat'
  >('portaria');
  const [totalAguardandoChat, setTotalAguardandoChat] = useState(0);

  const [somHabilitado, setSomHabilitado] = useState(() => audioAlert.isEnabled());
  const [toastAlerta, setToastAlerta] = useState<{
    tipo: 'chat';
    titulo: string;
    mensagem: string;
  } | null>(null);

  useEffect(() => {
    const unsub = chatService.subscribeAllSessions((sessoes) => {
      const aguardando = sessoes.filter((s) => s.status === 'aguardando_humano').length;
      setTotalAguardandoChat(aguardando);
    });

    // 🛎️ Efeito sonoro sutil de Sineta de Café ao receber nova mensagem de visitante no chat
    const unsubChat = chatService.subscribeNovasMensagensVisitantes((msg) => {
      audioAlert.tocarSinetaCafe('chat');
      setToastAlerta({
        tipo: 'chat',
        titulo: '🛎️ Nova mensagem no chat!',
        mensagem: msg.mensagem,
      });
      setTimeout(() => setToastAlerta(null), 5000);
    });

    return () => {
      unsub();
      unsubChat();
    };
  }, []);

  const handleToggleSom = () => {
    const novo = !somHabilitado;
    setSomHabilitado(novo);
    audioAlert.setEnabled(novo);
    if (novo) {
      audioAlert.tocarSinetaCafe('padrao');
    }
  };

  const [busca, setBusca] = useState('');
  const [buscaPortaria, setBuscaPortaria] = useState('');
  const [filtroPortaria, setFiltroPortaria] = useState<'todos' | 'aguardando' | 'presentes'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pagos' | 'pendentes' | 'presentes'>('todos');

  // Estado para validação de código rápido
  const [codigoBusca, setCodigoBusca] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraModal, setIsCameraModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState<{
    tipo: 'sucesso' | 'erro' | 'alerta';
    texto: string;
    nome?: string;
  } | null>(null);

  // Estado para cadastro manual de amigo
  const [modalAmigoManual, setModalAmigoManual] = useState(false);
  const [novoAmigoNome, setNovoAmigoNome] = useState('');
  const [novoAmigoDoc, setNovoAmigoDoc] = useState('');
  const [novoAmigoTel, setNovoAmigoTel] = useState('');
  const [novoAmigoPago, setNovoAmigoPago] = useState(true);

  // Estado para alteração de senha de administrador
  const [modalSenhaAberta, setModalSenhaAberta] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState('');
  const [verSenhas, setVerSenhas] = useState(false);
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [sucessoSenha, setSucessoSenha] = useState<string | null>(null);

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual.trim()) {
      setErroSenha('Informe a senha atual.');
      return;
    }
    if (novaSenha.trim().length < 6) {
      setErroSenha('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmaNovaSenha) {
      setErroSenha('A nova senha e a confirmação não são iguais.');
      return;
    }

    const resultado = await authService.alterarSenha(senhaAtual, novaSenha);
    if (resultado.sucesso) {
      setSucessoSenha(resultado.mensagem);
      setErroSenha(null);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmaNovaSenha('');
      setTimeout(() => {
        setSucessoSenha(null);
        setModalSenhaAberta(false);
      }, 2000);
    } else {
      setErroSenha(resultado.mensagem);
      setSucessoSenha(null);
    }
  };

  // Função utilitária para normalizar texto para busca (ignora acentos, caixa alta/baixa)
  const normalizar = (txt: string) =>
    (txt || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Filtragem em tempo real na portaria
  const portariaFiltrados = ingressos.filter((ing) => {
    // Filtro por texto em tempo real (Nome, Documento RG/CPF ou Código)
    if (buscaPortaria.trim()) {
      const termo = normalizar(buscaPortaria);
      const termoDigitos = buscaPortaria.replace(/\D/g, '');

      const nomeMatch = normalizar(ing.clienteNome).includes(termo);
      const docMatchTexto = normalizar(ing.clienteDocumento).includes(termo);
      const docMatchDigitos = termoDigitos.length >= 2 && ing.clienteDocumento.replace(/\D/g, '').includes(termoDigitos);
      const codMatch = normalizar(ing.codigoIngresso).includes(termo);

      if (!nomeMatch && !docMatchTexto && !docMatchDigitos && !codMatch) {
        return false;
      }
    }

    // Filtro por status de entrada na portaria
    if (filtroPortaria === 'aguardando') return !ing.checkInRealizado;
    if (filtroPortaria === 'presentes') return ing.checkInRealizado;
    return true;
  });

  // Filtragem da lista geral de participantes
  const participantesFiltrados = ingressos.filter((ing) => {
    if (busca.trim()) {
      const termo = normalizar(busca);
      const termoDigitos = busca.replace(/\D/g, '');

      const nomeMatch = normalizar(ing.clienteNome).includes(termo);
      const docMatchTexto = normalizar(ing.clienteDocumento).includes(termo);
      const docMatchDigitos = termoDigitos.length >= 2 && ing.clienteDocumento.replace(/\D/g, '').includes(termoDigitos);
      const codMatch = normalizar(ing.codigoIngresso).includes(termo);

      if (!nomeMatch && !docMatchTexto && !docMatchDigitos && !codMatch) {
        return false;
      }
    }

    if (filtroStatus === 'pagos') return ing.statusPagamento === 'pago';
    if (filtroStatus === 'pendentes') return ing.statusPagamento === 'pendente';
    if (filtroStatus === 'presentes') return ing.checkInRealizado;
    return true;
  });

  // Amigo em destaque se a busca na portaria retornar exatamente 1 resultado
  const amigoDestaquePortaria =
    buscaPortaria.trim().length >= 2 && portariaFiltrados.length === 1 ? portariaFiltrados[0] : null;

  const handleToggleCheckIn = (ingressoId: string, atual: boolean) => {
    storage.realizarCheckIn(ingressoId, !atual);
    onRefreshData();
  };

  const handleTogglePagamento = (ingressoId: string, statusAtual: string) => {
    storage.definirStatusPagamento(ingressoId, statusAtual === 'pago' ? 'pendente' : 'pago');
    onRefreshData();
  };

  const handleExcluirIngresso = (id: string, nome: string) => {
    if (window.confirm(`Deseja remover ${nome} da lista?`)) {
      storage.excluirIngresso(id);
      onRefreshData();
    }
  };

  // Validador rápido da portaria por código ou documento
  const handleValidarCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBusca.trim()) return;

    const termo = codigoBusca.trim().toLowerCase();
    const encontrado = ingressos.find(
      (i) =>
        i.codigoIngresso.toLowerCase() === termo ||
        i.clienteDocumento.replace(/\D/g, '') === termo.replace(/\D/g, '') ||
        i.clienteNome.toLowerCase() === termo
    );

    if (!encontrado) {
      setMensagemValidacao({
        tipo: 'erro',
        texto: `Ingresso não encontrado para "${codigoBusca}". Verifique o nome ou documento na lista abaixo.`,
      });
      return;
    }

    if (encontrado.checkInRealizado) {
      setMensagemValidacao({
        tipo: 'alerta',
        texto: `Atenção: Check-in já havia sido realizado às ${
          encontrado.checkInHora ? new Date(encontrado.checkInHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'anteriormente'
        }.`,
        nome: encontrado.clienteNome,
      });
    } else {
      storage.realizarCheckIn(encontrado.id, true);
      onRefreshData();
      setMensagemValidacao({
        tipo: 'sucesso',
        texto: `Entrada autorizada! Seja muito bem-vindo(a), ${encontrado.clienteNome}!`,
        nome: encontrado.clienteNome,
      });
    }

    setCodigoBusca('');
  };

  // Adicionar Amigo Manual
  const handleCriarAmigoManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAmigoNome.trim() || !novoAmigoDoc.trim()) return;

    storage.adicionarAmigoManual({
      nome: novoAmigoNome,
      documento: novoAmigoDoc,
      whatsapp: novoAmigoTel,
      pago: novoAmigoPago,
    });

    setNovoAmigoNome('');
    setNovoAmigoDoc('');
    setNovoAmigoTel('');
    setModalAmigoManual(false);
    onRefreshData();
  };

  // Compartilhar Lista no WhatsApp da Mãe
  const handleExportarWhatsApp = () => {
    const pagos = ingressos.filter((i) => i.statusPagamento === 'pago');
    const presentes = ingressos.filter((i) => i.checkInRealizado);
    let texto = `*🏡 CASA FURTACOR — LISTA DE AMIGOS*%0A*Evento:* ${evento.titulo}%0A*Data:* ${evento.dataEvento} (${evento.horario})%0A%0A*Confirmados:* ${pagos.length}/${evento.capacidadeMaxima}%0A*Presentes na Casa:* ${presentes.length}%0A*Arrecadação:* R$ ${stats.arrecadacaoTotal.toFixed(2)}%0A%0A*📋 NOMES CONFIRMADOS:*%0A`;

    ingressos.forEach((ing, index) => {
      const statusIcon = ing.checkInRealizado ? '✅ Entrou' : ing.statusPagamento === 'pago' ? '💳 Pago' : '⏳ Pendente';
      texto += `${index + 1}. *${ing.clienteNome}* (${ing.clienteDocumento}) — ${statusIcon}%0A`;
    });

    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  // Imprimir Lista de Presença
  const handleImprimirPresenca = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      {/* Toast Notificação Sonora e Visual de Chat */}
      {toastAlerta && (
        <div
          onClick={() => {
            if (toastAlerta.tipo === 'chat') setAbaAtiva('chat');

            setToastAlerta(null);
          }}
          className="fixed top-6 right-6 z-70 bg-[#2C241E] text-white p-4 rounded-2xl border-2 border-[#E08A68] shadow-2xl max-w-sm cursor-pointer animate-in slide-in-from-top-4 duration-300 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-[#E08A68]/20 text-[#E08A68] shrink-0 mt-0.5">
                {toastAlerta.tipo === 'chat' ? (
                  <MessageSquare className="w-5 h-5 text-amber-300 animate-bounce" />
                ) : (
                  <Coffee className="w-5 h-5 text-amber-300 animate-bounce" />
                )}
              </div>
              <div>
                <h5 className="font-serif font-bold text-xs sm:text-sm text-white">
                  {toastAlerta.titulo}
                </h5>
                <p className="text-xs text-[#E6DCD1] mt-0.5 line-clamp-2 leading-relaxed">
                  {toastAlerta.mensagem}
                </p>
                <span className="text-[10px] text-[#E08A68] mt-1.5 block font-semibold underline">
                  Clique para abrir na aba correspondente →
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setToastAlerta(null);
              }}
              className="text-[#A8988A] hover:text-white p-1 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-5xl bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Barra Superior do Painel */}
        <div className="no-print bg-[#2C241E] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <ChameleonLogo size="md" animated={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#E08A68]">
                  Painel da Dona Rosa
                </span>
                <span className="text-xs bg-[#5A7156] text-white px-2 py-0.5 rounded-full font-medium">
                  Portaria Ativa
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-0.5">
                Casa Furtacor — Área da Casa
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCameraModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C85A32] hover:bg-[#A34220] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              title="Abrir câmera para escanear QR Code do ingresso"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Câmera QR</span>
            </button>

            <button
              onClick={handleExportarWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Exportar resumo para o WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleImprimirPresenca}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Imprimir folha de presença da portaria"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={() => {
                setErroSenha(null);
                setSucessoSenha(null);
                setModalSenhaAberta(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Alterar senha de acesso do administrador"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#E08A68]" />
              <span className="hidden sm:inline">Mudar Senha</span>
            </button>

            {/* Controle de Efeitos Sonoros (Sineta / Café) */}
            <button
              type="button"
              onClick={handleToggleSom}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                somHabilitado
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                  : 'bg-white/10 text-[#A8988A] border-white/10 hover:bg-white/20'
              }`}
              title={
                somHabilitado
                  ? 'Sineta de café ativada (Clique para silenciar)'
                  : 'Alertas sonoros silenciados (Clique para ativar sineta de café)'
              }
            >
              {somHabilitado ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Sineta de Café</span>
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Silencioso</span>
                </>
              )}
            </button>

            {/* Alternador de Tema da Portaria */}
            <ThemeToggle size="sm" showLabel={true} />

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              title="Sair do painel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Métricas e Cards de Resumo */}
        <div className="no-print bg-[#F4EDE4] border-b border-[#E6DCD1] p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-[#E6DCD1]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A7869] block">
              Confirmados
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#2C241E] tabular-nums">
                {stats.totalPagos}
              </span>
              <span className="text-xs text-[#8A7869]">/ {evento.capacidadeMaxima}</span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-[#E6DCD1]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5A7156] block">
              Presentes na Casa
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#5A7156] tabular-nums">
                {stats.totalPresentes}
              </span>
              <span className="text-xs text-[#8A7869]">amigos</span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-[#E6DCD1]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C85A32] block">
              Total Arrecadado
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#C85A32] tabular-nums">
                R$ {stats.arrecadacaoTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-[#E6DCD1]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A7869] block">
              Vagas Restantes
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-serif font-bold text-[#2C241E] tabular-nums">
                {Math.max(0, evento.capacidadeMaxima - stats.totalPagos)}
              </span>
              <span className="text-xs text-[#8A7869]">livres</span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="no-print bg-[#FAF7F2] border-b border-[#E6DCD1] px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAbaAtiva('portaria')}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                abaAtiva === 'portaria'
                  ? 'border-[#C85A32] text-[#C85A32]'
                  : 'border-transparent text-[#6B5A4D] hover:text-[#2C241E]'
              }`}
            >
              🚪 Portaria & Check-in Rápido
            </button>

            <button
              onClick={() => setAbaAtiva('participantes')}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                abaAtiva === 'participantes'
                  ? 'border-[#C85A32] text-[#C85A32]'
                  : 'border-transparent text-[#6B5A4D] hover:text-[#2C241E]'
              }`}
            >
              👥 Lista de Amigos ({ingressos.length})
            </button>

            <button
              onClick={() => setAbaAtiva('evento')}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                abaAtiva === 'evento'
                  ? 'border-[#C85A32] text-[#C85A32]'
                  : 'border-transparent text-[#6B5A4D] hover:text-[#2C241E]'
              }`}
            >
              📅 Gestão de Eventos
            </button>

            <button
              onClick={() => setAbaAtiva('chat')}
              className={`py-3.5 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap relative ${
                abaAtiva === 'chat'
                  ? 'border-[#C85A32] text-[#C85A32]'
                  : 'border-transparent text-[#6B5A4D] hover:text-[#2C241E]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                💬 Atendimento & Chat
                {totalAguardandoChat > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                    {totalAguardandoChat}
                  </span>
                )}
              </span>
            </button>


          </div>

          <button
            onClick={() => setModalAmigoManual(true)}
            className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-[#2C241E] hover:bg-[#43372F] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#E08A68]" />
            <span>Adicionar Amigo</span>
          </button>
        </div>

        {/* Conteúdo das Abas (Scrollável) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ================= ABA 1: PORTARIA RÁPIDA ================= */}
          {abaAtiva === 'portaria' && (
            <div className="space-y-5">
              {/* Leitor de Câmera da Portaria (Inline ou Card de Ativação Rápida) */}
              {isCameraActive ? (
                <div className="animate-fade-in">
                  <Suspense fallback={<CarregandoCamera />}>
                    <CameraQrScanner
                      ingressos={ingressos}
                      isModal={false}
                      onClose={() => setIsCameraActive(false)}
                      onToggleFullscreen={() => setIsCameraModal(true)}
                      onSuccessCheckIn={(ing) => {
                        onRefreshData();
                        setMensagemValidacao({
                          tipo: 'sucesso',
                          texto: `Entrada autorizada! Seja bem-vindo(a), ${ing.clienteNome}!`,
                          nome: ing.clienteNome,
                        });
                      }}
                    />
                  </Suspense>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-[#2C241E] via-[#382C24] to-[#2C241E] text-white p-4 sm:p-5 rounded-2xl border border-[#4A3B30] shadow-md flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C85A32] flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm sm:text-base text-white">
                        Leitor de QR Code com Câmera
                      </h4>
                      <p className="text-xs text-[#D6CEBE]">
                        Aponte a câmera do celular para o ingresso do amigo e registre a entrada na hora
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(true)}
                      className="px-4 py-2.5 bg-[#C85A32] hover:bg-[#A34220] text-white font-bold text-xs sm:text-sm rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ativar Câmera na Portaria</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCameraModal(true)}
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Abrir câmera em tela cheia"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tela Cheia</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Card de Busca em Tempo Real na Portaria */}
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#DDD3C5] shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#C85A32]">
                    <Search className="w-4 h-4" />
                    <span>Busca em Tempo Real na Portaria</span>
                  </div>

                  <span className="text-xs font-mono font-medium text-[#6B5A4D] bg-[#F4EDE4] px-2.5 py-1 rounded-full">
                    {portariaFiltrados.length} {portariaFiltrados.length === 1 ? 'amigo encontrado' : 'amigos encontrados'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A7869]" />
                    <input
                      type="text"
                      autoFocus
                      value={buscaPortaria}
                      onChange={(e) => setBuscaPortaria(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && amigoDestaquePortaria && !amigoDestaquePortaria.checkInRealizado) {
                          e.preventDefault();
                          handleToggleCheckIn(amigoDestaquePortaria.id, false);
                          setMensagemValidacao({
                            tipo: 'sucesso',
                            texto: `Entrada confirmada! Bem-vindo(a), ${amigoDestaquePortaria.clienteNome}!`,
                            nome: amigoDestaquePortaria.clienteNome,
                          });
                          setBuscaPortaria('');
                        }
                      }}
                      placeholder="Digite o Nome, RG, CPF ou Código do Ingresso (ex: Marina, 084... ou 8841)..."
                      className="w-full pl-11 pr-10 py-3.5 bg-[#FAF7F2] border-2 border-[#DDD3C5] focus:border-[#C85A32] focus:bg-white rounded-xl text-sm sm:text-base font-medium outline-none transition-all placeholder:text-[#A8988A]"
                    />
                    {buscaPortaria && (
                      <button
                        type="button"
                        onClick={() => setBuscaPortaria('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8A7869] hover:text-[#2C241E] rounded-full hover:bg-black/5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCameraModal(true)}
                    className="px-5 py-3.5 bg-[#C85A32] hover:bg-[#A34220] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    title="Escanear QR Code com a câmera do celular"
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <span>Ler com Câmera (QR)</span>
                  </button>
                </div>

                {/* Filtros rápidos da fila de portaria */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 bg-[#F4EDE4] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFiltroPortaria('todos')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        filtroPortaria === 'todos'
                          ? 'bg-white text-[#2C241E] shadow-sm font-semibold'
                          : 'text-[#6B5A4D] hover:text-[#2C241E]'
                      }`}
                    >
                      Todos ({ingressos.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroPortaria('aguardando')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        filtroPortaria === 'aguardando'
                          ? 'bg-amber-100 text-amber-900 shadow-sm font-semibold'
                          : 'text-[#6B5A4D] hover:text-[#2C241E]'
                      }`}
                    >
                      ⏳ Aguardando Entrada ({ingressos.filter((i) => !i.checkInRealizado).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroPortaria('presentes')}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                        filtroPortaria === 'presentes'
                          ? 'bg-emerald-100 text-emerald-900 shadow-sm font-semibold'
                          : 'text-[#6B5A4D] hover:text-[#2C241E]'
                      }`}
                    >
                      ✅ Já Entraram ({stats.totalPresentes})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <ThemeToggle size="sm" showLabel={true} />
                    {buscaPortaria && (
                      <button
                        onClick={() => setBuscaPortaria('')}
                        className="text-xs text-[#C85A32] hover:underline cursor-pointer"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback de Validação / Notificação */}
                {mensagemValidacao && (
                  <div
                    className={`p-3.5 rounded-xl text-sm border flex items-start gap-3 animate-fade-in ${
                      mensagemValidacao.tipo === 'sucesso'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : mensagemValidacao.tipo === 'alerta'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    {mensagemValidacao.tipo === 'sucesso' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{mensagemValidacao.texto}</p>
                      {mensagemValidacao.nome && (
                        <p className="text-xs mt-0.5 opacity-90">Amigo(a): {mensagemValidacao.nome}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setMensagemValidacao(null)}
                      className="text-black/40 hover:text-black/70 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Card de Ação Rápida para Resultado Único Exato */}
                {amigoDestaquePortaria && !amigoDestaquePortaria.checkInRealizado && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-md">
                        Resultado Único Identificado
                      </span>
                      <h4 className="text-lg font-serif font-bold text-emerald-950 mt-1">
                        {amigoDestaquePortaria.clienteNome}
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Doc: {amigoDestaquePortaria.clienteDocumento} · Cód: {amigoDestaquePortaria.codigoIngresso} ·{' '}
                        {amigoDestaquePortaria.statusPagamento === 'pago' ? 'Pago no PIX' : 'Pagamento Pendente'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleToggleCheckIn(amigoDestaquePortaria.id, false);
                        setMensagemValidacao({
                          tipo: 'sucesso',
                          texto: `Entrada autorizada! Seja bem-vindo(a), ${amigoDestaquePortaria.clienteNome}!`,
                          nome: amigoDestaquePortaria.clienteNome,
                        });
                        setBuscaPortaria('');
                      }}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-5 h-5" />
                      <span>Confirmar Entrada Agora (Enter ↵)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Lista Filtrada em Tempo Real para Check-in com 1 Toque */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif font-bold text-base text-[#2C241E]">
                    Lista de Entrada na Portaria
                    {buscaPortaria && (
                      <span className="text-xs font-sans font-normal text-[#8A7869] ml-2">
                        (filtrando por "{buscaPortaria}")
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-[#8A7869]">
                    Toque no botão para registrar a entrada
                  </span>
                </div>

                {portariaFiltrados.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-[#DDD3C5] text-center space-y-3">
                    <p className="text-sm font-medium text-[#2C241E]">
                      Nenhum amigo encontrado para "{buscaPortaria}".
                    </p>
                    <p className="text-xs text-[#8A7869]">
                      Verifique se digitou o nome completo ou apenas os números do RG/CPF.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalAmigoManual(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2C241E] text-white text-xs font-medium rounded-xl hover:bg-[#43372F] transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#E08A68]" />
                      <span>Adicionar este amigo manualmente</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {portariaFiltrados.map((ing) => (
                      <div
                        key={ing.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                          ing.checkInRealizado
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-white border-[#E6DCD1] hover:border-[#C85A32] shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                              ing.checkInRealizado
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#F4EDE4] text-[#8A7869]'
                            }`}
                          >
                            {ing.checkInRealizado ? <Check className="w-5 h-5" /> : ing.clienteNome.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm sm:text-base text-[#2C241E]">
                                {ing.clienteNome}
                              </span>
                              <span className="font-mono text-xs font-bold text-[#C85A32] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E6DCD1]">
                                {ing.codigoIngresso}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                  ing.statusPagamento === 'pago'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ing.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B5A4D] mt-1">
                              <span>
                                <strong>Documento:</strong> {ing.clienteDocumento}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{formatarTelefone(ing.clienteWhatsapp)}</span>
                              {ing.checkInHora && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded">
                                    Entrou às {new Date(ing.checkInHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleCheckIn(ing.id, ing.checkInRealizado)}
                            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                              ing.checkInRealizado
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-[#2C241E] hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>{ing.checkInRealizado ? '✓ Presente (Desfazer)' : 'Confirmar Entrada'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= ABA 2: LISTA DE PARTICIPANTES ================= */}
          {abaAtiva === 'participantes' && (
            <div className="space-y-4">
              {/* Barra de Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7869]" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar amigo por nome, RG, CPF ou código..."
                    className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-xs sm:text-sm outline-none"
                  />
                  {busca && (
                    <button
                      type="button"
                      onClick={() => setBusca('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8A7869] hover:text-[#2C241E] rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-[#F4EDE4] p-1 rounded-xl">
                  {(['todos', 'pagos', 'pendentes', 'presentes'] as const).map((filtro) => (
                    <button
                      key={filtro}
                      onClick={() => setFiltroStatus(filtro)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                        filtroStatus === filtro
                          ? 'bg-white text-[#2C241E] shadow-sm'
                          : 'text-[#6B5A4D] hover:text-[#2C241E]'
                      }`}
                    >
                      {filtro}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela de Amigos Confirmados */}
              <div className="bg-white rounded-2xl border border-[#DDD3C5] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#FAF7F2] border-b border-[#E6DCD1] text-[#8A7869] uppercase font-semibold text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Amigo(a)</th>
                        <th className="py-3 px-3">Documento</th>
                        <th className="py-3 px-3">WhatsApp</th>
                        <th className="py-3 px-3">Código</th>
                        <th className="py-3 px-3">Status Pagamento</th>
                        <th className="py-3 px-3">Portaria</th>
                        <th className="py-3 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DCD1]">
                      {participantesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#8A7869] text-xs">
                            Nenhum participante encontrado para este filtro.
                          </td>
                        </tr>
                      ) : (
                        participantesFiltrados.map((ing) => (
                          <tr key={ing.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-semibold text-[#2C241E]">{ing.clienteNome}</p>
                              <span className="text-[10px] text-[#8A7869]">
                                {new Date(ing.createdAt).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(ing.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-xs text-[#6B5A4D]">
                              {ing.clienteDocumento}
                            </td>
                            <td className="py-3 px-3">
                              <a
                                href={`https://wa.me/55${ing.clienteWhatsapp}`}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-[#25D366] hover:underline flex items-center gap-1 font-medium text-xs"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{formatarTelefone(ing.clienteWhatsapp)}</span>
                              </a>
                            </td>
                            <td className="py-3 px-3 font-mono text-xs font-bold text-[#C85A32]">
                              {ing.codigoIngresso}
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleTogglePagamento(ing.id, ing.statusPagamento)}
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider cursor-pointer ${
                                  ing.statusPagamento === 'pago'
                                    ? 'bg-[#5A7156]/15 text-[#5A7156] hover:bg-[#5A7156]/25'
                                    : 'bg-[#D97706]/15 text-[#D97706] hover:bg-[#D97706]/25'
                                }`}
                                title="Clique para alternar status de pagamento"
                              >
                                {ing.statusPagamento === 'pago' ? '✓ Pago' : '⏳ Pendente'}
                              </button>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleToggleCheckIn(ing.id, ing.checkInRealizado)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                                  ing.checkInRealizado
                                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                                    : 'bg-[#EFE7DC] text-[#6B5A4D] hover:bg-[#E6DCD1]'
                                }`}
                              >
                                {ing.checkInRealizado ? 'Entrou' : 'Aguardando'}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleExcluirIngresso(ing.id, ing.clienteNome)}
                                className="p-1.5 text-[#8A7869] hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                title="Remover participante"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 3: GESTÃO & CADASTRO DE EVENTOS ================= */}
          {abaAtiva === 'evento' && (
            <div className="space-y-6">
              <EventosManager onRefreshData={onRefreshData} />

              {/* Botão de Reset para Demonstração */}
              <div className="pt-4 border-t border-[#E6DCD1] text-center">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Restaurar os dados originais da demonstração?')) {
                      storage.resetarDados();
                      onRefreshData();
                    }
                  }}
                  className="text-xs text-[#8A7869] hover:text-[#C85A32] flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar dados originais da Casa Furtacor</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= ABA 4: ATENDIMENTO & CHAT (HÍBRIDO IA / HUMANO) ================= */}
          {abaAtiva === 'chat' && (
            <div className="space-y-4">
              <AdminChatManager />
            </div>
          )}


        </div>

        {/* Modal de Adicionar Amigo Manualmente */}
        {modalAmigoManual && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-[#E6DCD1] max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center pb-3 border-b border-[#E6DCD1]">
                <h4 className="font-serif font-bold text-lg text-[#2C241E]">
                  Adicionar Amigo na Lista
                </h4>
                <button
                  onClick={() => setModalAmigoManual(false)}
                  className="p-1 text-[#8A7869] hover:text-[#2C241E]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCriarAmigoManual} className="mt-4 space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={novoAmigoNome}
                    onChange={(e) => setNovoAmigoNome(e.target.value)}
                    placeholder="Nome do amigo"
                    className="w-full p-2.5 bg-white border border-[#DDD3C5] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    RG ou CPF
                  </label>
                  <input
                    type="text"
                    required
                    value={novoAmigoDoc}
                    onChange={(e) => setNovoAmigoDoc(e.target.value)}
                    placeholder="000.000.000-00 ou RG"
                    className="w-full p-2.5 bg-white border border-[#DDD3C5] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    value={novoAmigoTel}
                    onChange={(e) => setNovoAmigoTel(e.target.value)}
                    placeholder="(83) 99999-9999"
                    className="w-full p-2.5 bg-white border border-[#DDD3C5] rounded-xl outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pagoCheck"
                    checked={novoAmigoPago}
                    onChange={(e) => setNovoAmigoPago(e.target.checked)}
                    className="w-4 h-4 text-[#5A7156] rounded"
                  />
                  <label htmlFor="pagoCheck" className="text-xs text-[#2C241E] font-medium cursor-pointer">
                    Já realizou o pagamento (PIX ou Dinheiro)
                  </label>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAmigoManual(false)}
                    className="flex-1 py-2.5 bg-[#EFE7DC] hover:bg-[#E6DCD1] text-[#6B5A4D] font-medium rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#5A7156] hover:bg-[#4A5E47] text-white font-medium rounded-xl"
                  >
                    Salvar na Lista
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Versão de Impressão Exclusiva para Folha de Presença A4 */}
        <div className="hidden print-only p-8 text-black bg-white">
          <div className="border-b-2 border-black pb-4 mb-6 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wider">CASA FURTACOR</h1>
            <p className="text-sm">Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB</p>
            <h2 className="text-lg font-semibold mt-2">
              LISTA OFICIAL DE PRESENÇA — {evento.titulo.toUpperCase()}
            </h2>
            <p className="text-xs">
              Data: {evento.dataEvento} | Horário: {evento.horario} | Total Confirmados: {stats.totalPagos}
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-2 px-1 w-8">#</th>
                <th className="py-2 px-2">Nome do Amigo(a)</th>
                <th className="py-2 px-2">Documento</th>
                <th className="py-2 px-2">Código</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-4 w-48">Assinatura / Visto Portaria</th>
              </tr>
            </thead>
            <tbody>
              {ingressos.map((ing, i) => (
                <tr key={ing.id} className="border-b border-gray-300">
                  <td className="py-2 px-1">{i + 1}</td>
                  <td className="py-2 px-2 font-semibold">{ing.clienteNome}</td>
                  <td className="py-2 px-2">{ing.clienteDocumento}</td>
                  <td className="py-2 px-2">{ing.codigoIngresso}</td>
                  <td className="py-2 px-2">
                    {ing.checkInRealizado ? '[X] ENTROU' : ing.statusPagamento === 'pago' ? '[ ] PAGO' : '[ ] PENDENTE'}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-300">________________________</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de Leitor de QR Code por Câmera */}
        {isCameraModal && (
          <Suspense fallback={null}>
            <CameraQrScanner
              ingressos={ingressos}
              isModal={true}
              onClose={() => setIsCameraModal(false)}
              onToggleFullscreen={() => {
                setIsCameraModal(false);
                setIsCameraActive(true);
              }}
              onSuccessCheckIn={(ing) => {
                onRefreshData();
                setMensagemValidacao({
                  tipo: 'sucesso',
                  texto: `Entrada autorizada! Seja bem-vindo(a), ${ing.clienteNome}!`,
                  nome: ing.clienteNome,
                });
              }}
            />
          </Suspense>
        )}

        {/* Modal de Alteração de Senha do Administrador */}
        {modalSenhaAberta && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-6">
              {/* Topo do Modal */}
              <div className="bg-[#2C241E] text-white p-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#E08A68] font-semibold">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Segurança da Casa</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-white mt-1">
                    Alterar Senha do Administrador
                  </h3>
                  <p className="text-xs text-[#D6CEBE] mt-0.5">
                    Defina uma nova senha para a área de gestão
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalSenhaAberta(false)}
                  className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informação sobre Senha Padrão */}
              <div className="p-5 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold block text-amber-950">Nota de Acesso:</span>
                  Escolha uma nova senha que seja fácil de lembrar. A senha de fábrica não deve continuar em uso — quem consegue abrir este painel já consegue trocar a senha.
                </div>

                {erroSenha && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{erroSenha}</span>
                  </div>
                )}

                {sucessoSenha && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{sucessoSenha}</span>
                  </div>
                )}

                <form onSubmit={handleAlterarSenha} className="space-y-3.5">
                  {/* Campo Senha Atual */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                      Senha Atual <span className="text-[#C85A32]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={verSenhas ? 'text' : 'password'}
                        required
                        value={senhaAtual}
                        onChange={(e) => setSenhaAtual(e.target.value)}
                        placeholder="Digite a senha atual"
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-xs sm:text-sm text-[#2C241E] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setVerSenhas(!verSenhas)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A7869] hover:text-[#2C241E] cursor-pointer"
                        title={verSenhas ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {verSenhas ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Campo Nova Senha */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                      Nova Senha <span className="text-[#C85A32]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={verSenhas ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-xs sm:text-sm text-[#2C241E] outline-none"
                      />
                    </div>
                  </div>

                  {/* Campo Confirmar Nova Senha */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                      Confirmar Nova Senha <span className="text-[#C85A32]">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={verSenhas ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={confirmaNovaSenha}
                        onChange={(e) => setConfirmaNovaSenha(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-xs sm:text-sm text-[#2C241E] outline-none"
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-3 border-t border-[#E6DCD1] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setModalSenhaAberta(false)}
                      className="px-4 py-2 text-xs font-medium text-[#8A7869] hover:text-[#2C241E] cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#C85A32] hover:bg-[#A34220] text-white text-xs sm:text-sm font-bold rounded-xl shadow transition-colors cursor-pointer"
                    >
                      Salvar Nova Senha
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
