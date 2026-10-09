import React, { useState, useEffect } from 'react';
import { X, Download, Share2, CheckCircle2, QrCode, MapPin, Calendar, Clock, Sparkles, Heart } from 'lucide-react';
import { Ingresso, Evento } from '../types';
import { gerarQrCodeDataUrl } from '../utils/pix';
import { ChameleonLogo } from './ChameleonLogo';

interface TicketPassModalProps {
  ingresso: Ingresso;
  todosIngressos?: Ingresso[];
  evento: Evento;
  onClose: () => void;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  ingresso,
  todosIngressos,
  evento,
  onClose,
}) => {
  const lista = todosIngressos && todosIngressos.length > 0 ? todosIngressos : [ingresso];
  const [ticketIndex, setTicketIndex] = useState(0);
  const atualIngresso = lista[ticketIndex] || ingresso;

  const [ticketQrUrl, setTicketQrUrl] = useState<string>('');
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    async function loadQr() {
      // O QR Code do ingresso contém o código único para a câmera da portaria ler
      const qrData = `CASA-FURTACOR|INGRESSO|${atualIngresso.codigoIngresso}|DOC:${atualIngresso.clienteDocumento}|NOME:${atualIngresso.clienteNome}`;
      const url = await gerarQrCodeDataUrl(qrData);
      setTicketQrUrl(url);
    }
    loadQr();
  }, [atualIngresso]);

  const handleImprimirOuSalvar = () => {
    setSalvo(true);
    window.print();
    setTimeout(() => setSalvo(false), 3000);
  };

  const handleCompartilharWhatsapp = () => {
    const texto = `🎟️ *Ingresso Casa Furtacor* ✨%0A%0A*Evento:* ${evento.titulo}%0A*Data:* ${evento.dataEvento} às ${evento.horario}%0A*Local:* ${evento.local} (${evento.endereco})%0A*Amigo(a) Titular:* ${atualIngresso.clienteNome}%0A*Documento:* ${atualIngresso.clienteDocumento}%0A*Código de Entrada:* ${atualIngresso.codigoIngresso}%0A*Status:* Confirmado & Pago%0A%0AApresente este comprovante na portaria da casa!`;
    window.open(`https://api.whatsapp.com/send?text=${texto}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-6">
        {/* Barra superior de ações */}
        <div className="no-print bg-[#2C241E] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#E08A68] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ingresso Afetivo Confirmado ({ticketIndex + 1}/{lista.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#D6CEBE] hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de amigos caso haja mais de 1 ingresso */}
        {lista.length > 1 && (
          <div className="no-print bg-[#F4EDE4] p-2 border-b border-[#E6DCD1] flex gap-1.5 overflow-x-auto">
            {lista.map((ing, idx) => (
              <button
                key={ing.id}
                onClick={() => setTicketIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  ticketIndex === idx
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'bg-white text-[#6B5A4D] hover:text-[#2C241E]'
                }`}
              >
                {idx + 1}. {ing.clienteNome.split(' ')[0]}
              </button>
            ))}
          </div>
        )}

        {/* Voucher / Bilhete Estilizado */}
        <div className="p-6 bg-[#FAF7F2]">
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#DDD3C5] p-5 shadow-sm relative overflow-hidden">
            {/* Marca d'água sutil e carimbo de pagamento */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DCD1]">
              <div className="flex items-center gap-2">
                <ChameleonLogo size="sm" showText={true} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#5A7156]/15 border border-[#5A7156]/30 text-[#5A7156] text-xs font-semibold rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirmado</span>
              </div>
            </div>

            {/* Nome do Evento */}
            <div className="my-4">
              <span className="text-xs text-[#8A7869]">Evento Cultural</span>
              <h3 className="text-2xl font-serif font-bold text-[#C85A32] leading-tight">
                {evento.titulo}
              </h3>
            </div>

            {/* QR Code de Entrada da Portaria */}
            <div className="my-4 flex flex-col items-center justify-center p-3 bg-[#FAF7F2] rounded-xl border border-[#E6DCD1]">
              {ticketQrUrl ? (
                <img
                  src={ticketQrUrl}
                  alt="QR Code do Ingresso"
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-xs text-[#8A7869]">
                  Gerando Código...
                </div>
              )}
              <div className="mt-2 text-center">
                <span className="text-[10px] uppercase tracking-wider text-[#8A7869] block">
                  Código de Identificação
                </span>
                <span className="text-base font-mono font-bold tracking-wider text-[#2C241E]">
                  {atualIngresso.codigoIngresso}
                </span>
              </div>
            </div>

            {/* Detalhes do Participante */}
            <div className="space-y-2 pt-2 border-t border-[#E6DCD1] text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A7869]">Amigo(a) Titular:</span>
                <span className="font-semibold text-[#2C241E] text-right">{atualIngresso.clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7869]">Documento (RG/CPF):</span>
                <span className="font-mono text-[#2C241E]">{atualIngresso.clienteDocumento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7869]">Data & Horário:</span>
                <span className="font-medium text-[#2C241E]">
                  {evento.dataEvento} às {evento.horario}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A7869]">Local:</span>
                <span className="text-[#2C241E] text-right">{evento.local}</span>
              </div>
            </div>

            {/* Endereço */}
            <div className="mt-3 p-2.5 bg-[#F4EDE4] rounded-lg text-[11px] text-[#6B5A4D] flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#C85A32] shrink-0 mt-0.5" />
              <span>{evento.endereco}</span>
            </div>

            {/* Mensagem Acolhedora */}
            <div className="mt-4 pt-3 border-t border-[#E6DCD1] text-center">
              <p className="text-xs font-serif italic text-[#8A7869]">
                "Aqui nossos amigos e amigas chegam primeiro."
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="no-print mt-5 space-y-2.5">
            <button
              onClick={handleCompartilharWhatsapp}
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white font-medium rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar Ingresso de {atualIngresso.clienteNome.split(' ')[0]} no WhatsApp</span>
            </button>

            <button
              onClick={handleImprimirOuSalvar}
              className="w-full py-2.5 px-4 bg-[#2C241E] hover:bg-[#43372F] text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              <span>{salvo ? 'Pronto para Salvar!' : 'Baixar / Imprimir Bilhete'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs text-[#8A7869] hover:text-[#2C241E] cursor-pointer"
            >
              Concluído e Voltar à Página Principal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
