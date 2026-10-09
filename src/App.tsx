import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { EventVisualBanner } from './components/EventVisualBanner';
import { EventCard } from './components/EventCard';
import { FriendForm } from './components/FriendForm';
import { TicketPassModal } from './components/TicketPassModal';
import { MyTicketsModal } from './components/MyTicketsModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AboutCasaModal } from './components/AboutCasaModal';
import { ChameleonLogo } from './components/ChameleonLogo';
import { ChatWidget } from './components/ChatWidget';

// Painéis e modais carregados sob demanda: visitantes não precisam baixar a
// portaria nem o leitor de câmera da equipe para ver a agenda.
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const PixCheckoutModal = lazy(() =>
  import('./components/PixCheckoutModal').then((m) => ({ default: m.PixCheckoutModal }))
);

const Carregando = () => (
  <div className="flex items-center justify-center py-20 text-[#8A7869]">
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-[#E08A68] border-t-transparent animate-spin" />
      <span className="text-sm">Carregando…</span>
    </div>
  </div>
);
import { storage } from './services/storageService';
import { authService, isEmailAdmin } from './services/authService';
import { Evento, Ingresso, PortariaStats, AmigoInscricao } from './types';
import { PIX_CONFIG, CONTATO_CONFIG } from './utils/pix';
import {
  Heart,
  MapPin,
  ExternalLink,
  MessageCircle,
  Shield,
  Sparkles,
  Coffee,
  Music,
  CheckCircle2,
  Clock,
  Home,
  Instagram,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';

export default function App() {
  const [evento, setEvento] = useState<Evento>(() => storage.getEventoAtivo());
  const [ingressos, setIngressos] = useState<Ingresso[]>(() => storage.getIngressos());
  const [stats, setStats] = useState<PortariaStats>(() => storage.getStats());
  const [meusIngressos, setMeusIngressos] = useState<Ingresso[]>(() => storage.getMeusIngressos());

  // Estado de autenticação administrativa
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Modais de Ingressos e Checkout
  const [checkoutData, setCheckoutData] = useState<{
    ingresso: Ingresso;
    todosIngressos?: Ingresso[];
    qrCodeDataUrl: string;
    pixCopiaECola: string;
  } | null>(null);

  const [activeTicketModal, setActiveTicketModal] = useState<{
    ingresso: Ingresso;
    todosIngressos?: Ingresso[];
  } | null>(null);
  const [showMyTickets, setShowMyTickets] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do carregamento inicial e do banco de dados
  const [carregando, setCarregando] = useState(() => !storage.estaCarregado());
  const [semEventos, setSemEventos] = useState(
    () => storage.estaCarregado() && !storage.temEventoAtivo()
  );
  const [aviso, setAviso] = useState<string | null>(null);

  // Recarregar dados após alterações no storage
  const handleRefreshData = () => {
    setEvento(storage.getEventoAtivo());
    setIngressos(storage.getIngressos());
    setStats(storage.getStats());
    setMeusIngressos(storage.getMeusIngressos());
    setCarregando(!storage.estaCarregado());
    setSemEventos(storage.estaCarregado() && !storage.temEventoAtivo());
  };

  useEffect(() => {
    handleRefreshData();
    const unsubscribe = storage.subscribe(() => {
      handleRefreshData();
    });

    // Sessão administrativa via Supabase Auth
    let ativo = true;
    authService.carregarSessao().then((sessao) => {
      if (!ativo) return;
      const admin = isEmailAdmin(sessao?.user?.email);
      setIsAdminLoggedIn(admin);
      if (admin) void storage.sincronizarComBanco();
    });

    const unsubscribeAuth = authService.aoMudarSessao((sessao) => {
      const admin = isEmailAdmin(sessao?.user?.email);
      setIsAdminLoggedIn(admin);
      if (admin) void storage.sincronizarComBanco();
    });

    return () => {
      ativo = false;
      unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  // Aviso temporário para falhas de conexão/gravação
  useEffect(() => {
    if (!aviso) return;
    const timer = setTimeout(() => setAviso(null), 7000);
    return () => clearTimeout(timer);
  }, [aviso]);

  // Submissão do formulário: cada amigo tem seu cadastro nominal
  const handleFriendSubmit = async (amigos: AmigoInscricao[]) => {
    setIsSubmitting(true);
    try {
      const resultado = await storage.criarInscricoesEIngressos(amigos);
      handleRefreshData();
      if (resultado.aviso) {
        setAviso(resultado.aviso);
      }
      setCheckoutData({
        ingresso: resultado.ingressoPrincipal,
        todosIngressos: resultado.ingressos,
        qrCodeDataUrl: resultado.qrCodeDataUrl,
        pixCopiaECola: resultado.pixCopiaECola,
      });
    } catch (err) {
      console.error('Erro ao gerar ingressos:', err);
      setAviso(
        err instanceof Error
          ? err.message
          : 'Não foi possível gerar o ingresso agora. Tente novamente em instantes.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmação de pagamento no checkout
  const handleConfirmPayment = (ingressoId: string) => {
    const atualizado = storage.confirmarPagamento(ingressoId);
    handleRefreshData();
    const todosDoPedido = checkoutData?.todosIngressos;
    setCheckoutData(null);
    if (atualizado) {
      setActiveTicketModal({
        ingresso: atualizado,
        todosIngressos: todosDoPedido,
      });
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById('cadastro-amigo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB, Casa Furtacor'
  )}`;

  return (
    <div id="topo" className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C241E]">
      {/* Top Bar Navigation */}
      <Header
        onOpenAdminLogin={() => setShowAdminLogin(true)}
        onOpenMyTickets={() => setShowMyTickets(true)}
        onOpenAbout={() => setShowAbout(true)}
        hasTickets={meusIngressos.length > 0}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminDashboard={() => setShowAdminDashboard(true)}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Cabeçalho Afetivo da Casa */}
        <section className="text-center space-y-3 pt-2 sm:pt-4">
          <div className="flex items-center justify-center gap-2 text-xs uppercase font-semibold tracking-widest text-[#C85A32]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Eventos Interessantes · Ingressos Afetivos</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold text-[#2C241E] tracking-tight text-balance">
            CASA FURTACOR
          </h1>

          <p className="text-base sm:text-lg font-serif italic text-[#8A7869] max-w-xl mx-auto">
            "Aqui nossos amigos e amigas chegam primeiro."
          </p>
        </section>

        {/* Agenda: carregando / vazio / evento ativo */}
        {carregando ? (
          <section id="evento">
            <Carregando />
          </section>
        ) : semEventos ? (
          <section id="evento">
            <div className="bg-white rounded-3xl border border-[#E6DCD1] p-10 text-center space-y-3 shadow-sm">
              <Calendar className="w-10 h-10 mx-auto text-[#C85A32]" />
              <h2 className="text-2xl font-serif font-bold text-[#2C241E]">
                Nenhum evento no momento
              </h2>
              <p className="text-sm text-[#6B5A4D] max-w-md mx-auto">
                A Casa Furtacor está preparando o próximo encontro. Volte em breve ou fale com a
                gente pelo WhatsApp para saber das novidades!
              </p>
              <a
                href={CONTATO_CONFIG.whatsappLink}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#5A7156] hover:bg-[#4A5E47] text-white text-sm font-medium rounded-xl transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Falar com a Casa</span>
              </a>
            </div>
          </section>
        ) : (
          <>
            {/* Banner Visual Atmosférico do Evento */}
            <section id="evento">
              <EventVisualBanner evento={evento} />
            </section>

            {/* Grid Principal: Card Central do Evento + Cadastro do Amigo */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Card Central — Agenda & Detalhes (7 colunas em telas grandes) */}
              <div className="lg:col-span-7 space-y-6">
                <EventCard evento={evento} stats={stats} onScrollToForm={scrollToForm} />

                {/* Filosofia dos Ingressos Afetivos */}
                <div className="bg-[#F4EDE4] rounded-2xl border border-[#E6DCD1] p-6 text-xs sm:text-sm text-[#6B5A4D] space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-[#2C241E]">
                    <Heart className="w-4 h-4 text-[#C85A32] fill-[#C85A32]" />
                    <span>Por que compramos direto na Casa Furtacor?</span>
                  </div>
                  <p className="leading-relaxed">
                    Plataformas convencionais cobram até 20% de taxas de conveniência e burocracia.
                    Aqui na Casa Furtacor, tudo é feito de amigo para amigo: você garante seu ingresso via
                    PIX com valor justo e confirmação imediata.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-[#2C241E]">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5A7156]" />
                      Sem taxas extras
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5A7156]" />
                      Ingresso direto no WhatsApp
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5A7156]" />
                      Entrada rápida com QR Code
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Lateral — Cadastro do Amigo(a) & Checkout (5 colunas) */}
              <div className="lg:col-span-5 sticky top-24">
                <FriendForm
                  evento={evento}
                  vagasRestantes={Math.max(0, evento.capacidadeMaxima - stats.totalPagos)}
                  onSubmit={handleFriendSubmit}
                  isLoading={isSubmitting}
                />
              </div>
            </section>
          </>
        )}

        {/* Mural Afetivo removido conforme solicitação */}

        {/* Seção Como Chegar & Localização */}
        <section id="como-chegar" className="pt-6 border-t border-[#E6DCD1]">
          <div className="bg-white rounded-3xl border border-[#E6DCD1] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs uppercase font-semibold tracking-wider text-[#C85A32]">
                Localização & Acesso
              </span>
              <h3 className="text-2xl font-serif font-bold text-[#2C241E]">
                Como chegar na Casa Furtacor
              </h3>
              <p className="text-xs sm:text-sm text-[#6B5A4D] leading-relaxed">
                {CONTATO_CONFIG.endereco}.
                Próximo à pracinha do bairro e de fácil acesso pela UFPB.
                Ambiente residencial calmo e com vagas tranquilas para estacionar.
              </p>
            </div>

            <a
              href={CONTATO_CONFIG.mapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-5 py-3 bg-[#2C241E] hover:bg-[#43372F] text-white text-xs sm:text-sm font-medium rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
            >
              <MapPin className="w-4 h-4 text-[#E08A68]" />
              <span>Abrir no Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </section>

        {/* Rodapé / Contato Oficial Conforme PRD */}
        <footer id="contato" className="pt-10 pb-14 border-t border-[#E6DCD1] text-center space-y-6">
          <div className="max-w-md mx-auto space-y-3 flex flex-col items-center">
            <ChameleonLogo size="xl" showText={true} />
            <p className="text-xs sm:text-sm text-[#6B5A4D]">
              Dúvidas, reservas ou informações? Fale com a gente nos canais oficiais da Casa:
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Instagram Oficial */}
              <a
                href={CONTATO_CONFIG.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-95 text-white font-medium rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
                title="Seguir Casa Furtacor no Instagram"
              >
                <Instagram className="w-4 h-4" />
                <span>{CONTATO_CONFIG.instagramUser}</span>
              </a>
            </div>
            <p className="text-[11px] text-[#8A7869]">
              WhatsApp oficial: <a href={CONTATO_CONFIG.whatsappLink} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-[#2C241E]">{CONTATO_CONFIG.whatsappNumero}</a>
            </p>
          </div>

          <div className="text-[11px] text-[#8A7869] space-y-1">
            <p>Casa Furtacor · {CONTATO_CONFIG.endereco}</p>
            <p>Bilheteria Afetiva & Espaço Cultural · Desenvolvido com carinho para amigos e amigas da casa.</p>
          </div>

          {/* Acesso rápido da portaria e da mãe */}
          <div className="pt-4">
            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setShowAdminDashboard(true);
                } else {
                  setShowAdminLogin(true);
                }
              }}
              className="text-xs text-[#8A7869] hover:text-[#2C241E] inline-flex items-center gap-1.5 cursor-pointer underline underline-offset-4 decoration-[#DDD3C5]"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Área da Casa (Acesso Exclusivo da Mãe e Portaria)</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Sub-sistema 1: Chat de Atendimento Direto Híbrido (IA + Humano) */}
      <ChatWidget />

      {/* Modais do Sistema */}

      {/* 1. Modal de Checkout PIX Instantâneo */}
      {checkoutData && (
        <Suspense fallback={null}>
          <PixCheckoutModal
            ingresso={checkoutData.ingresso}
            todosIngressos={checkoutData.todosIngressos}
            evento={evento}
            qrCodeDataUrl={checkoutData.qrCodeDataUrl}
            pixCopiaECola={checkoutData.pixCopiaECola}
            onClose={() => setCheckoutData(null)}
            onConfirmPayment={handleConfirmPayment}
          />
        </Suspense>
      )}

      {/* 2. Modal do Ingresso Digital Afetivo */}
      {activeTicketModal && (
        <TicketPassModal
          ingresso={activeTicketModal.ingresso}
          todosIngressos={activeTicketModal.todosIngressos}
          evento={evento}
          onClose={() => setActiveTicketModal(null)}
        />
      )}

      {/* 3. Modal de Meus Ingressos Salvos */}
      {showMyTickets && (
        <MyTicketsModal
          ingressos={meusIngressos}
          evento={evento}
          onSelectTicket={(ing) => {
            setShowMyTickets(false);
            const todosDoMesmoPedido = meusIngressos.filter(
              (i) => i.pedidoId && i.pedidoId === ing.pedidoId
            );
            setActiveTicketModal({
              ingresso: ing,
              todosIngressos: todosDoMesmoPedido.length > 0 ? todosDoMesmoPedido : [ing],
            });
          }}
          onClose={() => setShowMyTickets(false)}
        />
      )}

      {/* 4. Modal Sobre a Casa */}
      {showAbout && <AboutCasaModal onClose={() => setShowAbout(false)} />}

      {/* 5. Modal de Login da Administradora (Mãe) */}
      {showAdminLogin && (
        <AdminLoginModal
          onLoginSuccess={() => {
            setIsAdminLoggedIn(true);
            setShowAdminLogin(false);
            setShowAdminDashboard(true);
            void storage.sincronizarComBanco();
          }}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* 6. Painel Completo do Administrador (Área da Mãe e Portaria) */}
      {showAdminDashboard && (
        <Suspense fallback={null}>
          <AdminDashboard
            evento={evento}
            stats={stats}
            ingressos={ingressos}
            onClose={() => setShowAdminDashboard(false)}
            onLogout={() => {
              void authService.sair();
              setIsAdminLoggedIn(false);
              setShowAdminDashboard(false);
            }}
            onRefreshData={handleRefreshData}
          />
        </Suspense>
      )}

      {/* Aviso flutuante de falha de conexão/gravação */}
      {aviso && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-70 max-w-md w-[calc(100%-2rem)]">
          <div className="flex items-start gap-2 px-4 py-3 bg-[#2C241E] text-white text-xs sm:text-sm rounded-xl shadow-2xl border border-[#43372F]">
            <AlertCircle className="w-4 h-4 text-[#E08A68] shrink-0 mt-0.5" />
            <span className="leading-snug">{aviso}</span>
            <button
              onClick={() => setAviso(null)}
              className="ml-auto shrink-0 text-[#D6CEBE] hover:text-white cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
