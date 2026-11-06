// ========================================================================
// SW Service Desk v1.0 - Indicador Visual de SLA e Temporizador
// Empresa: SW Cloud Solutions
// ========================================================================

import React from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface SLAIndicatorProps {
  label: string;
  dueAt: string | null | undefined;
  completedAt?: string | null | undefined;
  status: 'DENTRO_PRAZO' | 'EM_RISCO' | 'VIOLADO' | 'CUMPRIDO';
  className?: string;
}

export function SLAIndicator({ label, dueAt, completedAt, status, className = '' }: SLAIndicatorProps) {
  if (!dueAt) return null;

  const dueDate = new Date(dueAt);
  const now = new Date();
  const isCompleted = !!completedAt;
  const isOverdue = !isCompleted && now > dueDate;

  // Formatação de data
  const formattedDate = dueDate.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cálculo de tempo restante
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60)) / (1000 * 60));

  let timeText = '';
  if (isCompleted) {
    timeText = 'Cumprido';
  } else if (isOverdue) {
    timeText = `Excedido há ${diffHours}h ${diffMinutes}m`;
  } else {
    timeText = `Resta ${diffHours}h ${diffMinutes}m`;
  }

  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg p-2.5 border ${
      status === 'VIOLADO'
        ? 'bg-rose-50 text-rose-800 border-rose-200'
        : status === 'EM_RISCO'
        ? 'bg-amber-50 text-amber-800 border-amber-300'
        : status === 'CUMPRIDO'
        ? 'bg-blue-50 text-blue-800 border-blue-200'
        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
    } ${className}`}>
      <div className="shrink-0">
        {status === 'VIOLADO' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
        {status === 'EM_RISCO' && <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />}
        {status === 'CUMPRIDO' && <CheckCircle className="w-4 h-4 text-blue-600" />}
        {status === 'DENTRO_PRAZO' && <Clock className="w-4 h-4 text-emerald-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-1">
          <span className="font-semibold truncate">{label}</span>
          <span className="font-medium font-mono text-[11px] shrink-0">{timeText}</span>
        </div>
        <div className="text-[11px] opacity-80 mt-0.5">Prazo: {formattedDate}</div>
      </div>
    </div>
  );
}
