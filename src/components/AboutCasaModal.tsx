import React from 'react';
import { X, Heart, MapPin, Sparkles, Coffee, Music, Trees, Shield, MessageCircle, Instagram } from 'lucide-react';
import { CONTATO_CONFIG } from '../utils/pix';

interface AboutCasaModalProps {
  onClose: () => void;
}

export const AboutCasaModal: React.FC<AboutCasaModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-6">
        <div className="bg-[#2C241E] text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#E08A68] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Espaço Cultural & Afeto</span>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mt-1">Casa Furtacor</h3>
            <p className="text-xs text-[#D6CEBE] mt-0.5">
              Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm text-[#6B5A4D] leading-relaxed">
          <p className="text-base font-serif italic text-[#2C241E]">
            "Aqui nossos amigos e amigas chegam primeiro."
          </p>

          <p>
            A <strong className="text-[#2C241E]">Casa Furtacor</strong> nasceu do desejo de abrir as portas
            de casa para a arte, música, conversas boas e encontros genuínos em João Pessoa. Localizada
            no coração arborizado do bairro Castelo Branco I, a casa oferece noites acústicas, luaus, saraus
            e reuniões afetivas.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]">
              <Trees className="w-5 h-5 text-[#5A7156] mb-1.5" />
              <p className="font-semibold text-[#2C241E] text-xs">Quintal Arborizado</p>
              <p className="text-[11px] text-[#8A7869] mt-0.5">Espaço ao ar livre sob a brisa paraibana.</p>
            </div>

            <div className="p-3 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]">
              <Music className="w-5 h-5 text-[#C85A32] mb-1.5" />
              <p className="font-semibold text-[#2C241E] text-xs">Música Íntima</p>
              <p className="text-[11px] text-[#8A7869] mt-0.5">Voz e violão sem barulho estridente.</p>
            </div>

            <div className="p-3 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]">
              <Coffee className="w-5 h-5 text-[#C85A32] mb-1.5" />
              <p className="font-semibold text-[#2C241E] text-xs">Comidinhas Afetivas</p>
              <p className="text-[11px] text-[#8A7869] mt-0.5">Sabores caseiros preparados na hora.</p>
            </div>

            <div className="p-3 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]">
              <Shield className="w-5 h-5 text-[#5A7156] mb-1.5" />
              <p className="font-semibold text-[#2C241E] text-xs">Sem Taxas Abusivas</p>
              <p className="text-[11px] text-[#8A7869] mt-0.5">100% do valor vai para os artistas e a casa.</p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6DCD1] space-y-3">
            <p className="text-xs text-[#8A7869]">
              <strong>Como chegar:</strong> Próximo à UFPB e ao centro do Castelo Branco I ({CONTATO_CONFIG.endereco}). Fácil
              estacionamento na rua e acesso rápido via ônibus ou aplicativo.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={CONTATO_CONFIG.whatsappLink}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 py-2 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>WhatsApp Oficial</span>
              </a>

              <a
                href={CONTATO_CONFIG.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 py-2 px-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover:opacity-95"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2C241E] text-white rounded-xl text-xs font-medium hover:bg-[#43372F] transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
