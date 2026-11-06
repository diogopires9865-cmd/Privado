// ========================================================================
// SW Service Desk v1.0 - Ficha Detalhada do Equipamento CMDB e Custódia
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  HardDrive,
  User,
  History,
  Ticket as TicketIcon,
  Key,
  Laptop,
  Server,
  UserCheck,
  RotateCcw,
  Trash2,
  Share2,
  Calendar,
  Network,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { ConfirmDialog } from '../components/common/ConfirmDialog.js';
import { Asset } from '../types/index.js';

export function AssetDetail() {
  const { user, selectedAssetId, setActiveView, setSelectedTicketId } = useAuth();
  const toast = useToast();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  // Modais de Gestão de Custódia
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);

  // Formulários
  const [usersList, setUsersList] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState('');
  const [transferJustification, setTransferJustification] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [retireJustification, setRetireJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAsset = async () => {
    if (!selectedAssetId) return;
    setLoading(true);
    try {
      const data = await api.getAssetById(selectedAssetId);
      setAsset(data);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar detalhes do equipamento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAsset();
    if (user?.role !== 'user') {
      api.getUsers().then(setUsersList).catch(() => {});
    }
  }, [selectedAssetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">A carregar ficha do equipamento...</p>
        </div>
      </div>
    );
  }

  if (!selectedAssetId || !asset) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 mb-4">Nenhum equipamento selecionado.</p>
        <button
          onClick={() => setActiveView('assets')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold"
        >
          Voltar ao CMDB
        </button>
      </div>
    );
  }

  // 1. Atribuir Equipamento
  const handleAssign = async () => {
    if (!targetUserId) {
      toast.warning('Selecione o colaborador a quem entregar o equipamento.');
      return;
    }
    setSubmitting(true);
    try {
      await api.assignAsset(asset!.id, {
        userId: Number(targetUserId),
        notes: assignNotes,
      });
      toast.success('Equipamento atribuído com sucesso.');
      setShowAssignModal(false);
      setTargetUserId('');
      setAssignNotes('');
      loadAsset();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atribuir.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Transferir Custódia (A -> B)
  const handleTransfer = async () => {
    if (!targetUserId) {
      toast.warning('Selecione o novo colaborador.');
      return;
    }
    setSubmitting(true);
    try {
      await api.transferAsset(asset!.id, {
        newUserId: Number(targetUserId),
        justification: transferJustification,
      });
      toast.success('Custódia do equipamento transferida com sucesso.');
      setShowTransferModal(false);
      setTargetUserId('');
      setTransferJustification('');
      loadAsset();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao transferir.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Devolver ao Stock
  const handleReturn = async () => {
    setSubmitting(true);
    try {
      await api.returnAsset(asset!.id, { reason: returnReason });
      toast.success('Equipamento recolhido e devolvido ao stock.');
      setShowReturnModal(false);
      setReturnReason('');
      loadAsset();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao devolver.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Abater Equipamento
  const handleRetire = async () => {
    if (!retireJustification.trim()) {
      toast.warning('Justificação obrigatória para proceder ao abate de equipamento.');
      return;
    }
    setSubmitting(true);
    try {
      await api.retireAsset(asset!.id, { justification: retireJustification.trim() });
      toast.success('Equipamento abatido e retirado de serviço.');
      setShowRetireModal(false);
      setRetireJustification('');
      loadAsset();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao abater.');
    } finally {
      setSubmitting(false);
    }
  };

  const isTechnician = user && ['agent', 'supervisor', 'admin'].includes(user.role);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Botão Voltar e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button
          onClick={() => setActiveView('assets')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Inventário CMDB
        </button>

        {isTechnician && asset?.status !== 'ABATIDO' && (
          <div className="flex flex-wrap items-center gap-2">
            {asset?.status === 'EM_STOCK' ? (
              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Atribuir a Colaborador
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Transferir Colaborador
                </button>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Devolver ao Stock
                </button>
              </>
            )}

            {user?.role !== 'agent' && (
              <button
                type="button"
                onClick={() => setShowRetireModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Abater Equipamento
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cartão de Cabeçalho do Ativo */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200">
              {asset?.asset_tag}
            </span>
            <Badge variant="status" value={asset?.status || 'EM_STOCK'} />
            <span className="text-xs font-medium text-slate-500">
              Tipo: <strong className="text-slate-800">{asset?.asset_type}</strong>
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Cadastrado em {new Date(asset!.created_at).toLocaleDateString('pt-PT')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h1 className="text-xl font-bold text-slate-900">{asset?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {asset?.brand} &bull; Modelo: {asset?.model}
            </p>

            {asset?.notes && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                <strong>Notas de Hardware:</strong> {asset.notes}
              </div>
            )}
          </div>

          {/* Cartão do Detentor Atual */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider block text-[11px]">
              Custódia Atual
            </span>
            {asset?.current_user_name ? (
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="w-4 h-4 text-purple-600" />
                  {asset.current_user_name}
                </div>
                <div className="text-slate-500">{asset.current_user_email}</div>
                {asset.department_name && (
                  <div className="text-[11px] text-slate-600">
                    Departamento: <strong>{asset.department_name}</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Em Stock (Livre para Atribuição)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Histórico de Custódia vs Tickets Associados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico Completo do Ciclo de Vida do Equipamento */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-purple-600" />
            Histórico Forense do Equipamento ({asset?.history?.length || 0} Registos)
          </h2>

          <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
            {asset?.history?.map((h) => (
              <div key={h.id} className="relative pl-8">
                <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-100"></div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{h.action_type}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(h.created_at).toLocaleString('pt-PT')}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{h.details}</p>
                <div className="text-[10px] text-slate-400 mt-1">
                  Operador Técnico: {h.performed_by_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets de Suporte e Avarias Associados */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TicketIcon className="w-4 h-4 text-sky-600" />
              Histórico de Incidentes Associados ({asset?.tickets?.length || 0})
            </h2>
          </div>

          {asset?.tickets?.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Nenhum ticket ou avaria associado a este equipamento até ao momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {asset?.tickets?.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setActiveView('ticket-detail');
                  }}
                  className="p-3 bg-slate-50 hover:bg-sky-50/70 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-600 text-xs">{t.ticket_number}</span>
                    <Badge variant="status" value={t.status} />
                  </div>
                  <div className="font-semibold text-slate-900 text-xs mt-1 truncate">{t.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Aberto em {new Date(t.created_at).toLocaleDateString('pt-PT')} por {t.requester_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Atribuir a Colaborador */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Atribuir Equipamento a Colaborador">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Selecionar Colaborador *</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Selecione um utilizador...</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email}) &bull; {u.department_name || 'Geral'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observações de Entrega</label>
            <textarea
              rows={2}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Ex: Entrega presencial com carregador original e termo assinado..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={submitting}
              className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 shadow-xs"
            >
              {submitting ? 'A registar...' : 'Confirmar Atribuição'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Transferir Colaborador (A -> B) */}
      <Modal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transferência de Custódia de Equipamento">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-sky-900">
            Custódia atual: <strong>{asset?.current_user_name}</strong>. O histórico registará a devolução e transferência.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Novo Detentor do Equipamento *</label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Selecione o novo colaborador...</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Justificação da Transferência</label>
            <textarea
              rows={2}
              value={transferJustification}
              onChange={(e) => setTransferJustification(e.target.value)}
              placeholder="Ex: Mudança de equipa ou reatribuição de posto de trabalho..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowTransferModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleTransfer}
              disabled={submitting}
              className="px-4 py-1.5 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 shadow-xs"
            >
              {submitting ? 'A transferir...' : 'Efetuar Transferência'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Devolver ao Stock */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Devolução de Equipamento ao Stock">
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Motivo da Devolução</label>
            <textarea
              rows={2}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Ex: Saída de colaborador ou substituição por equipamento mais recente..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowReturnModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleReturn}
              disabled={submitting}
              className="px-4 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 shadow-xs"
            >
              {submitting ? 'A recolher...' : 'Confirmar Devolução'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Abater Equipamento */}
      <Modal isOpen={showRetireModal} onClose={() => setShowRetireModal(false)} title="Abate de Equipamento (Fim de Vida Útil)">
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong>Ação Irreversível:</strong> O equipamento será retirado definitivamente de circulação e todas as licenças alocadas serão libertadas.
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Justificação Obrigatória de Abate *</label>
            <textarea
              required
              rows={3}
              value={retireJustification}
              onChange={(e) => setRetireJustification(e.target.value)}
              placeholder="Ex: Avaria irreparável de motherboard / Fim do período de amortização fiscal e descontinuação..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setShowRetireModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={handleRetire}
              disabled={submitting}
              className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-500 shadow-xs"
            >
              {submitting ? 'A abater...' : 'Confirmar Abate Definitivo'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
