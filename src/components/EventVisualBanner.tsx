import React from 'react';
import { Calendar, Clock, MapPin, Sparkles, Music, Moon, Heart, Flame } from 'lucide-react';
import { Evento } from '../types';
import { ChameleonLogo } from './ChameleonLogo';
import { EventTagBadge } from './EventTagBadge';

interface EventVisualBannerProps {
  evento: Evento;
}

export const EventVisualBanner: React.FC<EventVisualBannerProps> = ({ evento }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A1C14] via-[#3B261A] to-[#1C120C] text-[#FAF7F2] shadow-2xl border-2 border-[#E08A68]/30">
      {/* Foto de Banner do Evento com Overlay Ambiente */}
      {evento.imagemUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${evento.imagemUrl})` }}
        />
      )}

      {/* Moldura furtacor vibrante no topo com cores do Camaleão */}
      <div className="h-2 w-full bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] via-[#06B6D4] via-[#10B981] to-[#F59E0B]" />

      {/* Ilustração artística vetorial da noite do Luau no quintal da casa */}
      <div className="absolute right-0 bottom-0 top-0 w-full md:w-1/2 opacity-25 md:opacity-40 pointer-events-none overflow-hidden flex items-end justify-end">
        <svg
          viewBox="0 0 500 350"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Céu noturno com lua cheia luminosa */}
          <circle cx="340" cy="90" r="42" fill="#FEF3C7" opacity="0.9" />
          <circle cx="340" cy="90" r="56" fill="#FDE68A" opacity="0.25" />
          <circle cx="340" cy="90" r="75" fill="#FBBF24" opacity="0.1" />

          {/* Estrelas */}
          {[
            { cx: 80, cy: 50, r: 1.5 },
            { cx: 160, cy: 30, r: 2 },
            { cx: 240, cy: 70, r: 1.5 },
            { cx: 420, cy: 40, r: 2 },
            { cx: 460, cy: 110, r: 1.5 },
            { cx: 280, cy: 25, r: 2.5 },
            { cx: 390, cy: 80, r: 1 },
          ].map((s, idx) => (
            <circle key={idx} cx={s.cx} cy={s.cy} r={s.r} fill="#FFFFFF" opacity="0.8" />
          ))}

          {/* Silhueta da Casa / Chalé rústico acolhedor com janelas iluminadas */}
          <path
            d="M 320 350 L 320 220 L 410 160 L 500 220 L 500 350 Z"
            fill="#1E140D"
            stroke="#5C3D28"
            strokeWidth="2"
          />
          {/* Telhado */}
          <path
            d="M 305 225 L 410 145 L 515 225 L 410 155 Z"
            fill="#3F2719"
            stroke="#8C5835"
            strokeWidth="2"
          />
          {/* Chaminé */}
          <rect x="450" y="140" width="22" height="40" fill="#2E1C12" />

          {/* Janelas com luz dourada acesa */}
          <rect x="345" y="235" width="30" height="34" rx="3" fill="#FDE68A" />
          <line x1="360" y1="235" x2="360" y2="269" stroke="#78350F" strokeWidth="2" />
          <line x1="345" y1="252" x2="375" y2="252" stroke="#78350F" strokeWidth="2" />

          <rect x="435" y="235" width="30" height="34" rx="3" fill="#FDE68A" />
          <line x1="450" y1="235" x2="450" y2="269" stroke="#78350F" strokeWidth="2" />
          <line x1="435" y1="252" x2="465" y2="252" stroke="#78350F" strokeWidth="2" />

          {/* Porta da Casa */}
          <rect x="390" y="265" width="26" height="55" rx="2" fill="#78350F" />
          <circle cx="410" cy="295" r="2.5" fill="#FDE68A" />

          {/* Fogueira acolhedora (Campfire) no quintal */}
          <ellipse cx="230" cy="315" rx="35" ry="12" fill="#2E1A0F" />
          <line x1="205" y1="318" x2="255" y2="310" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
          <line x1="208" y1="310" x2="250" y2="318" stroke="#5C2B10" strokeWidth="5" strokeLinecap="round" />
          {/* Chamas */}
          <path d="M 230 270 Q 242 295 238 310 Q 230 315 222 310 Q 218 295 230 270 Z" fill="#EF4444" />
          <path d="M 230 278 Q 238 298 235 310 Q 230 314 225 310 Q 222 298 230 278 Z" fill="#F59E0B" />
          <path d="M 230 290 Q 235 302 233 310 Q 230 312 227 310 Q 225 302 230 290 Z" fill="#FEF08A" />

          {/* Árvores e Folhagens Tropicais */}
          <path d="M 120 350 L 140 210 L 110 240 L 140 180 L 90 220 L 140 130 L 190 220 L 160 180 L 190 240 L 160 210 L 180 350 Z" fill="#14261B" />
          <path d="M 40 350 L 60 230 L 35 255 L 60 195 L 20 235 L 60 150 L 105 235 L 80 195 L 105 255 L 80 230 L 95 350 Z" fill="#0F1F16" />
        </svg>
      </div>

      {/* Guirlanda sutil de luzinhas (Fairy Lights) suspensas */}
      <div className="absolute top-1 left-0 right-0 h-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-12" preserveAspectRatio="none" viewBox="0 0 1000 48">
          <path d="M0,8 Q250,28 500,8 Q750,28 1000,8" fill="none" stroke="#684733" strokeWidth="1.5" />
          {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950].map((cx, i) => (
            <g key={i}>
              <circle cx={cx} cy={i % 2 === 0 ? 14 : 19} r="3.5" fill="#FDE68A" className="animate-pulse" style={{ animationDelay: `${i * 180}ms` }} />
              <circle cx={cx} cy={i % 2 === 0 ? 14 : 19} r="8" fill="#FBBF24" opacity="0.3" />
            </g>
          ))}
        </svg>
      </div>

      {/* Conteúdo do Banner */}
      <div className="relative p-6 sm:p-8 md:p-10 flex flex-col justify-between min-h-[320px]">
        {/* Topo: Selo Afetivo e Ícones */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs tracking-wider uppercase text-[#E6DCD1]/90 font-medium">
          <div className="flex items-center gap-2 bg-[#FAF7F2]/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#FAF7F2]/20 shadow-sm">
            <ChameleonLogo size="sm" animated={true} />
            <span className="font-semibold text-white">Casa Furtacor</span>
            <span className="text-[#FDE68A] hidden sm:inline">· Sob o Luar</span>
          </div>

          <div className="flex items-center gap-2 bg-[#C85A32]/30 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-[#E08A68]/40 text-[#FED7AA]">
            <Heart className="w-3.5 h-3.5 text-[#E08A68] fill-[#E08A68]" />
            <span>Ingresso Afetivo</span>
          </div>
        </div>

        {/* Centro: Título do Evento e Descrição Poética */}
        <div className="my-6 max-w-xl">
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#E08A68] uppercase mb-2 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            Lual no Quintal da Casa Furtacor
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-[#FAF7F2] leading-tight text-balance">
            {evento.titulo}
          </h2>

          {/* Badges de Categorias / Tags no Banner */}
          {evento.tags && evento.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {evento.tags.map((tag, idx) => (
                <EventTagBadge key={`${tag}-${idx}`} tag={tag} size="sm" />
              ))}
            </div>
          )}

          <p className="mt-3 text-sm sm:text-base text-[#E6DCD1] leading-relaxed font-sans font-light">
            {evento.descricao ||
              'Uma noite intimista no quintal da Casa Furtacor sob as árvores, fogueira e luzes quentes. Voz e violão, comidinhas afetivas, brisa paraibana e encontros que aquecem o coração.'}
          </p>
        </div>

        {/* Rodapé do Banner: Coordenadas em Destaque */}
        <div className="pt-4 border-t border-[#FAF7F2]/20 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[#E6DCD1]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E08A68]" />
              <span className="font-semibold text-white">{evento.dataEvento}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E08A68]" />
              <span className="font-semibold text-white">{evento.horario}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E08A68]" />
              <span>{evento.local} • Castelo Branco I</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-[#C85A32] to-[#A34220] text-white px-4 py-2 rounded-full font-serif font-bold text-sm shadow-md">
            <Sparkles className="w-4 h-4 text-[#FDE68A]" />
            <span>R$ {evento.valor.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
