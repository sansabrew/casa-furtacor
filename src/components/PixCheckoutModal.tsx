import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, Clock, ShieldCheck, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Ingresso, Evento } from '../types';
import { PIX_CONFIG } from '../utils/pix';

interface PixCheckoutModalProps {
  ingresso: Ingresso;
  todosIngressos?: Ingresso[];
  evento: Evento;
  qrCodeDataUrl: string;
  pixCopiaECola: string;
  onClose: () => void;
  onConfirmPayment: (ingressoId: string) => void;
}

export const PixCheckoutModal: React.FC<PixCheckoutModalProps> = ({
  ingresso,
  todosIngressos,
  evento,
  qrCodeDataUrl,
  pixCopiaECola,
  onClose,
  onConfirmPayment,
}) => {
  const listaIngressos = todosIngressos && todosIngressos.length > 0 ? todosIngressos : [ingresso];
  const valorTotal = listaIngressos.reduce((acc, curr) => acc + curr.valorPago, 0);

  const [copiado, setCopiado] = useState(false);
  const [copiadoChave, setCopiadoChave] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(15 * 60); // 15 minutos
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopiarPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // Fallback manual de cópia
      const textArea = document.createElement('textarea');
      textArea.value = pixCopiaECola;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  const handleCopiarChaveSimples = async () => {
    try {
      await navigator.clipboard.writeText(PIX_CONFIG.chave);
      setCopiadoChave(true);
      setTimeout(() => setCopiadoChave(false), 3000);
    } catch {
      setCopiadoChave(true);
      setTimeout(() => setCopiadoChave(false), 3000);
    }
  };

  const handleConfirmarPagamento = () => {
    setIsVerifying(true);
    setTimeout(() => {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#C85A32', '#E08A68', '#5A7156', '#FAF7F2'],
        });
      } catch {
        // Confetti is optional
      }
      setIsVerifying(false);
      onConfirmPayment(ingresso.id);
    }, 800);
  };

  const msgWhatsapp = encodeURIComponent(
    `Olá, Casa Furtacor! Acabei de gerar o PIX para o ingresso *${ingresso.codigoIngresso}* (${ingresso.clienteNome} - ${evento.titulo}). Gostaria de confirmar!`
  );
  const linkWhatsapp = `https://wa.me/${PIX_CONFIG.whatsappOficial}?text=${msgWhatsapp}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-6">
        {/* Topo do Modal */}
        <div className="bg-[#2C241E] text-white p-5 sm:p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#E08A68] font-semibold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Checkout PIX Instantâneo</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1">
              Quase lá, {ingresso.clienteNome.split(' ')[0]}!
            </h3>
            <p className="text-xs text-[#D6CEBE] mt-0.5">
              Pague com o app do seu banco para liberar seu ingresso
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Checkout */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Card Resumo do Pedido */}
          <div className="bg-[#F4EDE4] p-4 rounded-2xl border border-[#E6DCD1] space-y-3 text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6DCD1]/60">
              <div>
                <p className="text-xs text-[#8A7869]">Evento</p>
                <p className="font-semibold text-[#2C241E]">{evento.titulo}</p>
                <p className="text-xs text-[#6B5A4D]">{evento.dataEvento} às {evento.horario}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8A7869]">
                  Total do PIX ({listaIngressos.length} {listaIngressos.length === 1 ? 'amigo' : 'amigos'})
                </p>
                <p className="text-2xl font-serif font-bold text-[#C85A32]">
                  R$ {valorTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            {/* Lista dos Amigos Cadastrados */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7869] block">
                {listaIngressos.length === 1 ? 'Amigo(a) Titular:' : 'Amigos com Lugares Reservados:'}
              </span>
              {listaIngressos.map((ing, idx) => (
                <div key={ing.id} className="flex items-center justify-between text-xs bg-white/70 p-2 rounded-xl border border-[#E6DCD1]/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#2C241E] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[#2C241E]">{ing.clienteNome}</span>
                    <span className="text-[11px] text-[#8A7869]">({ing.clienteDocumento})</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#C85A32]">{ing.codigoIngresso}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Temporizador */}
          <div className="flex items-center justify-between text-xs text-[#6B5A4D] px-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
              Tempo para conclusão:
            </span>
            <span className="font-mono font-semibold text-[#2C241E] bg-[#EFE7DC] px-2 py-0.5 rounded">
              {formatarTempo(tempoRestante)}
            </span>
          </div>

          {/* QR Code Real Gerado */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#E6DCD1] shadow-inner">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="QR Code PIX Casa Furtacor"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-[#8A7869]">
                Gerando QR Code...
              </div>
            )}
            <p className="text-[11px] text-[#8A7869] text-center mt-2">
              Aponte a câmera do aplicativo do seu banco para pagar
            </p>
          </div>

          {/* PIX Copia e Cola */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C241E] mb-1.5">
              Código PIX Copia e Cola:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={pixCopiaECola}
                className="w-full text-xs font-mono bg-white border border-[#DDD3C5] px-3 py-2.5 rounded-xl text-[#2C241E] outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopiarPix}
                className={`px-4 py-2.5 rounded-xl font-medium text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  copiado
                    ? 'bg-[#5A7156] text-white'
                    : 'bg-[#2C241E] hover:bg-[#43372F] text-white'
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Chave PIX para quem prefere digitar */}
          <div className="p-3 bg-[#EFE7DC]/60 rounded-xl border border-[#DDD3C5]/60 text-xs text-[#6B5A4D] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-semibold text-[#2C241E]">Chave PIX ({PIX_CONFIG.tipoChave}):</span>
              <p className="font-mono text-[#2C241E] mt-0.5 truncate">{PIX_CONFIG.chave}</p>
            </div>
            <button
              onClick={handleCopiarChaveSimples}
              className="text-[#C85A32] hover:underline font-medium text-xs cursor-pointer shrink-0"
            >
              {copiadoChave ? 'Copiada!' : 'Copiar chave'}
            </button>
          </div>

          {/* Botão de Confirmação Imediata */}
          <div className="pt-2 space-y-2.5">
            <button
              onClick={handleConfirmarPagamento}
              disabled={isVerifying}
              className="w-full py-3.5 px-4 bg-[#5A7156] hover:bg-[#4A5E47] text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              {isVerifying ? (
                <span>Confirmando recebimento...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Já realizei o PIX / Liberar Ingresso</span>
                </>
              )}
            </button>

            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full py-2.5 px-3 bg-transparent hover:bg-[#EFE7DC] text-[#6B5A4D] hover:text-[#2C241E] border border-[#DDD3C5] font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#5A7156]" />
              <span>Enviar comprovante no WhatsApp da Casa</span>
            </a>

          </div>

          <div className="flex items-center gap-1.5 justify-center text-[11px] text-[#8A7869]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7156]" />
            <span>Validação imediata · Não cobramos taxa de serviço</span>
          </div>
        </div>
      </div>
    </div>
  );
};
