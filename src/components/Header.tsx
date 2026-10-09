import React from 'react';
import { Home, Ticket, KeyRound, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ChameleonLogo } from './ChameleonLogo';

interface HeaderProps {
  onOpenAdminLogin: () => void;
  onOpenMyTickets: () => void;
  onOpenAbout: () => void;
  hasTickets: boolean;
  isAdminLoggedIn: boolean;
  onOpenAdminDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdminLogin,
  onOpenMyTickets,
  onOpenAbout,
  hasTickets,
  isAdminLoggedIn,
  onOpenAdminDashboard,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DCD1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Logomarca Oficial do Camaleão Colorido da Casa Furtacor */}
        <a
          href="#topo"
          className="flex items-center gap-2 hover:opacity-95 transition-opacity"
          title="Casa Furtacor — Início"
        >
          <ChameleonLogo size="md" showText={true} />
        </a>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#6B5A4D]">
          <a href="#evento" className="hover:text-[#2C241E] transition-colors">
            Agenda Cultural
          </a>
          <button
            onClick={onOpenAbout}
            className="hover:text-[#2C241E] transition-colors cursor-pointer"
          >
            Sobre a Casa
          </button>
          <a
            href="https://www.instagram.com/casafurtacor/"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-[#2C241E] transition-colors flex items-center gap-1"
          >
            <span>Instagram</span>
          </a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Seletor de Tema Noturno / Diurno */}
          <ThemeToggle size="sm" />

          {hasTickets && (
            <button
              onClick={onOpenMyTickets}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#2C241E] bg-[#EFE7DC] hover:bg-[#E6DCD1] border border-[#DDD3C5] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 text-[#C85A32]" />
              <span className="hidden xs:inline">Meus</span> Ingressos
            </button>
          )}

          {isAdminLoggedIn ? (
            <button
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#5A7156] hover:bg-[#4B6048] rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel da Mãe</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-[#2C241E] hover:bg-[#43372F] rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
              title="Acesso da Mãe e Portaria"
            >
              <Home className="w-3.5 h-3.5 text-[#E08A68]" />
              <span>Área da Casa</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
