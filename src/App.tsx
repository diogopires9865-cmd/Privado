import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tickets } from './pages/Tickets';
import { TicketDetail } from './pages/TicketDetail';
import { CreateTicket } from './pages/CreateTicket';
import { ServiceCatalog } from './pages/ServiceCatalog';
import { Approvals } from './pages/Approvals';
import { AssetsCMDB } from './pages/AssetsCMDB';
import { AssetDetail } from './pages/AssetDetail';
import { Licenses } from './pages/Licenses';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { AIAssistantView } from './pages/AIAssistantView';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { SystemHealth } from './pages/SystemHealth';

const AppContent: React.FC = () => {
  const { user, loading, activeView } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-400">A carregar SW Service Desk Interno...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tickets':
        return <Tickets />;
      case 'ticket-detail':
        return <TicketDetail />;
      case 'create-ticket':
        return <CreateTicket />;
      case 'catalog':
        return <ServiceCatalog />;
      case 'approvals':
        return <Approvals />;
      case 'assets':
        return <AssetsCMDB />;
      case 'asset-detail':
        return <AssetDetail />;
      case 'licenses':
        return <Licenses />;
      case 'kb':
        return <KnowledgeBase />;
      case 'ai-assistant':
        return <AIAssistantView />;
      case 'reports':
        return <Reports />;
      case 'audit':
        return <AuditLogs />;
      case 'settings':
      case 'sla-settings':
      case 'backups':
        return <Settings />;
      case 'health':
        return <SystemHealth />;
      default:
        return <Dashboard />;
    }
  };

  return <AppLayout>{renderView()}</AppLayout>;
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
