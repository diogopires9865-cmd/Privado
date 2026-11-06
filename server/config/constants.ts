// ========================================================================
// SW Service Desk v1.0 - Constantes e Enums de Domínio
// Empresa: SW Cloud Solutions
// ========================================================================

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  AGENT: 'agent',
  USER: 'user',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const TICKET_TYPES = {
  INCIDENTE: 'INCIDENTE',
  PEDIDO_SERVICO: 'PEDIDO_SERVICO',
  PROBLEMA: 'PROBLEMA',
  ALTERACAO: 'ALTERACAO',
} as const;

export type TicketType = (typeof TICKET_TYPES)[keyof typeof TICKET_TYPES];

export const TICKET_STATUS = {
  NOVO: 'NOVO',
  ATRIBUIDO: 'ATRIBUIDO',
  EM_PROGRESSO: 'EM_PROGRESSO',
  PENDENTE_CLIENTE: 'PENDENTE_CLIENTE',
  PENDENTE_TERCEIROS: 'PENDENTE_TERCEIROS',
  RESOLVIDO: 'RESOLVIDO',
  FECHADO: 'FECHADO',
  CANCELADO: 'CANCELADO',
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const IMPACT_LEVELS = {
  BAIXO: 'BAIXO',
  MEDIO: 'MEDIO',
  ALTO: 'ALTO',
  CRITICO: 'CRITICO',
} as const;

export type ImpactLevel = (typeof IMPACT_LEVELS)[keyof typeof IMPACT_LEVELS];

export const URGENCY_LEVELS = {
  BAIXA: 'BAIXA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  CRITICA: 'CRITICA',
} as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[keyof typeof URGENCY_LEVELS];

export const PRIORITIES = {
  P1_CRITICA: 'P1_CRITICA',
  P2_ALTA: 'P2_ALTA',
  P3_MEDIA: 'P3_MEDIA',
  P4_BAIXA: 'P4_BAIXA',
} as const;

export type PriorityLevel = (typeof PRIORITIES)[keyof typeof PRIORITIES];

export const SLA_STATUSES = {
  DENTRO_PRAZO: 'DENTRO_PRAZO',
  EM_RISCO: 'EM_RISCO',
  VIOLADO: 'VIOLADO',
  CUMPRIDO: 'CUMPRIDO',
} as const;

export type SLAStatus = (typeof SLA_STATUSES)[keyof typeof SLA_STATUSES];

export const ASSET_TYPES = {
  LAPTOP: 'LAPTOP',
  DESKTOP: 'DESKTOP',
  SERVER: 'SERVER',
  NETWORK: 'NETWORK',
  VM: 'VM',
  MOBILE: 'MOBILE',
  OTHER: 'OTHER',
} as const;

export type AssetType = (typeof ASSET_TYPES)[keyof typeof ASSET_TYPES];

export const ASSET_STATUSES = {
  EM_STOCK: 'EM_STOCK',
  ATRIBUIDO: 'ATRIBUIDO',
  EM_REPARACAO: 'EM_REPARACAO',
  RESERVADO: 'RESERVADO',
  ABATIDO: 'ABATIDO',
} as const;

export type AssetStatus = (typeof ASSET_STATUSES)[keyof typeof ASSET_STATUSES];

export const ASSET_ACTIONS = {
  CRIADO: 'CRIADO',
  ATRIBUIDO: 'ATRIBUIDO',
  DEVOLVIDO: 'DEVOLVIDO',
  TRANSFERIDO: 'TRANSFERIDO',
  MANUTENCAO: 'MANUTENCAO',
  ALTERACAO_DADOS: 'ALTERACAO_DADOS',
  ABATIDO: 'ABATIDO',
} as const;

export type AssetAction = (typeof ASSET_ACTIONS)[keyof typeof ASSET_ACTIONS];

export const COMMENT_TYPES = {
  PUBLIC: 'PUBLIC',
  INTERNAL_NOTE: 'INTERNAL_NOTE',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
} as const;

export type CommentType = (typeof COMMENT_TYPES)[keyof typeof COMMENT_TYPES];

export const APPROVAL_STATUSES = {
  PENDENTE: 'PENDENTE',
  APROVADO: 'APROVADO',
  REJEITADO: 'REJEITADO',
} as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[keyof typeof APPROVAL_STATUSES];

export const NOTIFICATION_TYPES = {
  TICKET_ASSIGNED: 'TICKET_ASSIGNED',
  TICKET_UPDATED: 'TICKET_UPDATED',
  SLA_WARNING: 'SLA_WARNING',
  APPROVAL_REQUEST: 'APPROVAL_REQUEST',
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
