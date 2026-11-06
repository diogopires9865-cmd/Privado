// ========================================================================
// SW Service Desk v1.0 - Barra Superior (Header)
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Shield,
  CheckCheck,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { NotificationItem, Role } from '../../types/index.js';
import { Badge } from '../common/Badge.js';

export function Header() {
  const { user, logout, switchUserRole, setActiveView, setSelectedTicketId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  const handleMarkAsRead = async (id: number, linkUrl?: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      if (linkUrl) {
        if (linkUrl.startsWith('/tickets/')) {
          const tId = parseInt(linkUrl.replace('/tickets/', ''), 10);
          setSelectedTicketId(tId);
          setActiveView('ticket-detail');
        } else if (linkUrl === '/approvals') {
          setActiveView('approvals');
        }
        setShowNotifications(false);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveView('tickets');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
      {/* Barra de Pesquisa Global */}
      <form onSubmit={handleSearchSubmit} className="relative w-80 max-w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar tickets, código TCK, equipamentos..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
        />
      </form>

      {/* Ações e Menus da Direita */}
      <div className="flex items-center gap-3">
        {/* Seletor Rápido de Papel para Testes (RBAC Switcher) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
            title="Alternar utilizador para testar outros perfis de permissão"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Perfil:</span>
            <span className="font-semibold capitalize text-sky-800">{user?.role}</span>
            <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
          </button>

          {showRoleSwitcher && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Testar Permissões (RBAC)
                </span>
              </div>
              {(['admin', 'supervisor', 'agent', 'user'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchUserRole(r);
                    setShowRoleSwitcher(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    user?.role === r ? 'bg-sky-50/70 font-semibold text-sky-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="capitalize">{r === 'admin' ? 'Administrador TI' : r === 'supervisor' ? 'Supervisor ITSM' : r === 'agent' ? 'Técnico de Suporte' : 'Utilizador / Solicitante'}</span>
                    <span className="text-[10px] text-slate-400">
                      {r === 'admin' ? 'admin@swcloudsolutions.pt' : r === 'supervisor' ? 'supervisor@swcloudsolutions.pt' : r === 'agent' ? 'agente.cloud@swcloudsolutions.pt' : 'diogo.pires@swcloudsolutions.pt'}
                    </span>
                  </div>
                  {user?.role === r && <span className="w-2 h-2 rounded-full bg-sky-600"></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notificações Internas */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors"
            aria-label="Abrir Notificações"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">Nenhuma notificação recente.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id, n.link_url)}
                      className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                        n.is_read === 0 ? 'bg-sky-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menu de Utilizador */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">{user?.fullName}</span>
              <span className="text-[11px] text-slate-500 leading-tight capitalize">{user?.role}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="role" value={user?.role || 'user'} />
                  {user?.twoFactorEnabled ? (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      2FA Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      2FA Inativo
                    </span>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setActiveView('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  Segurança & Configurações
                </button>
                <button
                  onClick={() => {
                    setActiveView('ai-assistant');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Assistente Gemini AI
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Terminar Sessão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
