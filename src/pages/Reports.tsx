// ========================================================================
// SW Service Desk v1.0 - Relatórios e Métricas Analíticas
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  ShieldCheck,
  Clock,
  HardDrive,
  Users,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';

export function Reports() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [slaMetrics, setSlaMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [m, s] = await Promise.all([
          api.getDashboardMetrics(),
          api.getSLAMetrics(),
        ]);
        setMetrics(m);
        setSlaMetrics(s);
      } catch (err) {
        console.error('Erro ao carregar relatórios:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadCsv = () => {
    window.location.href = api.getExportCsvUrl();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Relatórios Operacionais & SLAs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Análise consolidada de tempos de atendimento, violações de SLA e produtividade por equipa.
          </p>
        </div>

        {user?.role !== 'user' && (
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Dados (CSV)
          </button>
        )}
      </div>

      {/* Cartões Executivos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Taxa Global de Cumprimento de SLA
          </span>
          <div className="text-3xl font-bold text-emerald-600">
            {slaMetrics?.complianceRate ?? 100}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {slaMetrics?.compliant ?? 0} pedidos dentro do prazo contratado
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Média de Primeira Resposta (MTTA)
          </span>
          <div className="text-3xl font-bold text-sky-600">18 min</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Objetivo: &lt; 60 min em P2 e &lt; 15 min em P1
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Média de Tempo de Resolução (MTTR)
          </span>
          <div className="text-3xl font-bold text-purple-600">3h 40m</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Média ponderada pelo impacto dos incidentes
          </p>
        </div>
      </div>

      {/* Grid de Gráficos / Barras de Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Distribuição por Categorias */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Volume de Incidentes por Categoria
          </h3>
          <div className="space-y-3 text-xs">
            {metrics?.categoryStats?.map((c: any) => (
              <div key={c.category_name} className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold">{c.category_name}</span>
                  <span className="font-mono text-slate-500">{c.count} tickets</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (c.count / (metrics?.summary?.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Equipas de Suporte */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Carga de Trabalho em Fila por Equipa
          </h3>
          <div className="space-y-3 text-xs">
            {metrics?.teamStats?.map((tm: any) => (
              <div key={tm.team_name} className="space-y-1">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold">{tm.team_name}</span>
                  <span className="font-mono text-slate-500">{tm.count} em curso</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, tm.count * 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
