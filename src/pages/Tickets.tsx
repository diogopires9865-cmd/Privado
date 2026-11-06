// ========================================================================
// SW Service Desk v1.0 - Lista de Tickets e Incidentes (Fila de Suporte)
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  PlusCircle,
  Clock,
  User,
  ShieldAlert,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Badge } from '../components/common/Badge.js';
import { SLAIndicator } from '../components/common/SLAIndicator.js';
import { Ticket } from '../types/index.js';

export function Tickets() {
  const { user, setActiveView, setSelectedTicketId } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedType) params.type = selectedType;

      const res = await api.getTickets(params);
      setTickets(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [selectedStatus, selectedPriority, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTickets();
  };

  const handleTicketClick = (id: number) => {
    setSelectedTicketId(id);
    setActiveView('ticket-detail');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-sky-600" />
            Tickets & Incidentes Internos
          </h1>
          <p className="text-xs text-slate-500">
            {user?.role === 'user'
              ? 'Consulte e acompanhe o estado dos seus pedidos de assistência interna.'
              : 'Fila unificada de suporte interno, triagem e resolução de incidentes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTickets}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setActiveView('create-ticket')}
            className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Abrir Novo Ticket
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por número (TCK-...), título, descrição ou solicitante..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Pesquisar
          </button>
        </form>

        {/* Filtros em Pílulas */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px] mr-1">
            <Filter className="w-3.5 h-3.5" /> Estado:
          </span>
          {[
            { label: 'Todos', value: '' },
            { label: 'Novos', value: 'NOVO' },
            { label: 'Atribuídos', value: 'ATRIBUIDO' },
            { label: 'Em Progresso', value: 'EM_PROGRESSO' },
            { label: 'Pendente', value: 'PENDENTE_CLIENTE' },
            { label: 'Resolvidos', value: 'RESOLVIDO' },
            { label: 'Fechados', value: 'FECHADO' },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                selectedStatus === st.value
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st.label}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-400 font-medium text-[11px] mr-1">Prioridade:</span>
          {[
            { label: 'Todas', value: '' },
            { label: 'P1 Crítica', value: 'P1_CRITICA' },
            { label: 'P2 Alta', value: 'P2_ALTA' },
            { label: 'P3 Média', value: 'P3_MEDIA' },
            { label: 'P4 Baixa', value: 'P4_BAIXA' },
          ].map((pr) => (
            <button
              key={pr.value}
              onClick={() => setSelectedPriority(pr.value)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                selectedPriority === pr.value
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Tabela de Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Assunto & Tipo</th>
                <th className="py-3 px-4">Prioridade</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">SLA Resolução</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Técnico Atribuído</th>
                <th className="py-3 px-4">Aberto Em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    A carregar tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhum ticket encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => handleTicketClick(t.id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 group-hover:text-sky-700">
                      {t.ticket_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{t.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.ticket_type} &bull; {t.category_name || 'Geral'}
                        {t.asset_tag && (
                          <span className="ml-1.5 font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded border text-slate-700">
                            {t.asset_tag}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="priority" value={t.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="status" value={t.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="sla" value={t.current_sla_status || t.sla_status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {t.requester_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {t.agent_name ? (
                        <span className="flex items-center gap-1.5 font-medium text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {t.agent_name}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Por atribuir</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
