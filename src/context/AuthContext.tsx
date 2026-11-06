// ========================================================================
// SW Service Desk v1.0 - Auth Context & Navegação
// Empresa: SW Cloud Solutions
// ========================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedTicketId: number | null;
  setSelectedTicketId: (id: number | null) => void;
  selectedAssetId: number | null;
  setSelectedAssetId: (id: number | null) => void;
  selectedKBId: string | null;
  setSelectedKBId: (id: string | null) => void;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<any>;
  logout: () => Promise<void>;
  switchUserRole: (role: Role) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [selectedKBId, setSelectedKBId] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('sw_auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data);
    } catch {
      localStorage.removeItem('sw_auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    const res = await api.login({ email, password, twoFactorCode });
    if (res.token) {
      localStorage.setItem('sw_auth_token', res.token);
      setUser(res.user);
      setActiveView('dashboard');
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('sw_auth_token');
    setUser(null);
    setActiveView('login');
  };

  const switchUserRole = async (targetRole: Role) => {
    const credentials: Record<Role, { email: string; pass: string }> = {
      admin: { email: 'admin@swcloudsolutions.pt', pass: 'Admin123!@#' },
      supervisor: { email: 'supervisor@swcloudsolutions.pt', pass: 'Supervisor123!@#' },
      agent: { email: 'agente.cloud@swcloudsolutions.pt', pass: 'Agent123!@#' },
      user: { email: 'diogo.pires@swcloudsolutions.pt', pass: 'User123!@#' },
    };

    const cred = credentials[targetRole];
    if (cred) {
      setLoading(true);
      try {
        const res = await api.login({ email: cred.email, password: cred.pass });
        if (res.token) {
          localStorage.setItem('sw_auth_token', res.token);
          setUser(res.user);
          setActiveView('dashboard');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeView,
        setActiveView,
        selectedTicketId,
        setSelectedTicketId,
        selectedAssetId,
        setSelectedAssetId,
        selectedKBId,
        setSelectedKBId,
        login,
        logout,
        switchUserRole,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
}
