import { ImpactLevel, UrgencyLevel, PriorityLevel } from '../types/index';

/**
 * Matriz ITIL v4 de Cálculo Automático de Prioridade:
 * f(Impacto, Urgência) -> Prioridade
 */
export function calculatePriority(impact: ImpactLevel, urgency: UrgencyLevel): PriorityLevel {
  if (impact === 'CRITICO') {
    if (urgency === 'CRITICA' || urgency === 'ALTA') return 'P1_CRITICA';
    if (urgency === 'MEDIA') return 'P2_ALTA';
    return 'P3_MEDIA';
  }

  if (impact === 'ALTO') {
    if (urgency === 'CRITICA') return 'P1_CRITICA';
    if (urgency === 'ALTA') return 'P2_ALTA';
    if (urgency === 'MEDIA') return 'P3_MEDIA';
    return 'P4_BAIXA';
  }

  if (impact === 'MEDIO') {
    if (urgency === 'CRITICA') return 'P2_ALTA';
    if (urgency === 'ALTA') return 'P3_MEDIA';
    if (urgency === 'MEDIA') return 'P3_MEDIA';
    return 'P4_BAIXA';
  }

  // BAIXO
  if (urgency === 'CRITICA') return 'P3_MEDIA';
  if (urgency === 'ALTA') return 'P3_MEDIA';
  return 'P4_BAIXA';
}
