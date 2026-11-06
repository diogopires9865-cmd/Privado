// ========================================================================
// SW Service Desk v1.0 - Criação Guiada de Tickets com IA e Matriz ITIL
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  AlertTriangle,
  Clock,
  HardDrive,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import { calculatePriority } from '../utils/sla';
import { ImpactLevel, UrgencyLevel } from '../types/index';

export function CreateTicket() {
  const { setActiveView, setSelectedTicketId } = useAuth();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketType, setTicketType] = useState('INCIDENTE');
  const [impact, setImpact] = useState<ImpactLevel>('MEDIO');
  const [urgency, setUrgency] = useState<UrgencyLevel>('MEDIA');
  const [categoryId, setCategoryId] = useState<string>('1');
  const [assetId, setAssetId] = useState<string>('');

  const [categories, setCategories] = useState<any[]>([]);
  const [myAssets, setMyAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);

  useEffect(() => {
    // Carregar categorias e ativos do utilizador
    api.getAssets().then(setMyAssets).catch(() => {});
  }, []);

  // Prioridade calculada dinamicamente
  const calculatedPriority = calculatePriority(impact, urgency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.warning('Título e descrição são campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createTicket({
        title: title.trim(),
        description: description.trim(),
        ticketType,
        impact,
        urgency,
        categoryId: categoryId ? Number(categoryId) : null,
        assetId: assetId ? Number(assetId) : null,
      });

      toast.success(`Ticket ${res.ticketNumber} aberto com sucesso!`);
      setSelectedTicketId(res.id);
      setActiveView('ticket-detail');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiClassify = async () => {
    if (!title && !description) {
      toast.warning('Preencha o título ou a descrição para que a IA possa classificar.');
      return;
    }

    setAiClassifying(true);
    try {
      const res = await api.aiSuggestClassification(title, description);
      setImpact(res.suggestedImpact);
      setUrgency(res.suggestedUrgency);
      toast.info(`IA sugeriu: Impacto ${res.suggestedImpact} e Urgência ${res.suggestedUrgency}. (${res.reasoning})`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao consultar IA.');
    } finally {
      setAiClassifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveView('tickets')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à Lista de Tickets
        </button>

        <span className="text-xs text-slate-400 font-medium">
          Matriz ITIL v4 com Prazos de SLA Automatizados
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Abrir Novo Ticket de Suporte Interno
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Preencha os detalhes do incidente ou pedido para a equipa interna de TI. O sistema calcula automaticamente a prioridade e os prazos de resposta do SLA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Título e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Assunto / Título do Ticket *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Falha de autenticação na VPN ou lentidão em cluster EKS..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipo de Pedido
              </label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="INCIDENTE">Incidente (Falha/Avaria)</option>
                <option value="PEDIDO_SERVICO">Pedido de Serviço</option>
                <option value="PROBLEMA">Problema (Causa Raiz)</option>
                <option value="ALTERACAO">Alteração (RFC)</option>
              </select>
            </div>
          </div>

          {/* Botão de Classificação com Gemini AI */}
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-semibold text-indigo-900 text-xs block">
                  Assistente de Triagem com Gemini AI
                </span>
                <span className="text-[11px] text-indigo-700">
                  A IA pode analisar o assunto e a descrição para sugerir o Impacto e a Urgência ideais.
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={aiClassifying}
              onClick={handleAiClassify}
              className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiClassifying ? 'A analisar...' : 'Classificar com IA'}
            </button>
          </div>

          {/* Matriz de Impacto e Urgência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Impacto Organizacional
              </label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as ImpactLevel)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="CRITICO">CRÍTICO - Paragem de negócio / Produção em baixo</option>
                <option value="ALTO">ALTO - Degradação severa que afeta múltiplos utilizadores</option>
                <option value="MEDIO">MÉDIO - Incidente normal circunscrito com alternativa</option>
                <option value="BAIXO">BAIXO - Dúvida técnica ou impacto individual leve</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Urgência de Resolução
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="CRITICA">CRÍTICA - Exige resolução imediata sem demora</option>
                <option value="ALTA">ALTA - Prazos iminentes comprometidos</option>
                <option value="MEDIA">MÉDIA - Afeta o trabalho mas existem alternativas</option>
                <option value="BAIXA">BAIXA - Pode aguardar a janela normal de atendimento</option>
              </select>
            </div>

            {/* Painel de Cálculo em Tempo Real */}
            <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Prioridade Calculada:</span>
                <Badge variant="priority" value={calculatedPriority} />
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  {calculatedPriority === 'P1_CRITICA'
                    ? 'P1: Resposta em 15m &bull; Resolução em 2h (24x7)'
                    : calculatedPriority === 'P2_ALTA'
                    ? 'P2: Resposta em 1h &bull; Resolução em 8h úteis'
                    : calculatedPriority === 'P3_MEDIA'
                    ? 'P3: Resposta em 4h &bull; Resolução em 24h úteis'
                    : 'P4: Resposta em 8h &bull; Resolução em 48h úteis'}
                </span>
              </div>
            </div>
          </div>

          {/* Categorização e Ativo CMDB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Categoria de Serviço
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="1">Cloud & Infraestrutura (AWS, Azure, K8s)</option>
                <option value="2">Hardware & Equipamentos</option>
                <option value="3">Acessos & Software</option>
                <option value="4">Rede & Telecomunicações</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Associar Equipamento CMDB (Opcional)
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">Nenhum equipamento vinculado</option>
                {myAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.asset_tag} - {a.name} ({a.brand})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Descrição Detalhada do Problema / Pedido *
            </label>
            <textarea
              required
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o comportamento observado, mensagens de erro, sistemas afetados e passos para reproduzir..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-sans"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView('tickets')}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {loading ? 'A submeter ticket...' : 'Criar Ticket com SLA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
