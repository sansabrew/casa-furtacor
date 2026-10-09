import React, { useState } from 'react';
import {
  Heart,
  QrCode,
  Shield,
  Sparkles,
  User,
  FileText,
  Phone,
  Plus,
  Trash2,
  Users,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Evento, AmigoInscricao } from '../types';
import { formatarDocumento, formatarTelefone } from '../utils/pix';

interface FriendFormProps {
  evento: Evento;
  vagasRestantes: number;
  onSubmit: (amigos: AmigoInscricao[]) => Promise<void>;
  isLoading: boolean;
}

export const FriendForm: React.FC<FriendFormProps> = ({
  evento,
  vagasRestantes,
  onSubmit,
  isLoading,
}) => {
  // Lista de amigos: inicia com o comprador principal
  const [amigos, setAmigos] = useState<AmigoInscricao[]>([
    { nomeCompleto: '', documento: '', whatsapp: '' },
  ]);

  const [erro, setErro] = useState<string | null>(null);

  const valorTotal = evento.valor * amigos.length;
  const maxAmigos = Math.min(4, Math.max(1, vagasRestantes));

  const handleUpdateAmigo = (index: number, campo: keyof AmigoInscricao, valor: string) => {
    setAmigos((prev) => {
      const novaLista = [...prev];
      if (campo === 'documento') {
        novaLista[index] = { ...novaLista[index], [campo]: formatarDocumento(valor) };
      } else if (campo === 'whatsapp') {
        novaLista[index] = { ...novaLista[index], [campo]: formatarTelefone(valor) };
      } else {
        novaLista[index] = { ...novaLista[index], [campo]: valor };
      }
      return novaLista;
    });
    if (erro) setErro(null);
  };

  const handleAdicionarAmigo = () => {
    if (amigos.length >= maxAmigos) return;
    setAmigos((prev) => [
      ...prev,
      { nomeCompleto: '', documento: '', whatsapp: '' },
    ]);
  };

  const handleRemoverAmigo = (index: number) => {
    if (amigos.length <= 1) return;
    setAmigos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar cada amigo individualmente com mensagem clara
    for (let i = 0; i < amigos.length; i++) {
      const amigo = amigos[i];
      const numero = i + 1;

      if (!amigo.nomeCompleto.trim() || amigo.nomeCompleto.trim().length < 3) {
        setErro(`Informe o nome completo do Amigo ${numero} para a lista da portaria.`);
        return;
      }

      const docLimpo = amigo.documento.replace(/\D/g, '');
      if (!docLimpo || docLimpo.length < 5) {
        setErro(`Informe um RG ou CPF válido para o Amigo ${numero}.`);
        return;
      }

      // O comprador principal precisa de telefone válido; para os demais é opcional
      if (i === 0) {
        const telLimpo = (amigo.whatsapp || '').replace(/\D/g, '');
        if (!telLimpo || telLimpo.length < 10) {
          setErro('Informe seu WhatsApp com DDD para envio dos ingressos.');
          return;
        }
      }
    }

    setErro(null);
    await onSubmit(amigos);
  };

  return (
    <div id="cadastro-amigo" className="bg-[#FAF7F2] rounded-3xl border-2 border-[#E6DCD1] p-5 sm:p-7 shadow-sm space-y-5">
      {/* Alerta de Ingressos Limitados */}
      <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block uppercase tracking-wider text-[11px] text-[#C85A32]">
            Ingressos Limitados no Quintal
          </span>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Cada ingresso é <strong>individual e nominal</strong> com QR Code próprio para conferência rápida na portaria.
          </p>
        </div>
      </div>

      {/* Cabeçalho do Card */}
      <div className="border-b border-[#E6DCD1] pb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C85A32]">
          <Heart className="w-3.5 h-3.5 fill-[#C85A32]" />
          <span>Cadastro Simplificado</span>
        </div>
        <h3 className="mt-1 text-xl sm:text-2xl font-serif font-bold text-[#2C241E] leading-tight">
          "Aqui nossos amigos e amigas chegam primeiro."
        </h3>
        <p className="text-xs text-[#6B5A4D] mt-1">
          Preencha quem vai ao evento. O ingresso com QR Code é gerado na hora!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <span className="font-bold">Atenção:</span> {erro}
          </div>
        )}

        {/* Lista de Cadastros de Cada Amigo */}
        <div className="space-y-4">
          {amigos.map((amigo, index) => {
            const isTitular = index === 0;

            return (
              <div
                key={index}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DDD3C5] shadow-xs space-y-3 relative transition-all"
              >
                {/* Cabeçalho do Ingresso Individual */}
                <div className="flex items-center justify-between border-b border-[#F4EDE4] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2C241E] text-white flex items-center justify-center text-xs font-bold font-mono">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#2C241E] block">
                        {isTitular ? 'Ingresso 1 · Titular (Você)' : `Ingresso ${index + 1} · Amigo(a)`}
                      </span>
                      <span className="text-[10px] text-[#8A7869]">
                        1 lugar reservado no evento (R$ {evento.valor.toFixed(2).replace('.', ',')})
                      </span>
                    </div>
                  </div>

                  {!isTitular && (
                    <button
                      type="button"
                      onClick={() => handleRemoverAmigo(index)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium p-1 cursor-pointer"
                      title="Remover este amigo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                {/* Campo: Nome Completo */}
                <div>
                  <label className="block text-xs font-semibold text-[#2C241E] mb-1">
                    Nome Completo {isTitular ? 'do Titular' : 'do Convidado'} <span className="text-[#C85A32]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={amigo.nomeCompleto}
                      onChange={(e) => handleUpdateAmigo(index, 'nomeCompleto', e.target.value)}
                      placeholder={isTitular ? 'Ex: Marina Alencar' : 'Ex: Tiago Medeiros'}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] focus:border-[#C85A32] focus:bg-white rounded-xl text-xs sm:text-sm text-[#2C241E] outline-none transition-all placeholder:text-[#A8988A]"
                    />
                  </div>
                  <span className="text-[10px] text-[#8A7869] mt-0.5 block">
                    Nome que constará na lista de entrada na portaria
                  </span>
                </div>

                {/* Campo: RG ou CPF */}
                <div>
                  <label className="block text-xs font-semibold text-[#2C241E] mb-1">
                    RG ou CPF do Amigo(a) <span className="text-[#C85A32]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={amigo.documento}
                      onChange={(e) => handleUpdateAmigo(index, 'documento', e.target.value)}
                      placeholder="Ex: 000.000.000-00 ou RG"
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] focus:border-[#C85A32] focus:bg-white rounded-xl text-xs sm:text-sm text-[#2C241E] outline-none transition-all placeholder:text-[#A8988A]"
                    />
                  </div>
                  <span className="text-[10px] text-[#8A7869] mt-0.5 block">
                    Para conferência rápida na portaria da casa
                  </span>
                </div>

                {/* Campo: Celular / WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-[#2C241E] mb-1">
                    Celular / WhatsApp {isTitular ? '(Para receber os ingressos)' : '(Opcional)'}
                    {isTitular && <span className="text-[#C85A32]"> *</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8A7869]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required={isTitular}
                      value={amigo.whatsapp || ''}
                      onChange={(e) => handleUpdateAmigo(index, 'whatsapp', e.target.value)}
                      placeholder={isTitular ? '(83) 99999-9999' : 'Deixe em branco se for no seu'}
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] focus:border-[#C85A32] focus:bg-white rounded-xl text-xs sm:text-sm text-[#2C241E] outline-none transition-all placeholder:text-[#A8988A]"
                    />
                  </div>
                  <span className="text-[10px] text-[#8A7869] mt-0.5 block">
                    {isTitular
                      ? 'Enviaremos os vouchers com QR Code direto para este número'
                      : 'Caso não preencha, o ingresso deste amigo será enviado para o titular'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botão para Adicionar Mais Amigos (Ingressos Nominais) */}
        {amigos.length < maxAmigos && (
          <button
            type="button"
            onClick={handleAdicionarAmigo}
            className="w-full py-2.5 px-3 bg-[#EFE7DC] hover:bg-[#E6DCD1] text-[#2C241E] border border-dashed border-[#C85A32]/40 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C85A32]" />
            <span>+ Adicionar Outro Amigo(a) (+ R$ {evento.valor.toFixed(2).replace('.', ',')})</span>
          </button>
        )}

        {/* Resumo Transparente do Pedido */}
        <div className="p-3.5 bg-[#F4EDE4] rounded-2xl border border-[#E6DCD1] flex items-center justify-between text-xs sm:text-sm">
          <div>
            <span className="font-semibold text-[#2C241E]">
              {amigos.length} {amigos.length === 1 ? 'ingresso nominal' : 'ingressos nominais'}
            </span>
            <p className="text-[11px] text-[#8A7869]">
              {amigos.length} {amigos.length === 1 ? 'lugar reservado' : 'lugares reservados'} · Sem taxas de serviço
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8A7869] block">Total PIX:</span>
            <span className="text-xl font-serif font-bold text-[#C85A32]">
              R$ {valorTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Botão de Ação Principal */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-[#C85A32] hover:bg-[#A34220] disabled:bg-[#C85A32]/60 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
        >
          {isLoading ? (
            <span>Gerando Chave PIX...</span>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              <span>
                {amigos.length === 1
                  ? `GERAR PIX (R$ ${valorTotal.toFixed(2).replace('.', ',')})`
                  : `CADASTRAR ${amigos.length} AMIGOS E GERAR PIX (R$ ${valorTotal.toFixed(2).replace('.', ',')})`}
              </span>
            </>
          )}
        </button>

        {/* Garantia Afetiva */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#8A7869] pt-1">
          <Shield className="w-3.5 h-3.5 text-[#5A7156]" />
          <span>Vagas limitadas no quintal · Cada amigo recebe seu QR Code</span>
        </div>
      </form>
    </div>
  );
};
