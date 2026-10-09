import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'md',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-1.5 rounded-xl transition-all cursor-pointer select-none ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm font-medium'
      } ${
        isDark
          ? 'bg-[#2A1F17] hover:bg-[#382B21] text-[#FDE68A] border border-[#4E3A2E] shadow-sm'
          : 'bg-[#FAF7F2] hover:bg-[#EFE7DC] text-[#2C241E] border border-[#DDD3C5] shadow-xs'
      } ${className}`}
      title={isDark ? 'Alternar para Modo Dia' : 'Alternar para Modo Noite no Quintal'}
      aria-label="Alternar tema claro e escuro"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-[#FDE68A] fill-[#FDE68A] transition-transform duration-300 rotate-0" />
        ) : (
          <Sun className="w-4 h-4 text-[#C85A32] transition-transform duration-300 rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="whitespace-nowrap font-medium">
          {isDark ? 'Modo Noite' : 'Modo Dia'}
        </span>
      )}
    </button>
  );
};
