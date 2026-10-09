import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  ExternalLink,
  ShieldCheck,
  Coffee,
  Music2,
  Timer,
  Flame,
} from 'lucide-react';
import { Evento, PortariaStats } from '../types';
import { EventTagBadge } from './EventTagBadge';

interface EventCardProps {
  evento: Evento;
  stats: PortariaStats;
  onScrollToForm: () => void;
}

function parseEventTargetDate(dataStr: string, horaStr: string): Date {
  const currentYear = 2026;
  const timeMatch = (horaStr || '').match(/(\d{1,2}):?(\d{2})?/);
  const hours = timeMatch ? parseInt(timeMatch[1], 10) : 19;
  const minutes = timeMatch && timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;

  // Formato ISO: YYYY-MM-DD
  const isoMatch = (dataStr || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10), hours, minutes, 0);
  }

  // Formato BR: DD/MM/YYYY
  const brMatch = (dataStr || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    return new Date(parseInt(brMatch[3], 10), parseInt(brMatch[2], 10) - 1, parseInt(brMatch[1], 10), hours, minutes, 0);
  }

  // Formato textual em português: "10 de Outubro de 2026"
  const meses: Record<string, number> = {
    janeiro: 0,
    fevereiro: 1,
    marco: 2,
    março: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11,
  };

  const textMatch = (dataStr || '').toLowerCase().match(/(\d{1,2})\s*(?:de|\/)\s*([a-zçã]+)(?:\s*(?:de|\/)\s*(\d{4}))?/);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const mesStr = textMatch[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const month = meses[mesStr] !== undefined ? meses[mesStr] : 9;
    const year = textMatch[3] ? parseInt(textMatch[3], 10) : currentYear;
    return new Date(year, month, day, hours, minutes, 0);
  }

  // Fallback padrão: 10 de Outubro de 2026 às 19:00
  return new Date(2026, 9, 10, 19, 0, 0);
}

function calculateTimeLeft(dataStr: string, horaStr: string) {
  const target = parseEventTargetDate(dataStr, horaStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: false };
}

export const EventCard: React.FC<EventCardProps> = ({ evento, stats, onScrollToForm }) => {
  const vagasRestantes = Math.max(0, evento.capacidadeMaxima - stats.totalPagos);
  const percentualOcupado = Math.min(100, Math.round((stats.totalPagos / evento.capacidadeMaxima) * 100));

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(evento.dataEvento, evento.horario));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(evento.dataEvento, evento.horario));
    }, 1000);
    return () => clearInterval(timer);
  }, [evento.dataEvento, evento.horario]);

  // Link direto para o Google Maps com o endereço da Casa Furtacor
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    'Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB, Casa Furtacor'
  )}`;

  return (
    <div className="bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow space-y-6">
      {/* Kicker editorial */}
      <div className="flex items-center justify-between text-xs text-[#8A7869] font-medium pb-4 border-b border-[#E6DCD1]">
        <div className="flex items-center gap-2">
          <span>Temporada Primavera 2026</span>
          <span aria-hidden="true">·</span>
          <span>João Pessoa, PB</span>
        </div>
        <span className="text-[#C85A32] font-semibold tracking-wide">
          {vagasRestantes > 0 ? `Restam ${vagasRestantes} vagas` : 'Vagas Esgotadas'}
        </span>
      </div>

      {/* Título & Detalhes Principais */}
      <div>
        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2C241E] leading-snug">
          {evento.titulo}
        </h3>

        {/* Badges coloridas de tags/categorias */}
        {evento.tags && evento.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 mb-1">
            {evento.tags.map((tag, idx) => (
              <EventTagBadge key={`${tag}-${idx}`} tag={tag} size="sm" />
            ))}
          </div>
        )}

        <p className="mt-2.5 text-sm text-[#6B5A4D] leading-relaxed">
          {evento.descricao}
        </p>
      </div>

      {/* Visual Countdown Timer (Dias, Horas, Minutos e Segundos) */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-[#F4EDE4] via-[#FBF7F0] to-[#EFE7DC] rounded-2xl border-2 border-[#E08A68]/30 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C85A32]">
            <Timer className="w-4 h-4 text-[#C85A32] animate-pulse" />
            <span>Contagem Regressiva para o Início</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#78350F] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A]">
            <Flame className="w-3 h-3 text-[#D97706]" />
            <span>Poucas vagas restantes</span>
          </div>
        </div>

        {timeLeft.isPast ? (
          <div className="p-3 bg-white/80 rounded-xl text-center text-xs font-medium text-[#2C241E]">
            🎉 O evento está acontecendo ou já começou! Consulte a portaria da Casa Furtacor.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            {/* Bloco Dias */}
            <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-[#E6DCD1] shadow-xs">
              <span className="block text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#2C241E] tabular-nums leading-none">
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-[#8A7869] mt-1.5 block">
                {timeLeft.days === 1 ? 'Dia' : 'Dias'}
              </span>
            </div>

            {/* Bloco Horas */}
            <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-[#E6DCD1] shadow-xs">
              <span className="block text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#2C241E] tabular-nums leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-[#8A7869] mt-1.5 block">
                {timeLeft.hours === 1 ? 'Hora' : 'Horas'}
              </span>
            </div>

            {/* Bloco Minutos */}
            <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-[#E6DCD1] shadow-xs">
              <span className="block text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#2C241E] tabular-nums leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-[#8A7869] mt-1.5 block">
                {timeLeft.minutes === 1 ? 'Minuto' : 'Minutos'}
              </span>
            </div>

            {/* Bloco Segundos com pulso sutil */}
            <div className="bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-[#E6DCD1] shadow-xs">
              <span className="block text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#C85A32] tabular-nums leading-none">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-medium tracking-wider text-[#C85A32] mt-1.5 block">
                Segundos
              </span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-center text-[#8A7869] mt-2.5">
          Os portões abrem 30 minutos antes do horário oficial para recepção e acomodação.
        </p>
      </div>

      {/* Grid de Informações Chave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex items-start gap-3 p-3.5 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]/60">
          <Calendar className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#2C241E]">Data do Encontro</p>
            <p className="text-xs sm:text-sm text-[#6B5A4D]">{evento.dataEvento}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]/60">
          <Clock className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#2C241E]">Horário de Início</p>
            <p className="text-xs sm:text-sm text-[#6B5A4D]">{evento.horario} (Portões às 18:30h)</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 bg-[#F4EDE4] rounded-xl border border-[#E6DCD1]/60 sm:col-span-2">
          <MapPin className="w-5 h-5 text-[#C85A32] shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#2C241E]">{evento.local}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-[#C85A32] hover:underline flex items-center gap-1 font-medium"
              >
                Abrir Mapa <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs sm:text-sm text-[#6B5A4D]">{evento.endereco}</p>
          </div>
        </div>
      </div>

      {/* Experiências inclusas */}
      <div className="pt-2 border-t border-[#E6DCD1] text-xs text-[#6B5A4D]">
        <p className="font-semibold text-[#2C241E] mb-2.5 uppercase tracking-wider text-[11px]">
          O que preparamos com carinho para você:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Music2 className="w-3.5 h-3.5 text-[#5A7156]" />
            <span>Música acústica intimista</span>
          </div>
          <div className="flex items-center gap-2">
            <Coffee className="w-3.5 h-3.5 text-[#5A7156]" />
            <span>Boas-vindas afetivas</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#5A7156]" />
            <span>Máx. {evento.capacidadeMaxima} pessoas</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5A7156]" />
            <span>Entrada rápida com QR Code</span>
          </div>
        </div>
      </div>

      {/* Barra de Ocupação & CTA */}
      <div className="pt-4 border-t border-[#E6DCD1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-[#8A7869]">Valor do Ingresso:</span>
            <span className="text-2xl font-serif font-bold text-[#2C241E]">
              R$ {evento.valor.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-xs text-[#8A7869] mt-0.5">
            {stats.totalPagos} amigos confirmados · {percentualOcupado}% ocupado
          </p>
        </div>

        <button
          onClick={onScrollToForm}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#C85A32] hover:bg-[#A34220] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Garantir Meu Lugar</span>
        </button>
      </div>
    </div>
  );
};
