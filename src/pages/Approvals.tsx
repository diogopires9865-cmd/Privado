// ========================================================================
// SW Service Desk v1.0 - Fila de Aprovações Hierárquicas
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Modal } from '../components/common/Modal.js';
import { Badge } from '../components/common/Badge.js';
import { ServiceApproval } from '../types/index.js';

export function Approvals() {
  const { setActiveView, setSelectedTicketId } = useAuth();
  const toast = useToast();

  const [approvals, setApprovals] = useState<ServiceApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ServiceApproval | null>(null);
  const [decision, setDecision] = useState<'APROVADO' | 'REJEITADO'>('APROVADO');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar aprovações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleOpenDecisionModal = (approval: ServiceApproval, dec: 'APROVADO' | 'REJEITADO') => {
    setSelectedApproval(approval);
    setDecision(dec);
    setNotes('');
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval) return;
    setSubmitting(true);
    try {
      await api.decideApproval(selectedApproval.id, {
        status: decision,
        notes,
      });

      toast.success(
        decision === 'APROVADO'
          ? 'Pedido aprovado com sucesso! Foi encaminhado para execução técnica.'
          : 'Pedido rejeitado. O solicitante foi notificado.'
      );

      setSelectedApproval(null);
      loadApprovals();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar decisão.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDENTE');
  const pastApprovals = approvals.filter((a) => a.status !== 'PENDENTE');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-500" />
            Aprovações de Serviços
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Validação hierárquica e controlo de pedidos com impacto financeiro ou de segurança.
          </p>
        </div>

        <button
          onClick={loadApprovals}
          className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Pedidos Pendentes de Validação */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-500" />
          Aguardando a Sua Decisão ({pendingApprovals.length})
        </h2>

        {pendingApprovals.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
            Não existem pedidos de serviço pendentes de aprovação neste momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingApprovals.map((appr) => (
              <div
                key={appr.id}
                className="bg-white rounded-xl border border-amber-200 p-5 shadow-2xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {appr.ticket_number}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-2">{appr.catalog_item_name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{appr.ticket_title}</p>
                  </div>
                  <Badge variant="priority" value={appr.ticket_priority} />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Solicitado por: <strong>{appr.requested_by_name}</strong> ({appr.requested_by_email})
                    </span>
                  </div>
                  {appr.requester_department && (
                    <div className="text-[11px] text-slate-500 pl-5.5">
                      Departamento: {appr.requester_department}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pl-5.5">
                    Data: {new Date(appr.requested_at).toLocaleString('pt-PT')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedTicketId(appr.ticket_id);
                      setActiveView('ticket-detail');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    Ver detalhes do ticket <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenDecisionModal(appr, 'REJEITADO')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Rejeitar
                    </button>
                    <button
                      onClick={() => handleOpenDecisionModal(appr, 'APROVADO')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Histórico de Decisões */}
      {pastApprovals.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Histórico Recente de Decisões ({pastApprovals.length})
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Ticket</th>
                  <th className="py-2.5 px-4">Serviço</th>
                  <th className="py-2.5 px-4">Solicitante</th>
                  <th className="py-2.5 px-4">Decisão</th>
                  <th className="py-2.5 px-4">Notas do Supervisor</th>
                  <th className="py-2.5 px-4">Data da Decisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastApprovals.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{p.ticket_number}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.catalog_item_name}</td>
                    <td className="py-3 px-4 text-slate-700">{p.requested_by_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          p.status === 'APROVADO'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{p.approval_notes || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.decided_at ? new Date(p.decided_at).toLocaleString('pt-PT') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Decisão */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title={decision === 'APROVADO' ? 'Aprovar Pedido de Serviço' : 'Rejeitar Pedido de Serviço'}
        maxWidth="md"
      >
        {selectedApproval && (
          <div className="space-y-4 text-xs">
            <div
              className={`p-3 rounded-lg border ${
                decision === 'APROVADO'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="font-bold text-sm">
                {decision === 'APROVADO' ? 'Confirmação de Aprovação' : 'Confirmação de Rejeição'}
              </div>
              <p className="mt-1">
                Serviço: <strong>{selectedApproval.catalog_item_name}</strong> para{' '}
                <strong>{selectedApproval.requested_by_name}</strong>.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {decision === 'APROVADO' ? 'Notas de Aprovação (Opcional)' : 'Justificação da Rejeição *'}
              </label>
              <textarea
                required={decision === 'REJEITADO'}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  decision === 'APROVADO'
                    ? 'Ex: Aprovado conforme orçamento do departamento...'
                    : 'Indique o motivo pelo qual este pedido não pode ser autorizado...'
                }
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting || (decision === 'REJEITADO' && !notes.trim())}
                onClick={handleSubmitDecision}
                className={`px-4 py-1.5 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 ${
                  decision === 'APROVADO'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submitting ? 'A processar...' : `Confirmar ${decision === 'APROVADO' ? 'Aprovação' : 'Rejeição'}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
