import type { RealtimeChannel } from '@supabase/supabase-js';
import { Admin, Evento, Cliente, Ingresso, PortariaStats } from '../types';
import { INITIAL_ADMIN, INITIAL_EVENTO, INITIAL_CLIENTES, INITIAL_INGRESSOS } from '../data/initialData';
import { gerarPayloadPix, gerarQrCodeDataUrl } from '../utils/pix';
import { supabase, supabaseConfigurado } from './supabase';
import { authService } from './authService';
import { eventosService } from './eventosService';
import { clientesService } from './clientesService';
import { ingressosService } from './ingressosService';

const STORAGE_KEYS = {
  ADMIN: 'casa_furtacor_admin',
  EVENTO: 'casa_furtacor_evento',
  EVENTOS_LISTA: 'casa_furtacor_eventos_lista',
  CLIENTES: 'casa_furtacor_clientes',
  INGRESSOS: 'casa_furtacor_ingressos',
  USER_TICKETS: 'casa_furtacor_my_tickets',
};

/** Gera um UUID v4, com fallback para navegadores antigos. */
function gerarUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function gerarCodigoIngresso(): string {
  const ano = new Date().getFullYear();
  const sufixo = Math.floor(1000 + Math.random() * 9000);
  return `FURTA-${ano}-${sufixo}`;
}

function lerListaLocal<T>(chave: string): T[] {
  const raw = localStorage.getItem(chave);
  if (!raw) return [];
  try {
    const dado: unknown = JSON.parse(raw);
    return Array.isArray(dado) ? (dado as T[]) : [];
  } catch {
    localStorage.removeItem(chave);
    return [];
  }
}

/**
 * Camada única de acesso a dados da Casa Furtacor.
 *
 * A estratégia é "banco primeiro, dispositivo como reserva":
 *   1. Os componentes leem sempre deste serviço de forma síncrona (cache em memória).
 *   2. No boot, o cache é hidratado do `localStorage` (instantâneo) e, em seguida,
 *      sincronizado com o Supabase.
 *   3. Escritas atualizam o cache na hora (otimista) e persistem no banco em
 *      segundo plano. Se o banco falhar, alertamos e mantemos o dado local como
 *      fallback para o site não travar sem internet.
 */
class StorageService {
  private listeners: Set<() => void> = new Set();

  private eventos: Evento[] = [];
  private ingressos: Ingresso[] = [];
  private clientes: Cliente[] = [];
  private eventoAtivo: Evento | null = null;

  private carregado = false;
  private sincronizando = false;
  private canal: RealtimeChannel | null = null;

  /** Última mensagem de erro amigável, consumível pelos componentes. */
  public ultimoErro: string | null = null;

  constructor() {
    this.initLocal();
    this.hidratarDoLocal();

    if (supabaseConfigurado) {
      void this.sincronizarComBanco();
      this.iniciarRealtime();
    } else {
      this.carregado = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Assinatura / notificação
  // ---------------------------------------------------------------------------

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn('Erro no listener do storage:', err);
      }
    });
  }

  public estaCarregado(): boolean {
    return this.carregado;
  }

  public temEventoAtivo(): boolean {
    return Boolean(this.eventoAtivo);
  }

  // ---------------------------------------------------------------------------
  // Inicialização e sincronização
  // ---------------------------------------------------------------------------

  private initLocal() {
    if (!localStorage.getItem(STORAGE_KEYS.EVENTO)) {
      localStorage.setItem(STORAGE_KEYS.EVENTO, JSON.stringify(INITIAL_EVENTO));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVENTOS_LISTA)) {
      localStorage.setItem(STORAGE_KEYS.EVENTOS_LISTA, JSON.stringify([INITIAL_EVENTO]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN)) {
      localStorage.setItem(STORAGE_KEYS.ADMIN, JSON.stringify(INITIAL_ADMIN));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(INITIAL_CLIENTES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INGRESSOS)) {
      localStorage.setItem(STORAGE_KEYS.INGRESSOS, JSON.stringify(INITIAL_INGRESSOS));
    }
  }

  private hidratarDoLocal() {
    this.eventos = lerListaLocal<Evento>(STORAGE_KEYS.EVENTOS_LISTA);
    this.ingressos = lerListaLocal<Ingresso>(STORAGE_KEYS.INGRESSOS);
    this.clientes = lerListaLocal<Cliente>(STORAGE_KEYS.CLIENTES);
    this.eventoAtivo =
      this.eventos.find((e) => e.ativo) ?? this.eventos[0] ?? INITIAL_EVENTO;
  }

  private persistirLocal() {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTOS_LISTA, JSON.stringify(this.eventos));
      localStorage.setItem(STORAGE_KEYS.INGRESSOS, JSON.stringify(this.ingressos));
      localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(this.clientes));
      if (this.eventoAtivo) {
        localStorage.setItem(STORAGE_KEYS.EVENTO, JSON.stringify(this.eventoAtivo));
      }
    } catch (e) {
      console.warn('Não foi possível salvar dados localmente:', e);
    }
  }

  /** Recarrega os dados do Supabase (chamado no boot e após o login do admin). */
  public async sincronizarComBanco(): Promise<void> {
    if (!supabaseConfigurado) {
      this.carregado = true;
      this.notify();
      return;
    }
    if (this.sincronizando) return;
    this.sincronizando = true;

    try {
      const ehAdmin = authService.usuarioEhAdmin();
      const eventos = ehAdmin
        ? await eventosService.listarTodos()
        : await eventosService.listarAtivos();

      this.eventos = eventos;
      this.eventoAtivo = eventos.find((e) => e.ativo) ?? eventos[0] ?? null;

      if (ehAdmin) {
        this.ingressos = await ingressosService.listarTodos();
      }

      this.ultimoErro = null;
    } catch (err) {
      console.warn('[Supabase] Falha ao carregar do banco. Usando cache local:', err);
      this.ultimoErro =
        'Não conseguimos conectar ao banco de dados agora. Exibindo os dados salvos neste dispositivo.';
    } finally {
      this.carregado = true;
      this.sincronizando = false;
      this.persistirLocal();
      this.notify();
    }
  }

  private iniciarRealtime() {
    try {
      this.canal = supabase
        .channel('casa-furtacor-dados')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => {
          void this.sincronizarComBanco();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ingressos' }, () => {
          if (authService.usuarioEhAdmin()) {
            void this.sincronizarComBanco();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Não foi possível iniciar o tempo real do Supabase:', e);
    }
  }

  /**
   * Executa uma operação de escrita no banco sem interromper a UI. Em caso de
   * falha guarda uma mensagem amigável em `ultimoErro`.
   */
  private async salvarNoBanco(descricao: string, operacao: () => Promise<void>): Promise<boolean> {
    if (!supabaseConfigurado) return false;
    try {
      await operacao();
      return true;
    } catch (err) {
      console.warn(`[Supabase] Falha ao salvar ${descricao}:`, err);
      this.ultimoErro = `Não foi possível salvar "${descricao}" no banco. A alteração ficou salva apenas neste dispositivo.`;
      this.notify();
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Leitura
  // ---------------------------------------------------------------------------

  public getEventoAtivo(): Evento {
    return this.eventoAtivo ?? INITIAL_EVENTO;
  }

  public getEventos(): Evento[] {
    return this.eventos.length > 0 ? this.eventos : [this.getEventoAtivo()];
  }

  public getClientes(): Cliente[] {
    return this.clientes;
  }

  public getIngressos(): Ingresso[] {
    return this.ingressos;
  }

  private lerCodigosLocais(): string[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_TICKETS);
    if (!raw) return [];
    try {
      const codes: unknown = JSON.parse(raw);
      return Array.isArray(codes) ? codes.filter((c): c is string => typeof c === 'string') : [];
    } catch {
      localStorage.removeItem(STORAGE_KEYS.USER_TICKETS);
      return [];
    }
  }

  public getMeusIngressos(): Ingresso[] {
    const codes = this.lerCodigosLocais();
    return this.ingressos.filter((i) => codes.includes(i.codigoIngresso));
  }

  public salvarNoDispositivo(codigoIngresso: string) {
    const codes = this.lerCodigosLocais();
    if (!codes.includes(codigoIngresso)) {
      codes.push(codigoIngresso);
      localStorage.setItem(STORAGE_KEYS.USER_TICKETS, JSON.stringify(codes));
    }
  }

  // ---------------------------------------------------------------------------
  // Escrita: eventos
  // ---------------------------------------------------------------------------

  public criarNovoEvento(dados: Omit<Evento, 'id' | 'createdAt'>): Evento {
    const novoEvento: Evento = {
      ...dados,
      id: gerarUuid(),
      createdAt: new Date().toISOString(),
    };

    if (dados.ativo) {
      this.eventos = this.eventos.map((e) => ({ ...e, ativo: false }));
      this.eventoAtivo = novoEvento;
    } else if (!this.eventoAtivo) {
      this.eventoAtivo = novoEvento;
    }

    this.eventos = [novoEvento, ...this.eventos];
    this.persistirLocal();
    this.notify();

    void (async () => {
      await this.salvarNoBanco('evento', () => eventosService.criar(novoEvento));
      if (novoEvento.ativo) {
        await this.salvarNoBanco('evento ativo', () => eventosService.definirAtivo(novoEvento.id));
      }
    })();

    return novoEvento;
  }

  public setEventoAtivo(eventoId: string): Evento | null {
    let alvo: Evento | null = null;
    this.eventos = this.eventos.map((e) => {
      const atualizado = { ...e, ativo: e.id === eventoId };
      if (atualizado.ativo) alvo = atualizado;
      return atualizado;
    });

    if (alvo) {
      this.eventoAtivo = alvo;
      this.persistirLocal();
      this.notify();
      void this.salvarNoBanco('evento ativo', () => eventosService.definirAtivo(eventoId));
    }
    return alvo;
  }

  public updateEvento(atualizacao: Partial<Evento>, eventoId?: string): Evento {
    const idTarget = eventoId || this.getEventoAtivo().id;
    const index = this.eventos.findIndex((e) => e.id === idTarget);

    let atualizado: Evento;
    if (index !== -1) {
      atualizado = { ...this.eventos[index], ...atualizacao };
      this.eventos[index] = atualizado;
    } else {
      atualizado = { ...this.getEventoAtivo(), ...atualizacao };
      this.eventos = [...this.eventos, atualizado];
    }

    if (atualizado.ativo) {
      this.eventos = this.eventos.map((e) =>
        e.id === atualizado.id ? atualizado : { ...e, ativo: false }
      );
      this.eventoAtivo = atualizado;
    } else if (this.eventoAtivo?.id === atualizado.id) {
      this.eventoAtivo = atualizado;
    }

    this.persistirLocal();
    this.notify();

    void (async () => {
      await this.salvarNoBanco('evento', () => eventosService.atualizar(atualizado));
      if (atualizado.ativo) {
        await this.salvarNoBanco('evento ativo', () => eventosService.definirAtivo(atualizado.id));
      }
    })();

    return atualizado;
  }

  public excluirEvento(eventoId: string): boolean {
    if (this.eventos.length <= 1) return false;

    const target = this.eventos.find((e) => e.id === eventoId);
    this.eventos = this.eventos.filter((e) => e.id !== eventoId);

    if (target?.ativo && this.eventos.length > 0) {
      this.eventos[0] = { ...this.eventos[0], ativo: true };
      this.eventoAtivo = this.eventos[0];
    }

    this.persistirLocal();
    this.notify();
    void this.salvarNoBanco('exclusão de evento', () => eventosService.excluir(eventoId));
    return true;
  }

  // ---------------------------------------------------------------------------
  // Escrita: compra e ingressos
  // ---------------------------------------------------------------------------

  public async criarInscricoesEIngressos(
    amigos: { nomeCompleto: string; documento: string; whatsapp?: string }[]
  ): Promise<{
    ingressos: Ingresso[];
    ingressoPrincipal: Ingresso;
    qrCodeDataUrl: string;
    pixCopiaECola: string;
    sincronizado: boolean;
    aviso?: string;
  }> {
    const evento = this.getEventoAtivo();
    const valorUnitario = evento.valor;
    const valorTotal = valorUnitario * amigos.length;
    const pedidoId = `ped-${Date.now()}`;
    const codigoPrincipal = gerarCodigoIngresso();

    // Bloqueia compras para eventos que não existem no banco quando configurado.
    if (supabaseConfigurado && !this.eventoAtivo) {
      throw new Error('Nenhum evento ativo no momento. Aguarde a próxima programação da Casa Furtacor.');
    }

    const pixPayload = gerarPayloadPix(valorTotal, codigoPrincipal);
    const qrCodeDataUrl = await gerarQrCodeDataUrl(pixPayload);

    const novosIngressos: Ingresso[] = [];
    const novosClientes: Cliente[] = [];
    const agora = new Date().toISOString();

    amigos.forEach((amigo, idx) => {
      const whatsapp = (amigo.whatsapp || amigos[0].whatsapp || '').replace(/\D/g, '');
      const cliente: Cliente = {
        id: gerarUuid(),
        nomeCompleto: amigo.nomeCompleto.trim(),
        documento: amigo.documento.trim(),
        whatsapp,
        createdAt: agora,
      };
      novosClientes.push(cliente);

      const codigoUnico = idx === 0 ? codigoPrincipal : gerarCodigoIngresso();
      novosIngressos.push({
        id: gerarUuid(),
        eventoId: evento.id,
        clienteId: cliente.id,
        codigoIngresso: codigoUnico,
        statusPagamento: 'pendente',
        valorPago: valorUnitario,
        checkInRealizado: false,
        createdAt: agora,
        clienteNome: amigo.nomeCompleto.trim(),
        clienteDocumento: amigo.documento.trim(),
        clienteWhatsapp: whatsapp,
        eventoTitulo: evento.titulo,
        pixPayload,
        pedidoId,
      });
    });

    let sincronizado = false;
    let aviso: string | undefined;

    if (supabaseConfigurado) {
      try {
        await Promise.all(novosClientes.map((c) => clientesService.criar(c)));
        await Promise.all(novosIngressos.map((i) => ingressosService.criar(i)));
        sincronizado = true;
      } catch (err) {
        console.warn('[Supabase] Falha ao gravar clientes/ingressos:', err);
        aviso =
          'Seu ingresso foi gerado, mas não conseguimos registrá-lo no banco agora. Guarde este QR Code — a equipe conseguirá confirmar a entrada.';
        this.ultimoErro = aviso;
      }
    } else {
      aviso = 'Modo offline: o ingresso ficou salvo apenas neste dispositivo.';
    }

    this.clientes = [...novosClientes, ...this.clientes];
    this.ingressos = [...novosIngressos, ...this.ingressos];
    novosIngressos.forEach((i) => this.salvarNoDispositivo(i.codigoIngresso));
    this.persistirLocal();
    this.notify();

    return {
      ingressos: novosIngressos,
      ingressoPrincipal: novosIngressos[0],
      qrCodeDataUrl,
      pixCopiaECola: pixPayload,
      sincronizado,
      aviso,
    };
  }

  /** Método legado mantido para compatibilidade. */
  public async criarInscricaoEIngresso(dados: {
    nomeCompleto: string;
    documento: string;
    whatsapp: string;
    quantidade?: number;
  }): Promise<{ ingresso: Ingresso; qrCodeDataUrl: string; pixCopiaECola: string }> {
    const res = await this.criarInscricoesEIngressos([dados]);
    return {
      ingresso: res.ingressoPrincipal,
      qrCodeDataUrl: res.qrCodeDataUrl,
      pixCopiaECola: res.pixCopiaECola,
    };
  }

  private localizarIngresso(chave: string): Ingresso | undefined {
    return this.ingressos.find((i) => i.id === chave || i.codigoIngresso === chave);
  }

  public confirmarPagamento(ingressoId: string): Ingresso | null {
    const alvo = this.localizarIngresso(ingressoId);
    if (!alvo) return null;

    const doMesmoPedido = alvo.pedidoId
      ? this.ingressos.filter((i) => i.pedidoId === alvo.pedidoId)
      : [alvo];

    doMesmoPedido.forEach((i) => {
      i.statusPagamento = 'pago';
    });
    this.persistirLocal();
    this.notify();

    void this.salvarNoBanco('pagamento', () =>
      alvo.pedidoId
        ? ingressosService.definirStatusDoPedido(alvo.pedidoId, 'pago')
        : ingressosService.atualizarStatus(alvo.id, 'pago')
    );

    return alvo;
  }

  public definirStatusPagamento(
    ingressoId: string,
    status: Ingresso['statusPagamento']
  ): Ingresso | null {
    const alvo = this.localizarIngresso(ingressoId);
    if (!alvo) return null;

    alvo.statusPagamento = status;
    this.persistirLocal();
    this.notify();
    void this.salvarNoBanco('status de pagamento', () =>
      ingressosService.atualizarStatus(alvo.id, status)
    );
    return alvo;
  }

  public realizarCheckIn(ingressoId: string, realizado: boolean = true): Ingresso | null {
    const alvo = this.localizarIngresso(ingressoId);
    if (!alvo) return null;

    alvo.checkInRealizado = realizado;
    alvo.checkInHora = realizado ? new Date().toISOString() : undefined;
    if (realizado && alvo.statusPagamento !== 'pago') {
      alvo.statusPagamento = 'pago';
    }

    this.persistirLocal();
    this.notify();
    void this.salvarNoBanco('check-in', () =>
      ingressosService.realizarCheckIn(
        alvo.id,
        realizado,
        alvo.checkInHora ?? null,
        alvo.statusPagamento
      )
    );

    return alvo;
  }

  public adicionarAmigoManual(dados: {
    nome: string;
    documento: string;
    whatsapp: string;
    pago: boolean;
  }): Ingresso {
    const evento = this.getEventoAtivo();
    const agora = new Date().toISOString();
    const cliente: Cliente = {
      id: gerarUuid(),
      nomeCompleto: dados.nome.trim(),
      documento: dados.documento.trim(),
      whatsapp: dados.whatsapp.replace(/\D/g, ''),
      createdAt: agora,
    };

    const novoIngresso: Ingresso = {
      id: gerarUuid(),
      eventoId: evento.id,
      clienteId: cliente.id,
      codigoIngresso: gerarCodigoIngresso(),
      statusPagamento: dados.pago ? 'pago' : 'pendente',
      valorPago: evento.valor,
      checkInRealizado: false,
      createdAt: agora,
      clienteNome: dados.nome.trim(),
      clienteDocumento: dados.documento.trim(),
      clienteWhatsapp: dados.whatsapp.replace(/\D/g, ''),
      eventoTitulo: evento.titulo,
    };

    this.clientes = [cliente, ...this.clientes];
    this.ingressos = [novoIngresso, ...this.ingressos];
    this.persistirLocal();
    this.notify();

    void (async () => {
      await this.salvarNoBanco('cliente', () => clientesService.criar(cliente));
      await this.salvarNoBanco('ingresso', () => ingressosService.criar(novoIngresso));
    })();

    return novoIngresso;
  }

  public excluirIngresso(ingressoId: string) {
    this.ingressos = this.ingressos.filter((i) => i.id !== ingressoId);
    this.persistirLocal();
    this.notify();
    void this.salvarNoBanco('exclusão de ingresso', () => ingressosService.excluir(ingressoId));
  }

  // ---------------------------------------------------------------------------
  // Estatísticas e utilitários
  // ---------------------------------------------------------------------------

  public getStats(): PortariaStats {
    const evento = this.getEventoAtivo();
    // Considera apenas os ingressos do evento ativo: evita misturar dados
    // antigos/de demonstração com a programação atual.
    const ingressos = this.ingressos.filter((i) => i.eventoId === evento.id);

    return {
      totalIngressos: ingressos.length,
      totalPagos: ingressos.filter((i) => i.statusPagamento === 'pago').length,
      totalPendentes: ingressos.filter((i) => i.statusPagamento === 'pendente').length,
      totalPresentes: ingressos.filter((i) => i.checkInRealizado).length,
      arrecadacaoTotal: ingressos
        .filter((i) => i.statusPagamento === 'pago')
        .reduce((acc, curr) => acc + curr.valorPago, 0),
      capacidade: evento.capacidadeMaxima || 50,
    };
  }

  public resetarDados() {
    this.eventos = [INITIAL_EVENTO];
    this.eventoAtivo = INITIAL_EVENTO;
    this.clientes = INITIAL_CLIENTES;
    this.ingressos = INITIAL_INGRESSOS;
    localStorage.removeItem(STORAGE_KEYS.USER_TICKETS);
    this.persistirLocal();
    this.notify();
  }

  /** Perfil exibido no painel — derivado da sessão autenticada. */
  public getAdmin(): Admin {
    const email = authService.emailAtual();
    return {
      ...INITIAL_ADMIN,
      email: email ?? INITIAL_ADMIN.email,
    };
  }
}

export const storage = new StorageService();
