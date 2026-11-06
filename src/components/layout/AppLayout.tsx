// ========================================================================
// SW Service Desk v1.0 - Layout Principal da Aplicação
// Empresa: SW Cloud Solutions
// ========================================================================

import React from 'react';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-100/70 font-sans text-slate-900 antialiased selection:bg-sky-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
