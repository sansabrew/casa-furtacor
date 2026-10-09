import React from 'react';

interface ChameleonLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  animated?: boolean;
}

export const ChameleonLogo: React.FC<ChameleonLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  animated = true,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const textMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
    '2xl': 'text-4xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Ilustração Exclusiva do Camaleão Colorido da Casa Furtacor */}
      <div className={`relative ${sizeMap[size]} shrink-0 ${animated ? 'hover:scale-105 transition-transform duration-300' : ''}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(200,90,50,0.35)]"
        >
          <defs>
            {/* Gradiente Furtacor 1: Corpo */}
            <linearGradient id="chameleonBody" x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#EC4899" /> {/* Pink Furtacor */}
              <stop offset="25%" stopColor="#8B5CF6" /> {/* Violeta */}
              <stop offset="50%" stopColor="#06B6D4" /> {/* Turquesa Tropical */}
              <stop offset="75%" stopColor="#10B981" /> {/* Esmeralda */}
              <stop offset="100%" stopColor="#F59E0B" /> {/* Âmbar Dourado */}
            </linearGradient>

            {/* Gradiente Furtacor 2: Cabeça e Crista */}
            <linearGradient id="chameleonHead" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="50%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#FBBF24" />
            </linearGradient>

            {/* Gradiente da Cauda Espiral */}
            <radialGradient id="tailSpiral" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="40%" stopColor="#06B6D4" />
              <stop offset="80%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </radialGradient>

            {/* Gradiente do Galho de Madeira Acolhedora */}
            <linearGradient id="branchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#543825" />
              <stop offset="100%" stopColor="#87583A" />
            </linearGradient>

            {/* Gradiente das Folhinhas */}
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Filtro de Brilho Sutil */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Galho do Quintal */}
          <path
            d="M8 82 Q45 84 88 78 Q92 77 95 81"
            stroke="url(#branchGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Folhinhas Tropicais brotando do galho */}
          <path
            d="M82 78 Q92 70 96 74 Q94 82 85 80 Z"
            fill="url(#leafGrad)"
          />
          <path
            d="M20 83 Q15 75 12 79 Q14 86 22 84 Z"
            fill="url(#leafGrad)"
          />

          {/* Cauda em Espiral Charmosa do Camaleão */}
          <path
            d="M32 66 C22 66 12 60 12 48 C12 36 24 30 32 30 C38 30 42 34 42 39 C42 43 38 46 34 46 C31 46 29 44 29 42"
            fill="none"
            stroke="url(#tailSpiral)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Corpo do Camaleão com Crista e Curvatura */}
          <path
            d="M30 65 Q45 74 65 66 Q72 58 75 48 Q68 34 50 36 Q34 38 30 65 Z"
            fill="url(#chameleonBody)"
          />

          {/* Cristas e Escamas Decorativas na Costas */}
          <path
            d="M40 37 Q42 32 45 36 Q48 31 51 36 Q55 31 58 37 Q62 33 65 39"
            fill="none"
            stroke="#FED7AA"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Cabeça do Camaleão */}
          <path
            d="M62 48 Q70 32 84 38 Q88 44 86 52 Q82 60 70 58 Z"
            fill="url(#chameleonHead)"
          />

          {/* Crista da Cabeça (Capacete clássico de camaleão) */}
          <path
            d="M66 38 Q74 24 82 32"
            fill="none"
            stroke="#FDE047"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Olho Típico Globular de Camaleão */}
          <circle cx="76" cy="44" r="7" fill="#FEF08A" stroke="#EA580C" strokeWidth="1.5" />
          <circle cx="76" cy="44" r="4.5" fill="#F97316" />
          <circle cx="77" cy="43" r="2.5" fill="#1C1917" />
          {/* Ponto de Luz no Olho */}
          <circle cx="78.5" cy="41.5" r="1.2" fill="#FFFFFF" />

          {/* Patinhas do Camaleão agarradas ao galho */}
          <path
            d="M48 68 Q52 79 50 82 M46 82 Q49 84 54 82"
            stroke="#10B981"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M65 64 Q68 76 68 80 M64 80 Q68 82 72 80"
            stroke="#06B6D4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Escaminhas e Luzes Furtacor (Brilhos mágicos) */}
          <circle cx="48" cy="48" r="1.5" fill="#FEF08A" opacity="0.9" />
          <circle cx="56" cy="52" r="2" fill="#FFFFFF" opacity="0.8" />
          <circle cx="62" cy="46" r="1.5" fill="#F472B6" opacity="0.9" />
          <circle cx="44" cy="58" r="1.5" fill="#A7F3D0" opacity="0.9" />
          <circle cx="54" cy="62" r="1.8" fill="#FDE047" opacity="0.8" />

          {/* Sorriso Acolhedor */}
          <path
            d="M84 49 Q82 53 78 52"
            fill="none"
            stroke="#7C2D12"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Tipografia da Marca com Gradiente Furtacor */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-serif font-black tracking-wider uppercase bg-gradient-to-r from-[#E11D48] via-[#D97706] to-[#0284C7] bg-clip-text text-transparent ${textMap[size]}`}
          >
            CASA FURTACOR
          </span>
          <span className="text-[10px] tracking-widest font-sans font-medium uppercase text-[#8A7869] dark:text-[#C5B5A5] mt-0.5">
            Espaço Cultural & Afetivo
          </span>
        </div>
      )}
    </div>
  );
};
