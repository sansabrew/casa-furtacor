/**
 * Efeito Sonoro Nativo de "Sineta de Café" para o Painel da Casa Furtacor
 * Construído 100% com a Web Audio API nativa do navegador.
 *
 * Características acústicas:
 * - Curto e sutil (~450ms a 600ms de duração total)
 * - Toque discreto de sineta de balcão com ressonância morna de xícara de café
 * - Ataque limpo sem cliques e decaimento exponencial suave
 * - Filtro passa-baixa para evitar frequências estridentes
 */

const STORAGE_KEY_SOUND = 'casa_furtacor_admin_sound_enabled';

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_SOUND);
      this.soundEnabled = saved !== null ? saved === 'true' : true;

      // Desbloquear o AudioContext no primeiro toque/clique do usuário na tela
      const unlockAudio = () => {
        this.getAudioContext();
        if (this.audioCtx && this.audioCtx.state === 'running') {
          this.isUnlocked = true;
          window.removeEventListener('click', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
        }
      };

      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SOUND, String(enabled));
    }
  }

  /**
   * Efeito Sonoro: Sineta de Café 🛎️☕
   * Toque curto, discreto e acolhedor.
   * Combina a clareza de um pequeno sino de balcão (G6 - ~1568 Hz)
   * com o brilho harmônico aveludado de porcelana de café (C7 - ~2093 Hz).
   */
  public tocarSinetaCafe(variacao: 'chat' | 'padrao' = 'padrao'): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Volume master suave e filtro quente
      const masterGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3800, now); // Filtra frequências metálicas agressivas

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Frequências ajustadas para um tom amigável e aconchegante
      // Chat: Sol maior brilhante (G6 ~1567.98Hz + D7 ~2349.32Hz)
      const freqPrincipal = 1568;
      const freqSecundaria = 2093;

      // 1. Oscilador Principal (Corpo do sino/sineta)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freqPrincipal, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.13, now + 0.006); // Ataque suave de 6ms
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55); // Cauda curta e limpa de 550ms

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // 2. Oscilador Secundário (Tilintar de café / brilho harmônico)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freqSecundaria, now + 0.02);

      gain2.gain.setValueAtTime(0, now + 0.02);
      gain2.gain.linearRampToValueAtTime(0.07, now + 0.025);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Iniciar e parar os osciladores
      osc1.start(now);
      osc1.stop(now + 0.58);

      osc2.start(now + 0.02);
      osc2.stop(now + 0.4);
    } catch (e) {
      console.warn('Erro ao reproduzir sineta de café:', e);
    }
  }

  // Atalhos mantidos para compatibilidade
  public tocarSinetaRecepcao(): void {
    this.tocarSinetaCafe('chat');
  }

  public tocarCafePorcelana(): void {
  }
}

export const audioAlert = new AudioAlertService();
