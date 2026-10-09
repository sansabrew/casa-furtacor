import React from 'react';
import { X, Ticket, Calendar, QrCode, ArrowRight } from 'lucide-react';
import { Ingresso, Evento } from '../types';

interface MyTicketsModalProps {
  ingressos: Ingresso[];
  evento: Evento;
  onSelectTicket: (ingresso: Ingresso) => void;
  onClose: () => void;
}

export const MyTicketsModal: React.FC<MyTicketsModalProps> = ({
  ingressos,
  evento,
  onSelectTicket,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-6">
        <div className="bg-[#2C241E] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#E08A68]" />
            <h3 className="text-lg font-serif font-bold text-white">Meus Ingressos Salvos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#D6CEBE] hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {ingressos.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#8A7869]">
              <p>Nenhum ingresso encontrado neste dispositivo ainda.</p>
              <p className="text-xs mt-1">Preencha o formulário para garantir o seu lugar!</p>
            </div>
          ) : (
            ingressos.map((ing) => (
              <div
                key={ing.id}
                onClick={() => onSelectTicket(ing)}
                className="bg-white p-4 rounded-2xl border border-[#DDD3C5] hover:border-[#C85A32] shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#C85A32]">
                      {ing.codigoIngresso}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        ing.statusPagamento === 'pago'
                          ? 'bg-[#5A7156]/15 text-[#5A7156]'
                          : 'bg-[#D97706]/15 text-[#D97706]'
                      }`}
                    >
                      {ing.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                  <h4 className="font-serif font-semibold text-[#2C241E] text-base mt-1">
                    {ing.eventoTitulo}
                  </h4>
                  <p className="text-xs text-[#6B5A4D]">Titular: {ing.clienteNome}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#C85A32] font-medium">
                  <span>Ver Bilhete</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
