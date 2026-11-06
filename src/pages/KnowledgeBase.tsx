// ========================================================================
// SW Service Desk v1.0 - Base de Conhecimento (KB & Runbooks Técnicos)
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  PlusCircle,
  ThumbsUp,
  ThumbsDown,
  Lock,
  Tag,
  ArrowRight,
  Eye,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.js';
import { KBArticle } from '../types/index.js';

export function KnowledgeBase() {
  const { user } = useAuth();
  const toast = useToast();

  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Formulário de Criação
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [isInternalOnly, setIsInternalOnly] = useState(false);
  const [tags, setTags] = useState('');

  const loadArticles = async (queryText: string = '') => {
    setLoading(true);
    try {
      const data = await api.getKBArticles({ search: queryText });
      setArticles(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar artigos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadArticles(search);
  };

  const handleSelectArticle = async (slug: string) => {
    try {
      const data = await api.getKBArticleBySlug(slug);
      setSelectedArticle(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abrir artigo.');
    }
  };

  const handleVote = async (id: number, helpful: boolean) => {
    try {
      await api.voteKBArticle(id, helpful);
      toast.success('Obrigado pelo seu feedback!');
      if (selectedArticle && selectedArticle.id === id) {
        setSelectedArticle({
          ...selectedArticle,
          helpful_count: helpful ? selectedArticle.helpful_count + 1 : selectedArticle.helpful_count,
          not_helpful_count: !helpful ? selectedArticle.not_helpful_count + 1 : selectedArticle.not_helpful_count,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createKBArticle({
        title,
        summary,
        content,
        categoryId: Number(categoryId),
        isInternalOnly,
        tags,
      });

      toast.success('Artigo técnico publicado com sucesso!');
      setShowCreateModal(false);
      setTitle('');
      setSummary('');
      setContent('');
      setTags('');
      loadArticles();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao publicar artigo.');
    }
  };

  const isTechnician = user && ['agent', 'supervisor', 'admin'].includes(user.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Visualização de Artigo Individual */}
      {selectedArticle ? (
        <div className="space-y-5">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar aos Artigos
          </button>

          <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border">
                  {selectedArticle.category_name}
                </span>
                {selectedArticle.is_internal_only === 1 && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Runbook Interno
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {selectedArticle.view_count} visualizações
                </span>
                <span>&bull;</span>
                <span>Por {selectedArticle.author_name}</span>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                {selectedArticle.title}
              </h1>
              <p className="text-xs text-slate-600 mt-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {selectedArticle.summary}
              </p>
            </div>

            {/* Conteúdo Markdown / Texto */}
            <div className="prose prose-slate max-w-none text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedArticle.content}
            </div>

            {/* Tags e Votação de Utilidade */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {selectedArticle.tags?.split(',').map((t) => (
                  <span key={t} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">
                    #{t.trim()}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-600 font-medium">Este artigo foi útil?</span>
                <button
                  onClick={() => handleVote(selectedArticle.id, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Sim ({selectedArticle.helpful_count})</span>
                </button>
                <button
                  onClick={() => handleVote(selectedArticle.id, false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Não</span>
                </button>
              </div>
            </div>
          </article>
        </div>
      ) : (
        /* Lista de Artigos */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Base de Conhecimento & Procedimentos
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Guias de configuração rápida, resolução de problemas comuns e runbooks técnicos de infraestrutura cloud.
              </p>
            </div>

            {isTechnician && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Criar Artigo Técnico
              </button>
            )}
          </div>

          {/* Barra de Pesquisa */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar por palavras-chave (ex.: VPN, Kubernetes, MFA, email, portas...)"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Pesquisar
              </button>
            </form>
          </div>

          {/* Grid de Artigos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2 p-12 text-center text-slate-400 text-xs">
                A carregar artigos da Base de Conhecimento...
              </div>
            ) : articles.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 text-xs">
                Nenhum artigo encontrado com os termos indicados.
              </div>
            ) : (
              articles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => handleSelectArticle(art.slug)}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border">
                        {art.category_name}
                      </span>
                      {art.is_internal_only === 1 && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Runbook Técnico
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" /> {art.helpful_count} acharam útil
                    </span>
                    <span className="font-semibold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Ler Artigo <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Criar Novo Artigo */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Publicar Novo Artigo na Base de Conhecimento" maxWidth="2xl">
        <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Título do Artigo *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como configurar o cliente OpenVPN no Ubuntu..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="1">Cloud & Infraestrutura</option>
                <option value="2">Hardware & Equipamentos</option>
                <option value="3">Acessos & Software</option>
                <option value="4">Rede & Telecomunicações</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isInternalOnly"
                checked={isInternalOnly}
                onChange={(e) => setIsInternalOnly(e.target.checked)}
                className="rounded border-slate-300 text-amber-600"
              />
              <label htmlFor="isInternalOnly" className="font-semibold text-slate-800 cursor-pointer">
                Artigo de Acesso Interno (Runbook de Técnicos)
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resumo Executivo *</label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Breve sumário do problema e da solução..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Conteúdo Completo (Markdown) *</label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Instruções passo-a-passo, comandos de terminal bash ou configurações necessárias..."
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="vpn, rede, credenciais, aws"
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs"
            >
              Publicar Artigo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
