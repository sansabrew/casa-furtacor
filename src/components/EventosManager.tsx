import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  DollarSign,
  Image as ImageIcon,
  PlusCircle,
  Sparkles,
  CheckCircle,
  Trash2,
  Edit3,
  Star,
  Upload,
  Link as LinkIcon,
  X,
  MapPin,
  Users,
  Eye,
  Tag,
} from 'lucide-react';
import { Evento } from '../types';
import { storage } from '../services/storageService';
import { EventTagBadge } from './EventTagBadge';

interface EventosManagerProps {
  onRefreshData: () => void;
}

export const SUGESTOES_TAGS = [
  'Música',
  'Gastronomia',
  'Workshop',
  'Luau & Sarau',
  'Arte & Cultura',
  'Feirinha',
  'Poesia',
  'Convivência',
];

// 4 Imagens curadas de alta qualidade para o ambiente acolhedor da Casa Furtacor
export const BANNER_PRESETS = [
  {
    nome: 'Luzes no Quintal & Luau',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=1200&auto=format&fit=crop',
    tag: 'Luau',
  },
  {
    nome: 'Voz, Violão & Cordas',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    tag: 'Acústico',
  },
  {
    nome: 'Café & Jardim Cultural',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop',
    tag: 'Convivência',
  },
  {
    nome: 'Sarau & Velas no Chão',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    tag: 'Intimista',
  },
];

export const EventosManager: React.FC<EventosManagerProps> = ({ onRefreshData }) => {
  const [eventos, setEventos] = useState<Evento[]>(() => storage.getEventos());
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEmEdicao, setEventoEmEdicao] = useState<Evento | null>(null);

  // Campos do formulário
  const [titulo, setTitulo] = useState('');
  const [valor, setValor] = useState('20.00');
  const [descricao, setDescricao] = useState('');
  const [imagemUrl, setImagemUrl] = useState(BANNER_PRESETS[0].url);
  const [dataEvento, setDataEvento] = useState('14 de Novembro de 2026');
  const [horario, setHorario] = useState('19:00h');
  const [capacidadeMaxima, setCapacidadeMaxima] = useState('50');
  const [local, setLocal] = useState('Casa Furtacor');
  const [endereco, setEndereco] = useState(
    'Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB'
  );
  const [tornarAtivo, setTornarAtivo] = useState(true);
  const [tags, setTags] = useState<string[]>(['Música', 'Gastronomia', 'Luau & Sarau']);
  const [inputTag, setInputTag] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);

  const mostrarFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const recarregar = () => {
    setEventos(storage.getEventos());
    onRefreshData();
  };

  const handleAdicionarTag = (valor: string) => {
    const limpa = valor.trim();
    if (!limpa) return;
    if (!tags.some((t) => t.toLowerCase() === limpa.toLowerCase())) {
      setTags([...tags, limpa]);
    }
    setInputTag('');
  };

  const handleRemoverTag = (tagParaRemover: string) => {
    setTags(tags.filter((t) => t.toLowerCase() !== tagParaRemover.toLowerCase()));
  };

  const handleToggleSugestao = (sug: string) => {
    if (tags.some((t) => t.toLowerCase() === sug.toLowerCase())) {
      handleRemoverTag(sug);
    } else {
      setTags([...tags, sug]);
    }
  };

  // Abrir modal para novo cadastro
  const handleAbrirNovo = () => {
    setEventoEmEdicao(null);
    setTitulo('');
    setValor('20.00');
    setDescricao(
      'Uma noite intimista no quintal da Casa Furtacor sob as árvores e luzes quentes. Voz e violão, comidinhas afetivas e encontros que aquecem o coração.'
    );
    setImagemUrl(BANNER_PRESETS[0].url);
    setDataEvento('14 de Novembro de 2026');
    setHorario('19:30h');
    setCapacidadeMaxima('50');
    setLocal('Casa Furtacor');
    setEndereco('Av. São Rafael, 376 - Castelo Branco I, João Pessoa - PB');
    setTags(['Música', 'Gastronomia', 'Luau & Sarau']);
    setInputTag('');
    setTornarAtivo(true);
    setModalAberto(true);
  };

  // Abrir modal para editar evento existente
  const handleAbrirEditar = (evt: Evento) => {
    setEventoEmEdicao(evt);
    setTitulo(evt.titulo);
    setValor(evt.valor.toString());
    setDescricao(evt.descricao || '');
    setImagemUrl(evt.imagemUrl || BANNER_PRESETS[0].url);
    setDataEvento(evt.dataEvento);
    setHorario(evt.horario);
    setCapacidadeMaxima(evt.capacidadeMaxima.toString());
    setLocal(evt.local);
    setEndereco(evt.endereco);
    setTags(evt.tags && evt.tags.length > 0 ? [...evt.tags] : ['Música', 'Gastronomia']);
    setInputTag('');
    setTornarAtivo(evt.ativo);
    setModalAberto(true);
  };

  // Salvar (criação ou edição)
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const valorNum = parseFloat(valor.replace(',', '.')) || 20.0;
    const capacidadeNum = parseInt(capacidadeMaxima, 10) || 50;

    if (eventoEmEdicao) {
      // Atualizar existente
      storage.updateEvento(
        {
          titulo: titulo.trim(),
          valor: valorNum,
          descricao: descricao.trim(),
          imagemUrl: imagemUrl.trim(),
          dataEvento: dataEvento.trim(),
          horario: horario.trim(),
          capacidadeMaxima: capacidadeNum,
          local: local.trim(),
          endereco: endereco.trim(),
          tags,
          ativo: tornarAtivo,
        },
        eventoEmEdicao.id
      );

      if (tornarAtivo) {
        storage.setEventoAtivo(eventoEmEdicao.id);
      }
      mostrarFeedback(`Evento "${titulo}" atualizado com sucesso!`);
    } else {
      // Criar novo
      const novo = storage.criarNovoEvento({
        titulo: titulo.trim(),
        valor: valorNum,
        descricao: descricao.trim(),
        imagemUrl: imagemUrl.trim(),
        dataEvento: dataEvento.trim(),
        horario: horario.trim(),
        capacidadeMaxima: capacidadeNum,
        local: local.trim(),
        endereco: endereco.trim(),
        tags,
        ativo: tornarAtivo,
      });

      mostrarFeedback(
        `Novo evento "${novo.titulo}" cadastrado com sucesso! ${
          tornarAtivo ? 'Já está ativo na página principal.' : ''
        }`
      );
    }

    setModalAberto(false);
    recarregar();
  };

  // Ativar evento na home page
  const handleAtivar = (id: string, nome: string) => {
    storage.setEventoAtivo(id);
    mostrarFeedback(`O evento "${nome}" agora é o evento oficial na página principal!`);
    recarregar();
  };

  // Excluir evento
  const handleExcluir = (id: string, nome: string) => {
    if (eventos.length <= 1) {
      alert('Não é possível excluir o único evento cadastrado na casa.');
      return;
    }
    if (window.confirm(`Tem certeza que deseja remover o evento "${nome}"?`)) {
      storage.excluirEvento(id);
      mostrarFeedback(`Evento "${nome}" removido.`);
      recarregar();
    }
  };

  // Upload de imagem local
  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagemUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Topo da Aba de Gestão de Eventos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#DDD3C5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-[#C85A32]">
            <Sparkles className="w-4 h-4" />
            <span>Programação da Casa Furtacor</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#2C241E] mt-1">
            Gestão & Cadastro de Novos Eventos
          </h3>
          <p className="text-xs sm:text-sm text-[#6B5A4D] mt-0.5">
            Cadastre novos encontros intimistas, defina valores, fotos de banner e descrições afetivas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAbrirNovo}
          className="px-5 py-3 bg-[#C85A32] hover:bg-[#A34220] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Cadastrar Novo Evento</span>
        </button>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      {/* Grid de Eventos Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {eventos.map((evt) => (
          <div
            key={evt.id}
            className={`bg-white rounded-2xl border-2 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
              evt.ativo
                ? 'border-[#C85A32] ring-2 ring-[#C85A32]/20'
                : 'border-[#E6DCD1]'
            }`}
          >
            {/* Imagem do Banner do Evento */}
            <div className="relative aspect-video sm:aspect-21/9 bg-[#2C241E] overflow-hidden">
              {evt.imagemUrl ? (
                <img
                  src={evt.imagemUrl}
                  alt={evt.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#A8988A] text-xs">
                  Sem foto banner
                </div>
              )}

              {/* Degradê sobre a foto */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Badge de Ativo / Programação */}
              <div className="absolute top-3 left-3">
                {evt.ativo ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Ativo na Página Principal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/60 text-white/90 text-[11px] font-medium uppercase tracking-wider rounded-full backdrop-blur-xs">
                    Programação Futura
                  </span>
                )}
              </div>

              {/* Tag de Preço no Banner */}
              <div className="absolute bottom-3 right-3 bg-[#FAF7F2] text-[#2C241E] px-3 py-1 rounded-xl shadow-md border border-[#E6DCD1]">
                <span className="text-[10px] text-[#8A7869] block leading-none">Ingresso</span>
                <span className="text-base font-serif font-bold text-[#C85A32]">
                  R$ {evt.valor.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="text-lg sm:text-xl font-serif font-bold text-[#2C241E] leading-snug">
                  {evt.titulo}
                </h4>
                {evt.tags && evt.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {evt.tags.map((t, idx) => (
                      <EventTagBadge key={`${t}-${idx}`} tag={t} size="sm" />
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-[#6B5A4D] line-clamp-2 leading-relaxed">
                  {evt.descricao}
                </p>
              </div>

              {/* Meta informações */}
              <div className="grid grid-cols-2 gap-2 text-xs text-[#6B5A4D] pt-2 border-t border-[#F4EDE4]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>{evt.dataEvento}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>{evt.horario}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <Users className="w-3.5 h-3.5 text-[#5A7156]" />
                  <span>Capacidade: até {evt.capacidadeMaxima} amigos no quintal</span>
                </div>
              </div>

              {/* Barra de Ações */}
              <div className="pt-3 border-t border-[#E6DCD1] flex flex-wrap items-center justify-between gap-2">
                <div>
                  {!evt.ativo ? (
                    <button
                      type="button"
                      onClick={() => handleAtivar(evt.id, evt.titulo)}
                      className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F4EDE4] text-[#C85A32] border border-[#C85A32]/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Definir como evento visível para compra"
                    >
                      <Star className="w-3.5 h-3.5 fill-[#C85A32]" />
                      <span>Ativar na Home</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Em destaque
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAbrirEditar(evt)}
                    className="p-2 text-[#6B5A4D] hover:text-[#2C241E] hover:bg-[#F4EDE4] rounded-lg transition-colors cursor-pointer"
                    title="Editar informações do evento"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {eventos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleExcluir(evt.id, evt.titulo)}
                      className="p-2 text-[#8A7869] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir evento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ================= MODAL DE CADASTRO / EDIÇÃO DE EVENTO ================= */}
      {modalAberto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-3xl border border-[#E6DCD1] shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="bg-[#2C241E] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#C85A32] flex items-center justify-center text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                    {eventoEmEdicao ? 'Editar Evento' : 'Cadastrar Novo Evento'}
                  </h4>
                  <p className="text-[11px] text-[#D6CEBE]">
                    Preencha os dados e escolha a foto do banner
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-[#D6CEBE] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário com Scroll */}
            <form onSubmit={handleSalvar} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
              {/* Campo: Título */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                  Título do Evento <span className="text-[#C85A32]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Luau dos Librianos, Noite do Vinho e Cordas..."
                  className="w-full p-3 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none font-medium text-sm text-[#2C241E] placeholder:text-[#A8988A]"
                />
              </div>

              {/* Campo: Categorias / Tags do Evento */}
              <div className="p-4 bg-[#FAF7F2] dark:bg-[#201711] rounded-2xl border border-[#DDD3C5] dark:border-[#3C2C22] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] dark:text-[#FAF7F2] text-xs flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Categorias / Tags do Evento</span>
                  </label>
                  <span className="text-[11px] text-[#8A7869] dark:text-[#A8988A]">
                    Ex: Música, Gastronomia, Workshop
                  </span>
                </div>

                {/* Badges das tags selecionadas com botão de remoção */}
                {tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-[#271C14] rounded-xl border border-[#E6DCD1] dark:border-[#4A372A]">
                    {tags.map((tag, idx) => (
                      <EventTagBadge
                        key={`${tag}-${idx}`}
                        tag={tag}
                        size="sm"
                        onRemove={() => handleRemoverTag(tag)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8A7869] italic px-1">
                    Nenhuma tag selecionada ainda. Escolha sugestões abaixo ou adicione uma nova.
                  </p>
                )}

                {/* Input para adicionar nova tag personalizada */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputTag}
                    onChange={(e) => setInputTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarTag(inputTag);
                      }
                    }}
                    placeholder="Adicionar categoria (ex: Workshop, Poesia, Feirinha)..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#271C14] border border-[#DDD3C5] dark:border-[#4A372A] focus:border-[#C85A32] rounded-xl outline-none text-xs sm:text-sm text-[#2C241E] dark:text-[#FAF7F2] placeholder:text-[#A8988A]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAdicionarTag(inputTag)}
                    className="px-3.5 py-2 bg-[#C85A32] hover:bg-[#A34220] text-white rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Sugestões Rápidas clicáveis */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A7869] dark:text-[#A8988A] block mb-1.5">
                    Sugestões rápidas da Casa:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SUGESTOES_TAGS.map((sug) => {
                      const selecionada = tags.some((t) => t.toLowerCase() === sug.toLowerCase());
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => handleToggleSugestao(sug)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                            selecionada
                              ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-xs'
                              : 'bg-white dark:bg-[#2A1F17] text-[#6B5A4D] dark:text-[#CDBEB0] border-[#DDD3C5] dark:border-[#4A372A] hover:border-[#C85A32]'
                          }`}
                        >
                          {selecionada ? `✓ ${sug}` : `+ ${sug}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preço e Capacidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    Preço do Ingresso (R$) <span className="text-[#C85A32]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#8A7869]">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      required
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="20.00"
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none font-semibold text-sm text-[#2C241E]"
                    />
                  </div>
                  <span className="text-[10px] text-[#8A7869] mt-0.5 block">
                    Valor cobrado via PIX para cada amigo
                  </span>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    Capacidade Máxima (Pessoas) <span className="text-[#C85A32]">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    required
                    value={capacidadeMaxima}
                    onChange={(e) => setCapacidadeMaxima(e.target.value)}
                    placeholder="50"
                    className="w-full p-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-sm text-[#2C241E]"
                  />
                  <span className="text-[10px] text-[#8A7869] mt-0.5 block">
                    Limite seguro de convidados no quintal
                  </span>
                </div>
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    Data do Encontro <span className="text-[#C85A32]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dataEvento}
                    onChange={(e) => setDataEvento(e.target.value)}
                    placeholder="Ex: 10 de Outubro de 2026 ou 2026-10-10"
                    className="w-full p-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-sm text-[#2C241E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                    Horário de Início <span className="text-[#C85A32]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="Ex: 19:00h"
                    className="w-full p-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-sm text-[#2C241E]"
                  />
                </div>
              </div>

              {/* Descrição Afetiva */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                  Descrição Afetiva do Evento <span className="text-[#C85A32]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Conte o que os amigos vão encontrar: voz e violão, clima acolhedor, comidinhas..."
                  className="w-full p-3 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-sm text-[#2C241E] placeholder:text-[#A8988A]"
                />
              </div>

              {/* SEÇÃO DA FOTO / BANNER DO EVENTO */}
              <div className="p-4 bg-white rounded-2xl border border-[#DDD3C5] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold uppercase tracking-wider text-[#2C241E] text-xs">
                    Foto / Banner do Evento
                  </label>
                  <span className="text-[11px] text-[#8A7869]">
                    Aparece no topo do site e nos bilhetes
                  </span>
                </div>

                {/* Preview em tempo real da imagem */}
                <div className="relative aspect-21/9 w-full bg-[#2C241E] rounded-xl overflow-hidden border border-[#DDD3C5] shadow-inner">
                  {imagemUrl ? (
                    <img
                      src={imagemUrl}
                      alt="Prévia do Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8A7869] text-xs">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span>Nenhuma imagem selecionada</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] rounded-md font-mono flex items-center gap-1">
                    <Eye className="w-3 h-3 text-[#FDE68A]" />
                    <span>Prévia do Banner</span>
                  </div>
                </div>

                {/* 4 Presets de Fotos Afetivas da Casa */}
                <div>
                  <span className="text-[11px] font-semibold text-[#8A7869] block mb-1.5">
                    Sugestões de fotos temáticas da Casa Furtacor:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImagemUrl(p.url)}
                        className={`group relative rounded-xl overflow-hidden border-2 text-left cursor-pointer transition-all aspect-video ${
                          imagemUrl === p.url
                            ? 'border-[#C85A32] ring-2 ring-[#C85A32]/30'
                            : 'border-[#DDD3C5] hover:border-[#8A7869]'
                        }`}
                      >
                        <img
                          src={p.url}
                          alt={p.nome}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                          <span className="text-[10px] text-white font-medium leading-tight line-clamp-1">
                            {p.nome}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Opções de Upload ou URL Personalizada */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FAF7F2] hover:bg-[#F4EDE4] border border-[#DDD3C5] rounded-xl text-xs font-medium text-[#2C241E] cursor-pointer transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Carregar Foto do Computador / Celular</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadFoto}
                      className="hidden"
                    />
                  </label>

                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7869]" />
                    <input
                      type="url"
                      value={imagemUrl}
                      onChange={(e) => setImagemUrl(e.target.value)}
                      placeholder="Ou cole o link direto da foto (https://...)"
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#DDD3C5] rounded-xl text-xs outline-none focus:border-[#C85A32]"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-[#2C241E] mb-1">
                  Endereço do Local
                </label>
                <input
                  type="text"
                  required
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#DDD3C5] focus:border-[#C85A32] rounded-xl outline-none text-sm text-[#2C241E]"
                />
              </div>

              {/* Toggle de Ativação Imediata */}
              <div className="p-3.5 bg-[#F4EDE4] rounded-2xl border border-[#E6DCD1] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#2C241E] block">
                    Definir como Evento Ativo na Home Page
                  </span>
                  <span className="text-[11px] text-[#8A7869]">
                    Se marcado, a página principal passará a vender ingressos deste evento na hora.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={tornarAtivo}
                  onChange={(e) => setTornarAtivo(e.target.checked)}
                  className="w-5 h-5 accent-[#C85A32] cursor-pointer"
                />
              </div>

              {/* Botões do Rodapé do Modal */}
              <div className="pt-3 border-t border-[#E6DCD1] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#8A7869] hover:text-[#2C241E] cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C85A32] hover:bg-[#A34220] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{eventoEmEdicao ? 'Salvar Alterações' : 'Salvar e Publicar Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
