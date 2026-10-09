/**
 * Limite de envios por janela de tempo, guardado no dispositivo.
 *
 * IMPORTANTE sobre o alcance disso: é uma trava de EXPERIÊNCIA, não de
 * segurança. Ela evita rajada acidental e desincentiva spam simples, mas
 * qualquer pessoa que chamasse o Firestore direto ignora este arquivo —
 * o código do navegador é do cliente. O que de fato impede automação é o
 * App Check (ver services/firebase.ts), que o Firebase aplica no servidor.
 */

const PREFIXO = 'casa_furtacor_throttle_';

export interface Limite {
  permitido: boolean;
  /** Quantas ações ainda restam na janela atual. */
  restante: number;
  /** Segundos a esperar quando o limite acabou (0 quando liberado). */
  esperaSegundos: number;
}

function lerEventos(chave: string): number[] {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

function gravarEventos(chave: string, eventos: number[]): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(eventos));
  } catch {
    // Modo privado / cota cheia: seguimos sem persistir o histórico.
  }
}

/**
 * Verifica se ainda há folga na janela. Não consome cota — chame registrarAcao
 * depois que a ação realmente acontecer.
 */
export function consultarLimite(chave: string, maximo: number, janelaMs: number): Limite {
  const agora = Date.now();
  const janela = agora - janelaMs;
  const recentes = lerEventos(chave).filter((t) => t > janela);

  if (recentes.length >= maximo) {
    const maisAntigo = Math.min(...recentes);
    return {
      permitido: false,
      restante: 0,
      esperaSegundos: Math.max(1, Math.ceil((maisAntigo + janelaMs - agora) / 1000)),
    };
  }

  return {
    permitido: true,
    restante: maximo - recentes.length,
    esperaSegundos: 0,
  };
}

/** Consome uma ação da cota, descartando o que já saiu da janela. */
export function registrarAcao(chave: string, maximo: number, janelaMs: number): void {
  const agora = Date.now();
  const janela = agora - janelaMs;
  const recentes = lerEventos(chave).filter((t) => t > janela);
  recentes.push(agora);
  gravarEventos(chave, recentes.slice(-maximo));
}

export function formatarEspera(segundos: number): string {
  if (segundos < 60) return `${segundos} segundo${segundos === 1 ? '' : 's'}`;
  const minutos = Math.ceil(segundos / 60);
  return `${minutos} minuto${minutos === 1 ? '' : 's'}`;
}

// Janelas usadas pela casa. Valores folgados o bastante para não atrapalhar
// quem depende de verdade: um amigo não precisa de cinco mensagens em cinco

export const LIMITES = {

  chatMensagens: { chave: 'chat_mensagem', maximo: 25, janelaMs: 5 * 60 * 1000 },
} as const;