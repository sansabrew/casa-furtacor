import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigurado } from './supabase';

/**
 * Contas liberadas para o painel da portaria. Sem esta lista, qualquer conta
 * criada no Supabase autenticaria e receberia acesso administrativo. A barreira
 * definitiva continua sendo o Row Level Security — esta lista evita expor a
 * interface administrativa a terceiros.
 */
export const ADMIN_EMAILS_AUTORIZADOS: readonly string[] = [
  'ritamvbraga@hotmail.com',
  'benjaminbjp@gmail.com',
];

export function isEmailAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const alvo = email.trim().toLowerCase();
  return ADMIN_EMAILS_AUTORIZADOS.some((e) => e.trim().toLowerCase() === alvo);
}

export interface ResultadoAuth {
  sucesso: boolean;
  mensagem: string;
}

/**
 * Serviço de autenticação administrativa baseado no `supabase.auth`.
 *
 * Mantém um espelho síncrono (`sessaoAtual`) atualizado pelo listener de estado
 * para que componentes e serviços possam consultar `usuarioEhAdmin()` sem
 * precisar aguardar uma Promise a cada render.
 */
class AuthService {
  private sessaoAtual: Session | null = null;
  private iniciado = false;

  constructor() {
    if (!supabaseConfigurado) return;
    this.iniciarMonitoramento();
  }

  private iniciarMonitoramento() {
    if (this.iniciado) return;
    this.iniciado = true;

    supabase.auth.getSession().then(({ data }) => {
      this.sessaoAtual = data.session;
    });

    supabase.auth.onAuthStateChange((_evento, sessao) => {
      this.sessaoAtual = sessao;
    });
  }

  public estaConfigurado(): boolean {
    return supabaseConfigurado;
  }

  public sessao(): Session | null {
    return this.sessaoAtual;
  }

  public emailAtual(): string | null {
    return this.sessaoAtual?.user?.email ?? null;
  }

  public estaAutenticado(): boolean {
    return Boolean(this.sessaoAtual);
  }

  public usuarioEhAdmin(): boolean {
    return isEmailAdmin(this.sessaoAtual?.user?.email);
  }

  /** Aguarda a sessão persistida no navegador (usado no boot do app). */
  public async carregarSessao(): Promise<Session | null> {
    if (!supabaseConfigurado) return null;
    const { data } = await supabase.auth.getSession();
    this.sessaoAtual = data.session;
    return data.session;
  }

  public aoMudarSessao(callback: (sessao: Session | null) => void): () => void {
    if (!supabaseConfigurado) return () => {};
    const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      this.sessaoAtual = sessao;
      callback(sessao);
    });
    return () => data.subscription.unsubscribe();
  }

  public async entrar(email: string, senha: string): Promise<ResultadoAuth> {
    if (!supabaseConfigurado) {
      return {
        sucesso: false,
        mensagem: 'Banco de dados não configurado. Contate a administração da casa.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) {
        const msg =
          error.message.toLowerCase().includes('invalid login')
            ? 'E-mail ou senha incorretos.'
            : `Não foi possível entrar: ${error.message}`;
        return { sucesso: false, mensagem: msg };
      }

      if (!isEmailAdmin(data.user?.email)) {
        await supabase.auth.signOut();
        return {
          sucesso: false,
          mensagem: 'Esta conta não tem acesso ao painel da portaria da Casa Furtacor.',
        };
      }

      this.sessaoAtual = data.session;
      return { sucesso: true, mensagem: 'Bem-vindo(a) de volta!' };
    } catch (err) {
      console.error('Erro no login do administrador:', err);
      return {
        sucesso: false,
        mensagem: 'Falha de conexão com o banco. Verifique sua internet e tente novamente.',
      };
    }
  }

  public async sair(): Promise<void> {
    if (!supabaseConfigurado) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Erro ao encerrar sessão:', err);
    } finally {
      this.sessaoAtual = null;
    }
  }

  public async alterarSenha(senhaAtual: string, novaSenha: string): Promise<ResultadoAuth> {
    if (!supabaseConfigurado) {
      return { sucesso: false, mensagem: 'Banco de dados não configurado.' };
    }

    const email = this.emailAtual();
    if (!email) {
      return { sucesso: false, mensagem: 'Sessão expirada. Faça login novamente.' };
    }
    if (novaSenha.trim().length < 6) {
      return { sucesso: false, mensagem: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    try {
      // Reautentica para confirmar a senha atual antes de trocar.
      const { error: erroReauth } = await supabase.auth.signInWithPassword({
        email,
        password: senhaAtual,
      });
      if (erroReauth) {
        return { sucesso: false, mensagem: 'A senha atual informada está incorreta.' };
      }

      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        return { sucesso: false, mensagem: `Não foi possível trocar a senha: ${error.message}` };
      }

      return { sucesso: true, mensagem: 'Senha alterada com sucesso!' };
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      return {
        sucesso: false,
        mensagem: 'Falha de conexão. Tente novamente em instantes.',
      };
    }
  }
}

export const authService = new AuthService();

/** Atalho para uso síncrono, por exemplo nas travas de ritmo do chat. */
export function usuarioEhAdmin(): boolean {
  return authService.usuarioEhAdmin();
}
