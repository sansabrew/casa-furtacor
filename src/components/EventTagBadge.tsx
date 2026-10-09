import React from 'react';
import { Music, Utensils, Sparkles, Moon, Palette, BookOpen, Heart, Tag } from 'lucide-react';

interface EventTagBadgeProps {
  tag: string;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

// Mapeamento de estilos visuais e ícones para categorias comuns da Casa Furtacor
export function getTagConfig(tag: string) {
  const t = tag.trim().toLowerCase();

  if (t.includes('músic') || t.includes('acústic') || t.includes('som') || t.includes('show')) {
    return {
      classes: 'bg-purple-100 text-purple-900 border-purple-200/80 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800/60',
      dotColor: 'bg-purple-500',
      icon: Music,
    };
  }
  if (t.includes('gastro') || t.includes('comid') || t.includes('café') || t.includes('culinár') || t.includes('bebida')) {
    return {
      classes: 'bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800/60',
      dotColor: 'bg-amber-500',
      icon: Utensils,
    };
  }
  if (t.includes('work') || t.includes('oficina') || t.includes('curso') || t.includes('aula') || t.includes('aprender')) {
    return {
      classes: 'bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800/60',
      dotColor: 'bg-emerald-500',
      icon: Sparkles,
    };
  }
  if (t.includes('luau') || t.includes('sarau') || t.includes('noite') || t.includes('lua')) {
    return {
      classes: 'bg-rose-100 text-rose-900 border-rose-200/80 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800/60',
      dotColor: 'bg-rose-500',
      icon: Moon,
    };
  }
  if (t.includes('arte') || t.includes('cultur') || t.includes('exposiç') || t.includes('pintur')) {
    return {
      classes: 'bg-cyan-100 text-cyan-900 border-cyan-200/80 dark:bg-cyan-950/70 dark:text-cyan-200 dark:border-cyan-800/60',
      dotColor: 'bg-cyan-500',
      icon: Palette,
    };
  }
  if (t.includes('poesia') || t.includes('livro') || t.includes('literat')) {
    return {
      classes: 'bg-indigo-100 text-indigo-900 border-indigo-200/80 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-800/60',
      dotColor: 'bg-indigo-500',
      icon: BookOpen,
    };
  }

  // Paleta fallback acolhedora (terracota / areia)
  return {
    classes: 'bg-[#F4EDE4] text-[#8C3D1E] border-[#E08A68]/40 dark:bg-[#34241A] dark:text-[#F3B39B] dark:border-[#5C3D2E]',
    dotColor: 'bg-[#C85A32]',
    icon: Tag,
  };
}

export const EventTagBadge: React.FC<EventTagBadgeProps> = ({ tag, size = 'sm', onRemove }) => {
  const config = getTagConfig(tag);
  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs font-semibold'
      : 'px-3 py-1 text-xs sm:text-sm font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs transition-all ${sizeClasses} ${config.classes}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-current opacity-70 hover:opacity-100 cursor-pointer"
          title={`Remover ${tag}`}
          aria-label={`Remover tag ${tag}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};
