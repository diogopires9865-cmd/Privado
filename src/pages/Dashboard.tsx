// ========================================================================
// SW Service Desk v1.0 - Painel Principal (Dashboard Executivo e Operacional)
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  AlertTriangle,
  Clock,
  HardDrive,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  FolderOpen,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';

export function Dashboard() {
  const { user, setActiveView, setSelectedTicketId } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [slaMetrics, setSlaMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, slaData] = await Promise.all([
          api.getDashboardMetrics(),
          api.getSLAMetrics(),
        ]);
        setMetrics(dashData);
        setSlaMetrics(slaData);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenTicket = (id: number) => {
    setSelectedTicketId(id);
    setActiveView('ticket-detail');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Boas-Vindas e Ação Rápida */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            SW Cloud Solutions &bull; Service Desk Interno
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Olá, {user?.fullName}!
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Portal interno de suporte técnico, gestão de equipamentos e serviços corporativos para colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('create-ticket')}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Abrir Novo Ticket
          </button>
          {user?.role !== 'user' && (
            <button
              onClick={() => setActiveView('ai-assistant')}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Assistente IA
            </button>
          )}
        </div>
      </div>

      {/* Cartões de Indicadores Chave (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Abertos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets em Aberto</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <TicketIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.summary?.open ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Total histórico: {metrics?.summary?.total ?? 0} tickets</span>
          </div>
        </div>

        {/* Incidentes Críticos P1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Incidentes P1 (Críticos)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {metrics?.summary?.criticalP1 ?? 0}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">
            SLA 24x7: Resolução máxima 2h
          </div>
        </div>

        {/* Taxa de Cumprimento de SLA */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cumprimento de SLA</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {slaMetrics?.complianceRate ?? 100}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {slaMetrics?.violated ?? 0} tickets violados &bull; {slaMetrics?.atRisk ?? 0} em risco
          </div>
        </div>

        {/* Ativos CMDB */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ativos de TI (CMDB)</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.assetStats?.reduce((acc: number, curr: any) => acc + Number(curr.count), 0) ?? 4}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Equipamentos físicos e virtuais inventariados
          </div>
        </div>
      </div>

      {/* Grid de Tabelas e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Tickets Recentes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tickets Recentes</h2>
              <p className="text-xs text-slate-500">Últimos pedidos abertos na plataforma</p>
            </div>
            <button
              onClick={() => setActiveView('tickets')}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Número</th>
                  <th className="py-2.5 px-3">Título</th>
                  <th className="py-2.5 px-3">Prioridade</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Solicitante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics?.recentTickets?.map((t: any) => (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenTicket(t.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-medium text-sky-600">{t.ticket_number}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 max-w-xs truncate">{t.title}</td>
                    <td className="py-3 px-3">
                      <Badge variant="priority" value={t.priority} />
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="status" value={t.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-600">{t.requester_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribuição por Prioridade & Atendimentos */}
        <div className="space-y-6">
          {/* Prioridades */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Distribuição por Prioridade
            </h3>
            <div className="space-y-2.5 text-xs">
              {['P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA'].map((prio) => {
                const count = metrics?.priorityStats?.find((p: any) => p.priority === prio)?.count || 0;
                return (
                  <div key={prio} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <Badge variant="priority" value={prio} />
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Atalhos Rápidos para Módulos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Acesso Rápido a Módulos
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setActiveView('catalog')}
                className="p-3 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all group"
              >
                <FolderOpen className="w-4 h-4 text-sky-600 mb-1" />
                <div className="font-semibold text-slate-900 group-hover:text-sky-800">Catálogo</div>
                <div className="text-[10px] text-slate-500">Pedidos de serviço</div>
              </button>

              <button
                onClick={() => setActiveView('assets')}
                className="p-3 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all group"
              >
                <HardDrive className="w-4 h-4 text-purple-600 mb-1" />
                <div className="font-semibold text-slate-900 group-hover:text-purple-800">CMDB</div>
                <div className="text-[10px] text-slate-500">Gestão de hardware</div>
              </button>

              <button
                onClick={() => setActiveView('kb')}
                className="p-3 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all group"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 mb-1" />
                <div className="font-semibold text-slate-900 group-hover:text-emerald-800">Base KB</div>
                <div className="text-[10px] text-slate-500">Manuais e runbooks</div>
              </button>

              <button
                onClick={() => setActiveView('reports')}
                className="p-3 text-left bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl transition-all group"
              >
                <TrendingUp className="w-4 h-4 text-amber-600 mb-1" />
                <div className="font-semibold text-slate-900 group-hover:text-amber-800">Relatórios</div>
                <div className="text-[10px] text-slate-500">Métricas e CSV</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
