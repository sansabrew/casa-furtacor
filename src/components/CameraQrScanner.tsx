import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  X,
  Camera,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  UserCheck,
} from 'lucide-react';
import { Ingresso } from '../types';
import { storage } from '../services/storageService';

interface CameraQrScannerProps {
  ingressos: Ingresso[];
  isModal?: boolean;
  onClose?: () => void;
  onSuccessCheckIn: (ingresso: Ingresso) => void;
  onToggleFullscreen?: () => void;
}

export const CameraQrScanner: React.FC<CameraQrScannerProps> = ({
  ingressos,
  isModal = false,
  onClose,
  onSuccessCheckIn,
  onToggleFullscreen,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [scanResult, setScanResult] = useState<{
    status: 'sucesso' | 'ja_entrou' | 'erro';
    mensagem: string;
    ingresso?: Ingresso;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;

  // Tocar bip sonoro nativo via Web Audio API
  const playBeep = useCallback((type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(370, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  }, [soundEnabled]);

  // Processar código extraído do QR
  const processDecodedText = useCallback((decodedText: string) => {
    const text = decodedText.trim();

    // 1. Tentar extrair padrão FURTA-2026-XXXX
    const codeMatch = text.match(/FURTA-\d{4}-\d{4}/i);
    const targetCode = codeMatch ? codeMatch[0].toUpperCase() : null;

    // 2. Buscar nos ingressos
    let encontrado: Ingresso | undefined;

    if (targetCode) {
      encontrado = ingressos.find(
        (i) => i.codigoIngresso.toUpperCase() === targetCode
      );
    }

    if (!encontrado) {
      const docClean = text.replace(/\D/g, '');
      encontrado = ingressos.find((i) => {
        if (i.codigoIngresso.toLowerCase() === text.toLowerCase()) return true;
        if (docClean.length >= 7 && i.clienteDocumento.replace(/\D/g, '') === docClean) return true;
        if (text.toLowerCase().includes(i.codigoIngresso.toLowerCase())) return true;
        return false;
      });
    }

    if (!encontrado) {
      playBeep('error');
      setScanResult({
        status: 'erro',
        mensagem: `Código não encontrado na lista da Casa Furtacor ("${text.slice(0, 30)}...").`,
      });
      // Liberar após 2.5 segundos para tentar novamente
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2500);
      return;
    }

    // Se já havia entrado
    if (encontrado.checkInRealizado) {
      playBeep('warning');
      const hora = encontrado.checkInHora
        ? new Date(encontrado.checkInHora).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'mais cedo';
      setScanResult({
        status: 'ja_entrou',
        mensagem: `Atenção: Este ingresso já deu entrada às ${hora}.`,
        ingresso: encontrado,
      });
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 3000);
      return;
    }

    // Sucesso: Realizar check-in
    playBeep('success');
    const atualizado = storage.realizarCheckIn(encontrado.id, true);
    if (atualizado) {
      onSuccessCheckIn(atualizado);
      setScanResult({
        status: 'sucesso',
        mensagem: `Entrada autorizada! Seja muito bem-vindo(a), ${atualizado.clienteNome}!`,
        ingresso: atualizado,
      });
    }

    // Liberar leitura para o próximo convidado após 3.5 segundos
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 3500);
  }, [ingressos, onSuccessCheckIn, playBeep]);

  // Iniciar scanner de câmera
  useEffect(() => {
    let html5Qr: Html5Qrcode | null = null;
    let isMounted = true;

    async function startCamera() {
      try {
        setCameraError(null);
        html5Qr = new Html5Qrcode(containerId);
        scannerRef.current = html5Qr;

        const config = {
          fps: 10,
          qrbox: { width: 230, height: 230 },
          aspectRatio: 1.0,
        };

        await html5Qr.start(
          { facingMode },
          config,
          (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            processDecodedText(decodedText);
          },
          () => {
            // Frame sem QR, esperado
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('Erro ao acessar câmera:', err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')) {
            setCameraError(
              'Permissão de câmera negada. Habilite a câmera nas configurações do navegador ou use o botão de carregar foto abaixo.'
            );
          } else if (
            errorMsg.includes('NotFoundError') ||
            errorMsg.includes('DevicesNotFoundError')
          ) {
            setCameraError(
              'Nenhuma câmera foi encontrada neste dispositivo. Você pode escolher uma foto do ingresso para escanear.'
            );
          } else {
            setCameraError(
              'Não foi possível inicializar o vídeo da câmera. Você pode selecionar um print com o QR code ou simular a leitura.'
            );
          }
          setIsScanning(false);
        }
      }
    }

    // Pequeno delay para garantir que o elemento DOM containerId esteja montado
    const timeout = setTimeout(() => {
      startCamera();
    }, 100);

    return () => {
      clearTimeout(timeout);
      isMounted = false;
      if (html5Qr) {
        if (html5Qr.isScanning) {
          html5Qr
            .stop()
            .then(() => html5Qr?.clear())
            .catch(() => {});
        } else {
          try {
            html5Qr.clear();
          } catch {}
        }
      }
    };
  }, [facingMode, containerId, processDecodedText]);

  // Alternar câmera frontal e traseira
  const handleToggleFacingMode = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
        })
        .catch(() => {
          setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
        });
    } else {
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    }
  };

  // Escanear arquivo de imagem (print do QR code)
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let qrEngine = scannerRef.current;
      if (!qrEngine) {
        qrEngine = new Html5Qrcode(containerId);
        scannerRef.current = qrEngine;
      }
      const decodedText = await qrEngine.scanFile(file, false);
      isProcessingRef.current = true;
      processDecodedText(decodedText);
    } catch {
      playBeep('error');
      setScanResult({
        status: 'erro',
        mensagem: 'Nenhum QR Code legível foi detectado nesta foto.',
      });
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2500);
    }
  };

  // Simular leitura com 1-toque de teste
  const handleSimularLeitura = () => {
    const pendente = ingressos.find((i) => !i.checkInRealizado) || ingressos[0];
    if (pendente) {
      isProcessingRef.current = true;
      processDecodedText(pendente.codigoIngresso);
    }
  };

  // Continuar escaneando próximo convidado
  const handleContinuarEscaneando = () => {
    setScanResult(null);
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 400);
  };

  const content = (
    <div className="bg-[#FAF7F2] rounded-3xl border-2 border-[#C85A32]/40 shadow-xl overflow-hidden flex flex-col">
      {/* Cabeçalho do Leitor */}
      <div className="bg-[#2C241E] text-white p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C85A32] flex items-center justify-center text-white shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-serif font-bold text-white leading-tight">
              Câmera da Portaria · Leitura de QR Code
            </h4>
            <p className="text-[11px] text-[#D6CEBE]">
              Aponte para o QR Code do ingresso no celular do amigo(a)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title={soundEnabled ? 'Silenciar bip sonoro' : 'Ativar som'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#FDE68A]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleFacingMode}
            className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="Inverter câmera (frontal/traseira)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title={isModal ? 'Modo compacto' : 'Tela cheia'}
            >
              {isModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer ml-1"
              title="Fechar câmera"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Visor de Câmera */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto bg-black rounded-2xl overflow-hidden border-2 border-[#C85A32]/50 shadow-inner flex items-center justify-center">
          {/* Contêiner de vídeo do html5-qrcode */}
          <div id={containerId} className="w-full h-full object-cover" />

          {/* Mira reticular animada */}
          {!scanResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 border border-white/20 rounded-2xl flex items-center justify-center">
                {/* Cantoneiras */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#C85A32] rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#C85A32] rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#C85A32] rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#C85A32] rounded-br-xl" />

                {/* Laser scan line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#C85A32] to-transparent shadow-[0_0_8px_#C85A32] animate-pulse" />
              </div>
            </div>
          )}

          {/* Overlay com o resultado do escaneamento */}
          {scanResult && (
            <div
              className={`absolute inset-0 p-4 sm:p-5 flex flex-col items-center justify-center text-center backdrop-blur-md animate-fade-in ${
                scanResult.status === 'sucesso'
                  ? 'bg-emerald-950/92 text-white'
                  : scanResult.status === 'ja_entrou'
                  ? 'bg-amber-950/92 text-white'
                  : 'bg-red-950/92 text-white'
              }`}
            >
              {scanResult.status === 'sucesso' && (
                <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 mb-2 animate-bounce" />
              )}
              {scanResult.status === 'ja_entrou' && (
                <AlertCircle className="w-14 h-14 sm:w-16 sm:h-16 text-amber-400 mb-2" />
              )}
              {scanResult.status === 'erro' && (
                <X className="w-14 h-14 sm:w-16 sm:h-16 text-red-400 mb-2" />
              )}

              <h4 className="text-lg sm:text-xl font-serif font-bold leading-tight">
                {scanResult.status === 'sucesso'
                  ? 'Entrada Liberada!'
                  : scanResult.status === 'ja_entrou'
                  ? 'Já Entrou na Casa!'
                  : 'Não Identificado'}
              </h4>

              {scanResult.ingresso && (
                <div className="my-2 p-2.5 bg-white/10 rounded-xl border border-white/20 text-xs w-full max-w-xs text-left">
                  <p className="font-bold text-sm text-white">{scanResult.ingresso.clienteNome}</p>
                  <p className="font-mono text-white/80">Doc: {scanResult.ingresso.clienteDocumento}</p>
                  <p className="font-mono text-[#FDE68A]">Cód: {scanResult.ingresso.codigoIngresso}</p>
                </div>
              )}

              <p className="text-xs text-white/90 max-w-xs mt-1">
                {scanResult.mensagem}
              </p>

              <button
                type="button"
                onClick={handleContinuarEscaneando}
                className="mt-3 px-5 py-2 bg-white text-[#2C241E] font-bold text-xs rounded-xl shadow-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                Escanear Próximo Amigo
              </button>
            </div>
          )}
        </div>

        {/* Mensagem de Erro de Câmera */}
        {cameraError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <p className="font-semibold">{cameraError}</p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-[11px] font-medium text-amber-900 hover:bg-amber-100 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher foto do ingresso</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileScan}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleSimularLeitura}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C85A32] text-white rounded-lg text-[11px] font-medium hover:bg-[#A34220] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Testar Simulação de Leitura</span>
              </button>
            </div>
          </div>
        )}

        {/* Ações Rápidas (Carregar Foto / Simular) */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E6DCD1] text-xs">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F4EDE4] border border-[#DDD3C5] rounded-xl font-medium text-[#2C241E] transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Foto com QR Code</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileScan}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleSimularLeitura}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F4EDE4] border border-[#DDD3C5] rounded-xl font-medium text-[#6B5A4D] transition-colors cursor-pointer"
            title="Testar validação de um ingresso"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#5A7156]" />
            <span>Simular Leitura</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="w-full max-w-md my-4">{content}</div>
      </div>
    );
  }

  return content;
};
