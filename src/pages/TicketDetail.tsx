// ========================================================================
// SW Service Desk v1.0 - Vista Detalhada do Ticket (360º View)
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Clock,
  HardDrive,
  MessageSquare,
  Lock,
  Paperclip,
  History,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Upload,
  UserCheck,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';
import { SLAIndicator } from '../components/common/SLAIndicator.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { Ticket } from '../types/index.js';

export function TicketDetail() {
  const { user, selectedTicketId, setActiveView, setSelectedAssetId } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  // Comentários e Anexos
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'PUBLIC' | 'INTERNAL_NOTE'>('PUBLIC');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Modais de Operação
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showLinkAssetModal, setShowLinkAssetModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // Listas para seletores
  const [agents, setAgents] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  // Estados dos formulários dos modais
  const [selectedAgentId, setSelectedAgentId] = useState<number | string>('');
  const [impact, setImpact] = useState<string>('MEDIO');
  const [urgency, setUrgency] = useState<string>('MEDIA');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [selectedAssetIdInput, setSelectedAssetIdInput] = useState<number | string>('');

  // Estados do Assistente Gemini AI
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [aiDraftResponse, setAiDraftResponse] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadTicket = async () => {
    if (!selectedTicketId) return;
    setLoading(true);
    try {
      const data = await api.getTicketById(selectedTicketId);
      setTicket(data);
      setImpact(data.impact);
      setUrgency(data.urgency);
      if (data.assigned_agent_id) setSelectedAgentId(data.assigned_agent_id);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [selectedTicketId]);

  // Carregar listas para modais
  useEffect(() => {
    if (user?.role !== 'user') {
      api.getUsers({ role: 'agent' }).then(setAgents).catch(() => {});
      api.getAssets().then(setAssets).catch(() => {});
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">A carregar detalhes do ticket...</p>
        </div>
      </div>
    );
  }

  if (!selectedTicketId || !ticket) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 mb-4">Nenhum ticket selecionado.</p>
        <button
          onClick={() => setActiveView('tickets')}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold"
        >
          Voltar à lista de tickets
        </button>
      </div>
    );
  }

  // Submeter Comentário ou Nota Interna
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.addComment(ticket!.id, {
        body: newComment.trim(),
        commentType,
      });

      // Se houver anexo pendente
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await api.uploadAttachment(ticket!.id, formData);
        setSelectedFile(null);
      }

      setNewComment('');
      toast.success(
        commentType === 'INTERNAL_NOTE'
          ? 'Nota interna confidencial guardada.'
          : 'Comentário público enviado ao solicitante.'
      );
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao submeter resposta.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Atribuir Técnico
  const handleAssign = async () => {
    try {
      await api.assignTicket(ticket!.id, {
        agentId: selectedAgentId ? Number(selectedAgentId) : null,
      });
      toast.success('Ticket atribuído com sucesso.');
      setShowAssignModal(false);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atribuir ticket.');
    }
  };

  // Alterar Prioridade (Recalcular SLA)
  const handleUpdatePriority = async () => {
    try {
      const res = await api.updateTicketPriority(ticket!.id, { impact, urgency });
      toast.success(`Prioridade recalculada para ${res.priority} e prazos de SLA atualizados.`);
      setShowPriorityModal(false);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar prioridade.');
    }
  };

  // Resolver Ticket
  const handleResolve = async () => {
    if (!resolutionSummary.trim()) {
      toast.warning('Por favor insira um resumo descritivo da resolução.');
      return;
    }
    try {
      await api.updateTicketStatus(ticket!.id, {
        status: 'RESOLVIDO',
        resolutionSummary,
      });
      toast.success('Ticket marcado como resolvido!');
      setShowResolveModal(false);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao resolver ticket.');
    }
  };

  // Fechar Ticket
  const handleClose = async () => {
    try {
      await api.updateTicketStatus(ticket!.id, { status: 'FECHADO' });
      toast.success('Ticket fechado definitivamente.');
      setShowCloseDialog(false);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao fechar ticket.');
    }
  };

  // Associar Ativo
  const handleLinkAsset = async () => {
    if (!selectedAssetIdInput) return;
    try {
      await api.linkAssetToTicket(ticket!.id, Number(selectedAssetIdInput));
      toast.success('Equipamento associado com sucesso.');
      setShowLinkAssetModal(false);
      loadTicket();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao associar ativo.');
    }
  };

  // Ações do Assistente de IA
  const handleAiSummarize = async () => {
    setAiLoading(true);
    setShowAiModal(true);
    try {
      const res = await api.aiSummarizeTicket(ticket!.id);
      setAiSummary(res);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao obter resumo de IA.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiDraft = async () => {
    setAiLoading(true);
    setShowAiModal(true);
    try {
      const res = await api.aiSuggestResponse(ticket!.id);
      setAiDraftResponse(res.draftResponse);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sugerir resposta.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiDraftToEditor = () => {
    setNewComment(aiDraftResponse);
    setCommentType('PUBLIC');
    setShowAiModal(false);
    toast.info('Rascunho de IA inserido no editor. Reveja antes de enviar.');
  };

  const isTechnician = user && ['agent', 'supervisor', 'admin'].includes(user.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Botão Voltar e Ações de Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button
          onClick={() => setActiveView('tickets')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos Tickets
        </button>

        {/* Barra de Ações Rápidas por Perfil */}
        <div className="flex flex-wrap items-center gap-2">
          {isTechnician && (
            <>
              {/* Assistência IA */}
              <button
                type="button"
                onClick={handleAiSummarize}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                title="Resumir histórico e sugerir próximos passos com Gemini IA"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Resumo por IA
              </button>

              <button
                type="button"
                onClick={handleAiDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                title="Gerar rascunho de resposta técnica ao solicitante"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Sugerir Resposta IA
              </button>

              {/* Atribuir */}
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                Atribuir
              </button>

              {/* Alterar Prioridade */}
              <button
                type="button"
                onClick={() => setShowPriorityModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Prioridade & SLA
              </button>
            </>
          )}

          {/* Transições de Estado */}
          {ticket?.status !== 'RESOLVIDO' && ticket?.status !== 'FECHADO' && isTechnician && (
            <button
              type="button"
              onClick={() => setShowResolveModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Marcar Resolvido
            </button>
          )}

          {ticket?.status === 'RESOLVIDO' && (
            <button
              type="button"
              onClick={() => setShowCloseDialog(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Confirmar Fecho
            </button>
          )}
        </div>
      </div>

      {/* Cabeçalho do Ticket */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
              {ticket?.ticket_number}
            </span>
            <Badge variant="type" value={ticket?.ticket_type || 'INCIDENTE'} />
            <Badge variant="priority" value={ticket?.priority || 'P3_MEDIA'} />
            <Badge variant="status" value={ticket?.status || 'NOVO'} />
          </div>

          <div className="text-xs text-slate-400">
            Aberto em{' '}
            {new Date(ticket!.created_at).toLocaleString('pt-PT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-snug">{ticket?.title}</h1>
          <div className="mt-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
            {ticket?.description}
          </div>
        </div>
      </div>

      {/* Grid: 2 Colunas (Painel Principal de Conversação vs Sidebar de Metadados) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Comentários, Notas Internas, Linha do Tempo */}
        <div className="lg:col-span-2 space-y-6">
          {/* Caixa de Adicionar Resposta */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCommentType('PUBLIC')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    commentType === 'PUBLIC'
                      ? 'bg-sky-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Resposta Pública ao Solicitante
                </button>

                {isTechnician && (
                  <button
                    type="button"
                    onClick={() => setCommentType('INTERNAL_NOTE')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      commentType === 'INTERNAL_NOTE'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Nota Interna Confidencial
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <textarea
                required
                rows={4}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={
                  commentType === 'INTERNAL_NOTE'
                    ? 'Escreva uma nota técnica confidencial visível apenas para técnicos e supervisores...'
                    : 'Escreva a resposta pública para o solicitante...'
                }
                className={`w-full p-3 text-xs border rounded-xl focus:outline-hidden focus:ring-2 transition-all ${
                  commentType === 'INTERNAL_NOTE'
                    ? 'bg-amber-50/40 border-amber-300 focus:ring-amber-500 text-amber-950 placeholder:text-amber-800/50'
                    : 'bg-white border-slate-200 focus:ring-sky-500 text-slate-900 placeholder:text-slate-400'
                }`}
              />

              {/* Anexo de ficheiro */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{selectedFile ? selectedFile.name : 'Anexar Ficheiro (Máx 20MB)'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingComment}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-xs disabled:opacity-50 ${
                    commentType === 'INTERNAL_NOTE' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-sky-600 hover:bg-sky-500'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingComment
                    ? 'A enviar...'
                    : commentType === 'INTERNAL_NOTE'
                    ? 'Guardar Nota Interna'
                    : 'Enviar Resposta Pública'}
                </button>
              </div>
            </form>
          </div>

          {/* Histórico de Comentários */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Linha de Comunicação ({ticket?.comments?.length || 0})
            </h2>

            {ticket?.comments?.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
                Ainda não foram registados comentários neste ticket.
              </div>
            ) : (
              ticket?.comments?.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border transition-all ${
                    c.comment_type === 'INTERNAL_NOTE'
                      ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          c.comment_type === 'INTERNAL_NOTE'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {c.author_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-slate-900">{c.author_name}</span>
                        <span className="text-[10px] text-slate-400 ml-2 capitalize">({c.author_role})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.comment_type === 'INTERNAL_NOTE' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> NOTA INTERNA PRIVADA
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(c.created_at).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed pl-9">
                    {c.body}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Histórico Forense Completo (Auditoria da Linha do Tempo) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-sky-600" />
              Histórico Forense do Ticket ({ticket?.history?.length || 0} Eventos)
            </h2>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
              {ticket?.history?.map((h) => (
                <div key={h.id} className="relative pl-8">
                  <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white ring-2 ring-sky-100"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{h.description}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.created_at).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Operador: {h.actor_name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna 2: Informações de SLA, Solicitante e Ativo Associado */}
        <div className="space-y-6">
          {/* Card de Cumprimento de SLA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              Service Level Agreement (SLA)
            </h3>

            <div className="space-y-2">
              <SLAIndicator
                label="Primeira Resposta"
                dueAt={ticket?.first_response_due_at}
                completedAt={ticket?.first_responded_at}
                status={ticket?.first_responded_at ? 'CUMPRIDO' : 'DENTRO_PRAZO'}
              />

              <SLAIndicator
                label="Resolução Definitiva"
                dueAt={ticket?.resolution_due_at}
                completedAt={ticket?.resolved_at}
                status={ticket?.current_sla_status || ticket?.sla_status || 'DENTRO_PRAZO'}
              />
            </div>
          </div>

          {/* Solicitante */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-600" />
              Informações do Solicitante
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-900">{ticket?.requester_name}</div>
              <div className="text-slate-500">{ticket?.requester_email}</div>
              {ticket?.requester_phone && <div className="text-slate-500">{ticket?.requester_phone}</div>}
              {ticket?.department_name && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                  Departamento: <span className="font-medium text-slate-900">{ticket.department_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ativo CMDB Associado */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-purple-600" />
                Equipamento CMDB
              </h3>
              {isTechnician && !ticket?.asset_id && (
                <button
                  type="button"
                  onClick={() => setShowLinkAssetModal(true)}
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold"
                >
                  Associar
                </button>
              )}
            </div>

            {ticket?.asset_id ? (
              <div
                onClick={() => {
                  setSelectedAssetId(ticket.asset_id!);
                  setActiveView('asset-detail');
                }}
                className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-800 text-xs">{ticket.asset_tag}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="font-semibold text-slate-900 text-xs mt-1">{ticket.asset_name}</div>
                {ticket.asset_serial && (
                  <div className="text-[11px] text-slate-500">SN: {ticket.asset_serial}</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Nenhum equipamento associado a este incidente.</div>
            )}
          </div>

          {/* Ficheiros Anexados */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-slate-500" />
              Ficheiros Anexos ({ticket?.attachments?.length || 0})
            </h3>

            {ticket?.attachments?.length === 0 ? (
              <div className="text-xs text-slate-400 italic">Sem ficheiros anexados.</div>
            ) : (
              <div className="space-y-2">
                {ticket?.attachments?.map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">{a.file_name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {Math.round(a.file_size / 1024)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Atribuir Técnico */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Atribuir Técnico ao Ticket">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Selecionar Técnico de Suporte</label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Não atribuído (Fila geral)</option>
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.full_name} ({ag.team_name || 'Geral'})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              className="px-4 py-1.5 text-xs bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500"
            >
              Guardar Atribuição
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Alterar Prioridade (Recalcular SLA) */}
      <Modal isOpen={showPriorityModal} onClose={() => setShowPriorityModal(false)} title="Alterar Impacto & Urgência">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Impacto Organizacional</label>
            <select
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="CRITICO">CRÍTICO: Paragem total da empresa ou ambiente de produção</option>
              <option value="ALTO">ALTO: Degradação severa que afeta múltiplos departamentos</option>
              <option value="MEDIO">MÉDIO: Afeta uma equipa ou serviço com solução de contorno</option>
              <option value="BAIXO">BAIXO: Impacto mínimo num colaborador individual</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Urgência de Resolução</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="CRITICA">CRÍTICA: Operação parada, exige intervenção imediata</option>
              <option value="ALTA">ALTA: Prazos contratuais de clientes em risco</option>
              <option value="MEDIA">MÉDIA: Trabalho condicionado mas não impedido</option>
              <option value="BAIXA">BAIXA: Procedimento normal de rotina ou consulta</option>
            </select>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-800 text-[11px]">
            <strong>Cálculo Automático:</strong> A prioridade e os prazos de SLA serão recalculados e registados no histórico forense do ticket.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowPriorityModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdatePriority}
              className="px-4 py-1.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500"
            >
              Recalcular Prioridade
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Resolver Ticket */}
      <Modal isOpen={showResolveModal} onClose={() => setShowResolveModal(false)} title="Marcar Ticket como Resolvido">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Resumo da Solução Aplicada *</label>
            <textarea
              required
              rows={4}
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              placeholder="Descreva detalhadamente a ação técnica que corrigiu o incidente..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowResolveModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleResolve}
              className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500"
            >
              Confirmar Resolução
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Associar Ativo CMDB */}
      <Modal isOpen={showLinkAssetModal} onClose={() => setShowLinkAssetModal(false)} title="Associar Equipamento CMDB">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Selecionar Equipamento</label>
            <select
              value={selectedAssetIdInput}
              onChange={(e) => setSelectedAssetIdInput(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Selecione um ativo...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_tag} - {a.name} ({a.brand} {a.model})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowLinkAssetModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleLinkAsset}
              className="px-4 py-1.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500"
            >
              Vincular Equipamento
            </button>
          </div>
        </div>
      </Modal>

      {/* DIÁLOGO: Confirmar Fecho Definitivo */}
      <ConfirmDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleClose}
        title="Confirmar Fecho Definitivo do Ticket"
        message="Tem a certeza que deseja fechar este ticket? O ciclo de vida será arquivado com sucesso."
        confirmLabel="Fechar Definitivamente"
      />

      {/* MODAL: Assistente de IA Gemini (Human-in-the-Loop) */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Assistente de IA para Técnicos (SW Cloud Solutions)"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs">
          {aiLoading ? (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>O Gemini AI está a analisar o histórico e as métricas do ticket...</p>
            </div>
          ) : (
            <>
              {aiSummary && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Resumo Executivo Gerado por IA
                    </h4>
                    <p className="text-indigo-950 leading-relaxed">{aiSummary.summary}</p>
                  </div>

                  {aiSummary.keyPoints?.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-slate-800 mb-1">Pontos Chave Identificados:</h5>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {aiSummary.keyPoints.map((kp: string, i: number) => (
                          <li key={i}>{kp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiSummary.suggestedNextStep && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                      <strong>Próximo Passo Recomendado:</strong> {aiSummary.suggestedNextStep}
                    </div>
                  )}
                </div>
              )}

              {aiDraftResponse && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-sky-600" />
                      Sugestão de Resposta ao Solicitante
                    </h4>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {aiDraftResponse}
                    </div>
                  </div>

                  <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[11px]">
                    <strong>Salvaguarda Humana:</strong> A IA nunca envia mensagens diretamente. Deve rever o texto e clicar abaixo para transferir o rascunho para o editor.
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={applyAiDraftToEditor}
                      className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 shadow-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Inserir no Editor de Resposta
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
