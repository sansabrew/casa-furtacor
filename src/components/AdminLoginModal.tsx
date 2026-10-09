import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound, Heart } from 'lucide-react';
import { authService } from '../services/authService';
import { ChameleonLogo } from './ChameleonLogo';

interface AdminLoginModalProps {
  onLoginSuccess: () => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const resultado = await authService.entrar(email, senha);
      if (resultado.sucesso) {
        onLoginSuccess();
      } else {
        setErro(resultado.mensagem);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-6">
        {/* Topo Acolhedor com Logo do Camaleão */}
        <div className="bg-[#2C241E] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <ChameleonLogo size="md" animated={false} />
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#E08A68] font-semibold">
                <Heart className="w-3.5 h-3.5 fill-[#E08A68]" />
                <span>Acesso da Casa</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mt-0.5">
                Área da Portaria
              </h3>
              <p className="text-xs text-[#D6CEBE]">
                Controle de presença e novos eventos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Login por E-mail e Senha (Supabase Auth) */}
        <div className="p-6 space-y-4">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                E-mail de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu e-mail de acesso"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-sm text-[#2C241E] placeholder:text-[#A8988A] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl text-sm text-[#2C241E] placeholder:text-[#A8988A] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 px-4 bg-[#2C241E] hover:bg-[#43372F] disabled:bg-[#2C241E]/60 text-white font-medium rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <KeyRound className="w-4 h-4 text-[#E08A68]" />
              <span>{carregando ? 'Entrando...' : 'Entrar no Painel Furtacor'}</span>
            </button>
          </form>

          <p className="text-[11px] text-[#8A7869] text-center leading-relaxed">
            Acesso restrito à administração da Casa. Crie o usuário da portaria no painel do
            Supabase (Authentication &gt; Users).
          </p>
        </div>
      </div>
    </div>
  );
};
