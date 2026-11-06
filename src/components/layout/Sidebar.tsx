// ========================================================================
// SW Service Desk v1.0 - Barra Lateral de Navegação (Sidebar)
// Empresa: SW Cloud Solutions
// ========================================================================

import React from 'react';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  PlusCircle,
  FolderOpen,
  HardDrive,
  Key,
  BookOpen,
  CheckSquare,
  Sparkles,
  BarChart3,
  Users,
  Clock,
  ShieldAlert,
  Database,
  Activity,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export function Sidebar() {
  const { user, activeView, setActiveView, setSelectedTicketId, setSelectedAssetId, setSelectedKBId } = useAuth();

  const handleNav = (view: string) => {
    setSelectedTicketId(null);
    setSelectedAssetId(null);
    setSelectedKBId(null);
    setActiveView(view);
  };

  const isRole = (roles: string[]) => {
    return user && (user.role === 'admin' || roles.includes(user.role));
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Logótipo e Nome da Empresa */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-white text-sm tracking-tight leading-none flex items-center gap-1.5">
            SW Service Desk
            <span className="text-[10px] font-semibold bg-sky-500/20 text-sky-400 px-1 py-0.2 rounded border border-sky-500/30">
              v1.0
            </span>
          </span>
          <span className="text-[11px] text-sky-400 font-medium leading-tight mt-0.5 truncate">Service Desk Interno</span>
        </div>
      </div>

      {/* Navegação por Grupos */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-xs">
        {/* Atendimento */}
        <div>
          <div className="px-3 mb-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
            Atendimento
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'dashboard'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              Painel Principal
            </button>

            <button
              onClick={() => handleNav('tickets')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'tickets' || activeView === 'ticket-detail'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <TicketIcon className="w-4 h-4 shrink-0" />
              Tickets & Incidentes
            </button>

            <button
              onClick={() => handleNav('create-ticket')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'create-ticket'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              Novo Ticket
            </button>

            <button
              onClick={() => handleNav('catalog')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'catalog'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              Catálogo de Serviços
            </button>
          </div>
        </div>

        {/* Gestão ITIL & CMDB */}
        <div>
          <div className="px-3 mb-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
            Operações & Ativos
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleNav('assets')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'assets' || activeView === 'asset-detail'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              Equipamentos (CMDB)
            </button>

            <button
              onClick={() => handleNav('licenses')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'licenses'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 shrink-0" />
              Licenças de Software
            </button>

            <button
              onClick={() => handleNav('kb')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'kb' || activeView === 'kb-detail'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Base de Conhecimento
            </button>

            {isRole(['supervisor', 'admin']) && (
              <button
                onClick={() => handleNav('approvals')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors font-medium ${
                  activeView === 'approvals'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CheckSquare className="w-4 h-4 shrink-0 text-amber-400" />
                  Aprovações
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Inteligência & Relatórios */}
        <div>
          <div className="px-3 mb-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
            Inteligência & Métricas
          </div>
          <div className="space-y-0.5">
            {isRole(['agent', 'supervisor', 'admin']) && (
              <button
                onClick={() => handleNav('ai-assistant')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                  activeView === 'ai-assistant'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-300 hover:bg-slate-800 hover:text-indigo-200'
                }`}
              >
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
                Assistente Gemini AI
              </button>
            )}

            <button
              onClick={() => handleNav('reports')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                activeView === 'reports'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              Relatórios & SLAs
            </button>
          </div>
        </div>

        {/* Administração do Sistema */}
        {isRole(['supervisor', 'admin']) && (
          <div>
            <div className="px-3 mb-2 font-semibold text-[11px] uppercase tracking-wider text-slate-500">
              Administração
            </div>
            <div className="space-y-0.5">
              {isRole(['admin']) && (
                <button
                  onClick={() => handleNav('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                    activeView === 'settings'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  Utilizadores & Equipas
                </button>
              )}

              <button
                onClick={() => handleNav('sla-settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                  activeView === 'sla-settings'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                Políticas de SLA
              </button>

              {isRole(['admin']) && (
                <>
                  <button
                    onClick={() => handleNav('audit')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                      activeView === 'audit'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Registos de Auditoria
                  </button>

                  <button
                    onClick={() => handleNav('backups')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                      activeView === 'backups'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Database className="w-4 h-4 shrink-0" />
                    Backups & Restauro
                  </button>
                </>
              )}

              <button
                onClick={() => handleNav('health')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors font-medium ${
                  activeView === 'health'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4 shrink-0 text-emerald-400" />
                Diagnóstico & Saúde
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between items-center">
        <span>SW Cloud v1.0.0</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ONLINE
        </span>
      </div>
    </aside>
  );
}
