// ========================================================================
// SW Service Desk v1.0 - Componente de Badges de Estado e Prioridade
// Empresa: SW Cloud Solutions
// ========================================================================

import React from 'react';

interface BadgeProps {
  variant: 'status' | 'priority' | 'type' | 'role' | 'sla';
  value: string;
  className?: string;
}

export function Badge({ variant, value, className = '' }: BadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
  let label = value;

  if (variant === 'priority') {
    switch (value) {
      case 'P1_CRITICA':
        colorClass = 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50 font-semibold';
        label = 'P1 Crítica (24x7)';
        break;
      case 'P2_ALTA':
        colorClass = 'bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-900/50 font-semibold';
        label = 'P2 Alta';
        break;
      case 'P3_MEDIA':
        colorClass = 'bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-900/50';
        label = 'P3 Média';
        break;
      case 'P4_BAIXA':
        colorClass = 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800';
        label = 'P4 Baixa';
        break;
    }
  } else if (variant === 'status') {
    switch (value) {
      case 'NOVO':
        colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
        label = 'Novo';
        break;
      case 'ATRIBUIDO':
        colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        label = 'Atribuído';
        break;
      case 'EM_PROGRESSO':
        colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
        label = 'Em Progresso';
        break;
      case 'PENDENTE_CLIENTE':
        colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
        label = 'Pendente Cliente';
        break;
      case 'PENDENTE_TERCEIROS':
        colorClass = 'bg-orange-50 text-orange-700 border-orange-200';
        label = 'Pendente Terceiros';
        break;
      case 'RESOLVIDO':
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
        label = 'Resolvido';
        break;
      case 'FECHADO':
        colorClass = 'bg-slate-100 text-slate-700 border-slate-300';
        label = 'Fechado';
        break;
      case 'CANCELADO':
        colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
        label = 'Cancelado';
        break;
      case 'EM_STOCK':
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Em Stock';
        break;
      case 'ABATIDO':
        colorClass = 'bg-slate-100 text-slate-500 border-slate-300 line-through';
        label = 'Abatido';
        break;
    }
  } else if (variant === 'sla') {
    switch (value) {
      case 'DENTRO_PRAZO':
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        label = 'Dentro do SLA';
        break;
      case 'EM_RISCO':
        colorClass = 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
        label = 'SLA em Risco';
        break;
      case 'VIOLADO':
        colorClass = 'bg-rose-50 text-rose-700 border-rose-300 font-bold';
        label = 'SLA Violado';
        break;
      case 'CUMPRIDO':
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        label = 'SLA Cumprido';
        break;
    }
  } else if (variant === 'role') {
    switch (value) {
      case 'admin':
        colorClass = 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold';
        label = 'Administrador';
        break;
      case 'supervisor':
        colorClass = 'bg-purple-100 text-purple-800 border-purple-200 font-semibold';
        label = 'Supervisor ITSM';
        break;
      case 'agent':
        colorClass = 'bg-sky-100 text-sky-800 border-sky-200';
        label = 'Técnico Cloud';
        break;
      case 'user':
        colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
        label = 'Utilizador';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border tracking-tight ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
