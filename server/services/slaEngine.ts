// ========================================================================
// SW Service Desk v1.0 - Motor de SLA e Matriz de Prioridade
// Empresa: SW Cloud Solutions
// ========================================================================

import {
  ImpactLevel,
  UrgencyLevel,
  PriorityLevel,
  PRIORITIES,
  SLAStatus,
  SLA_STATUSES,
} from '../config/constants.js';

/**
 * Matriz ITIL v4 de Cálculo Automático de Prioridade:
 * f(Impacto, Urgência) -> Prioridade
 */
export function calculatePriority(impact: ImpactLevel, urgency: UrgencyLevel): PriorityLevel {
  if (impact === 'CRITICO') {
    if (urgency === 'CRITICA' || urgency === 'ALTA') return PRIORITIES.P1_CRITICA;
    if (urgency === 'MEDIA') return PRIORITIES.P2_ALTA;
    return PRIORITIES.P3_MEDIA;
  }

  if (impact === 'ALTO') {
    if (urgency === 'CRITICA') return PRIORITIES.P1_CRITICA;
    if (urgency === 'ALTA') return PRIORITIES.P2_ALTA;
    if (urgency === 'MEDIA') return PRIORITIES.P3_MEDIA;
    return PRIORITIES.P4_BAIXA;
  }

  if (impact === 'MEDIO') {
    if (urgency === 'CRITICA') return PRIORITIES.P2_ALTA;
    if (urgency === 'ALTA') return PRIORITIES.P3_MEDIA;
    if (urgency === 'MEDIA') return PRIORITIES.P3_MEDIA;
    return PRIORITIES.P4_BAIXA;
  }

  // BAIXO
  if (urgency === 'CRITICA') return PRIORITIES.P3_MEDIA;
  if (urgency === 'ALTA') return PRIORITIES.P3_MEDIA;
  return PRIORITIES.P4_BAIXA;
}

/**
 * Adiciona minutos úteis (Calendário 8x5: Segunda a Sexta, das 09:00 às 18:00)
 */
export function addBusinessMinutes(startDate: Date, minutesToAdd: number): Date {
  const current = new Date(startDate.getTime());
  let remainingMinutes = minutesToAdd;

  // Ajustar se começar fora do horário útil (noite ou fim de semana)
  adjustToNextBusinessWindow(current);

  while (remainingMinutes > 0) {
    // Fim do horário de trabalho do dia corrente: 18:00
    const endOfDay = new Date(current.getTime());
    endOfDay.setHours(18, 0, 0, 0);

    const availableMinutesToday = Math.max(0, Math.floor((endOfDay.getTime() - current.getTime()) / (60 * 1000)));

    if (remainingMinutes <= availableMinutesToday) {
      current.setTime(current.getTime() + remainingMinutes * 60 * 1000);
      remainingMinutes = 0;
    } else {
      remainingMinutes -= availableMinutesToday;
      // Avança para o início do próximo dia útil: 09:00
      advanceToNextBusinessDay(current);
    }
  }

  return current;
}

function adjustToNextBusinessWindow(date: Date): void {
  // 0 = Domingo, 6 = Sábado
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
    date.setHours(9, 0, 0, 0);
  }

  const hours = date.getHours();
  if (hours < 9) {
    date.setHours(9, 0, 0, 0);
  } else if (hours >= 18) {
    advanceToNextBusinessDay(date);
  }
}

function advanceToNextBusinessDay(date: Date): void {
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
}

/**
 * Calcula prazos de SLA (Primeira resposta e Resolução)
 */
export function calculateSlaDueDates(
  policy: {
    first_response_minutes: number;
    resolution_minutes: number;
    business_hours_only: boolean;
  },
  baseDate: Date = new Date()
): { firstResponseDueAt: Date; resolutionDueAt: Date } {
  if (!policy.business_hours_only) {
    // 24x7 contínuo
    const firstResponseDueAt = new Date(baseDate.getTime() + policy.first_response_minutes * 60 * 1000);
    const resolutionDueAt = new Date(baseDate.getTime() + policy.resolution_minutes * 60 * 1000);
    return { firstResponseDueAt, resolutionDueAt };
  }

  const firstResponseDueAt = addBusinessMinutes(baseDate, policy.first_response_minutes);
  const resolutionDueAt = addBusinessMinutes(baseDate, policy.resolution_minutes);
  return { firstResponseDueAt, resolutionDueAt };
}

/**
 * Avalia o estado corrente de cumprimento do SLA
 */
export function evaluateSlaStatus(
  resolutionDueAt: string | Date | null,
  resolvedAt: string | Date | null,
  createdAt: string | Date = new Date(),
  now: Date = new Date()
): SLAStatus {
  if (!resolutionDueAt) return SLA_STATUSES.DENTRO_PRAZO;

  const dueDate = new Date(resolutionDueAt).getTime();
  const createdDate = new Date(createdAt).getTime();

  // Se já foi resolvido
  if (resolvedAt) {
    const resolvedDate = new Date(resolvedAt).getTime();
    return resolvedDate <= dueDate ? SLA_STATUSES.CUMPRIDO : SLA_STATUSES.VIOLADO;
  }

  // Ainda em aberto
  const nowTime = now.getTime();
  if (nowTime > dueDate) {
    return SLA_STATUSES.VIOLADO;
  }

  const totalWindow = dueDate - createdDate;
  const elapsed = nowTime - createdDate;

  if (totalWindow > 0 && elapsed / totalWindow >= 0.75) {
    return SLA_STATUSES.EM_RISCO;
  }

  return SLA_STATUSES.DENTRO_PRAZO;
}
