// ========================================================================
// SW Service Desk v1.0 - Módulo de Assistência de IA Privada para Técnicos
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Search,
  BookOpen,
  ArrowRight,
  Send,
  Ticket as TicketIcon,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';

export function AIAssistantView() {
  const { setActiveView, setSelectedTicketId } = useAuth();
  const toast = useToast();

  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketIdForAi, setSelectedTicketIdForAi] = useState<number | string>('');
  const [ticketSummary, setTicketSummary] = useState<any>(null);
  const [draftResponse, setDraftResponse] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Workbench de Classificação
  const [triageTitle, setTriageTitle] = useState('');
  const [triageDesc, setTriageDesc] = useState('');
  const [triageResult, setTriageResult] = useState<any>(null);

  // Pesquisa Semântica na KB
  const [kbQuery, setKbQuery] = useState('');
  const [kbResults, setKbResults] = useState<any[]>([]);

  useEffect(() => {
    api.getTickets({ limit: 30 }).then((res) => {
      setTickets(res.data || []);
      if (res.data?.[0]) {
        setSelectedTicketIdForAi(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleGenerateSummary = async () => {
    if (!selectedTicketIdForAi) return;
    setLoadingAction('summary');
    try {
      const res = await api.aiSummarizeTicket(Number(selectedTicketIdForAi));
      setTicketSummary(res);
      toast.success('Resumo do ticket gerado com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar resumo.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedTicketIdForAi) return;
    setLoadingAction('draft');
    try {
      const res = await api.aiSuggestResponse(Number(selectedTicketIdForAi));
      setDraftResponse(res.draftResponse);
      toast.success('Rascunho de resposta sugerido com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sugerir resposta.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageTitle && !triageDesc) return;
    setLoadingAction('triage');
    try {
      const res = await api.aiSuggestClassification(triageTitle, triageDesc);
      setTriageResult(res);
      toast.success('Classificação sugerida pela IA.');
    } catch (err: any) {
      toast.error(err.message || 'Erro na classificação.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleKbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbQuery.trim()) return;
    setLoadingAction('kb');
    try {
      const res = await api.aiSearchKB(kbQuery);
      setKbResults(res);
      toast.info(`Encontrados ${res.length} artigos relevantes.`);
    } catch (err: any) {
      toast.error(err.message || 'Erro na pesquisa KB.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Institucional de Conformidade e Confirmação Humana */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-700/50 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            SW Cloud Solutions &bull; Assistente Técnico Gemini AI
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Módulo de Inteligência Artificial Privada para Técnicos
          </h1>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Ferramenta auxiliar para acelerar o diagnóstico, triagem e resolução de incidentes.
            <strong> Princípio Fundamental de Governança:</strong> Toda e qualquer ação sensível, alteração de estado ou envio de mensagens permanece estritamente sob validação e confirmação humana.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-900/60 border border-indigo-500/30 rounded-xl text-xs text-indigo-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Human-in-the-Loop Ativo</span>
        </div>
      </div>

      {/* Grid de 2 Colunas de Ferramentas de IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Resumo & Resposta de Tickets */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TicketIcon className="w-4 h-4 text-sky-600" />
              Análise Contextual de Ticket
            </h2>
            <span className="text-[11px] text-slate-400">Modelo: gemini-2.5-flash</span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-semibold text-slate-700">Selecione o Ticket para Análise:</label>
            <select
              value={selectedTicketIdForAi}
              onChange={(e) => {
                setSelectedTicketIdForAi(e.target.value);
                setTicketSummary(null);
                setDraftResponse('');
              }}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.ticket_number} - {t.title} ({t.priority})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleGenerateSummary}
              disabled={loadingAction === 'summary'}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingAction === 'summary' ? 'A gerar resumo...' : 'Resumir com IA'}
            </button>

            <button
              onClick={handleGenerateDraft}
              disabled={loadingAction === 'draft'}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {loadingAction === 'draft' ? 'A elaborar...' : 'Sugerir Resposta'}
            </button>
          </div>

          {/* Resultado do Resumo */}
          {ticketSummary && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="font-bold text-indigo-950">Resumo Executivo:</div>
              <p className="text-slate-700 leading-relaxed">{ticketSummary.summary}</p>

              {ticketSummary.keyPoints?.length > 0 && (
                <div>
                  <div className="font-semibold text-slate-800 mb-1">Pontos Principais:</div>
                  <ul className="list-disc pl-5 space-y-0.5 text-slate-600">
                    {ticketSummary.keyPoints.map((p: string, i: number) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-2.5 bg-white border border-indigo-200 rounded-lg text-emerald-800">
                <strong>Recomendação Técnica:</strong> {ticketSummary.suggestedNextStep}
              </div>
            </div>
          )}

          {/* Resultado do Rascunho */}
          {draftResponse && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Rascunho Sugerido de Resposta:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(draftResponse);
                    toast.success('Rascunho copiado para a área de transferência.');
                  }}
                  className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-lg whitespace-pre-wrap font-mono text-[11px] text-slate-800">
                {draftResponse}
              </div>

              <button
                onClick={() => {
                  setSelectedTicketId(Number(selectedTicketIdForAi));
                  setActiveView('ticket-detail');
                }}
                className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Abrir Ticket para Rever e Enviar Resposta
              </button>
            </div>
          )}
        </div>

        {/* Painel 2: Triagem & Classificação Automática */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Simulador de Triagem & Prioridade
            </h2>
          </div>

          <form onSubmit={handleTriageSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Título do Pedido</label>
              <input
                type="text"
                required
                value={triageTitle}
                onChange={(e) => setTriageTitle(e.target.value)}
                placeholder="Ex: Não consigo autenticar na VPN AWS..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
              <textarea
                rows={3}
                required
                value={triageDesc}
                onChange={(e) => setTriageDesc(e.target.value)}
                placeholder="Ex: Ocorre erro de timeout na handshake TLS..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={loadingAction === 'triage'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingAction === 'triage' ? 'A classificar...' : 'Classificar com IA'}
            </button>
          </form>

          {triageResult && (
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2 text-xs animate-in fade-in">
              <div className="font-bold text-purple-950">Sugestão de Classificação ITIL:</div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Categoria:</span>
                <span className="font-bold text-slate-900">{triageResult.suggestedCategory}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Impacto:</span>
                <span className="font-bold text-slate-900">{triageResult.suggestedImpact}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-600">Urgência:</span>
                <span className="font-bold text-slate-900">{triageResult.suggestedUrgency}</span>
              </div>
              <div className="text-[11px] text-slate-600 italic mt-1">
                Justificação: {triageResult.reasoning}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel 3: Pesquisa Semântica na Base de Conhecimento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Pesquisa Inteligente em Runbooks e Base de Conhecimento
        </h2>

        <form onSubmit={handleKbSearch} className="flex gap-2 text-xs">
          <input
            type="text"
            required
            value={kbQuery}
            onChange={(e) => setKbQuery(e.target.value)}
            placeholder="Descreva o sintoma ou erro em linguagem natural (ex: erro de certificado ou rotas em k8s)..."
            className="flex-1 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loadingAction === 'kb'}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            {loadingAction === 'kb' ? 'A pesquisar...' : 'Pesquisa Inteligente'}
          </button>
        </form>

        {kbResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            {kbResults.map((art) => (
              <div
                key={art.id}
                onClick={() => setActiveView('kb')}
                className="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg cursor-pointer transition-all"
              >
                <div className="font-bold text-slate-900">{art.title}</div>
                <div className="text-slate-500 mt-1 line-clamp-2">{art.summary}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
