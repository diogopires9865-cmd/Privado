// ========================================================================
// SW Service Desk v1.0 - Definições de Tipos TypeScript para Frontend
// Empresa: SW Cloud Solutions
// ========================================================================

export type Role = 'admin' | 'supervisor' | 'agent' | 'user';
export type ImpactLevel = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
export type UrgencyLevel = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type PriorityLevel = 'P1_CRITICA' | 'P2_ALTA' | 'P3_MEDIA' | 'P4_BAIXA';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  departmentId?: number | null;
  departmentName?: string;
  teamId?: number | null;
  teamName?: string;
  phone?: string;
  jobTitle?: string;
  twoFactorEnabled?: boolean;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  ticket_type: 'INCIDENTE' | 'PEDIDO_SERVICO' | 'PROBLEMA' | 'ALTERACAO';
  status: 'NOVO' | 'ATRIBUIDO' | 'EM_PROGRESSO' | 'PENDENTE_CLIENTE' | 'PENDENTE_TERCEIROS' | 'RESOLVIDO' | 'FECHADO' | 'CANCELADO';
  impact: ImpactLevel;
  urgency: UrgencyLevel;
  priority: PriorityLevel;
  requester_id: number;
  requester_name: string;
  requester_email: string;
  requester_phone?: string;
  assigned_agent_id?: number | null;
  agent_name?: string;
  agent_email?: string;
  assigned_team_id?: number | null;
  team_name?: string;
  department_id?: number | null;
  department_name?: string;
  category_id?: number | null;
  category_name?: string;
  subcategory_id?: number | null;
  subcategory_name?: string;
  asset_id?: number | null;
  asset_tag?: string;
  asset_name?: string;
  asset_serial?: string;
  catalog_item_id?: number | null;
  catalog_item_name?: string;
  sla_policy_id?: number | null;
  first_response_due_at?: string | null;
  first_responded_at?: string | null;
  resolution_due_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  sla_status: 'DENTRO_PRAZO' | 'EM_RISCO' | 'VIOLADO' | 'CUMPRIDO';
  current_sla_status?: 'DENTRO_PRAZO' | 'EM_RISCO' | 'VIOLADO' | 'CUMPRIDO';
  resolution_summary?: string;
  cancel_reason?: string;
  custom_fields_json?: string;
  created_at: string;
  updated_at: string;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
  history?: TicketHistory[];
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  author_role: Role;
  comment_type: 'PUBLIC' | 'INTERNAL_NOTE' | 'SYSTEM_UPDATE';
  body: string;
  created_at: string;
}

export interface TicketAttachment {
  id: number;
  ticket_id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploader_name: string;
  created_at: string;
}

export interface TicketHistory {
  id: number;
  event_type: string;
  old_value?: string;
  new_value?: string;
  description: string;
  actor_name: string;
  created_at: string;
}

export interface Asset {
  id: number;
  asset_tag: string;
  serial_number: string;
  name: string;
  asset_type: 'LAPTOP' | 'DESKTOP' | 'SERVER' | 'NETWORK' | 'VM' | 'MOBILE' | 'OTHER';
  brand: string;
  model: string;
  status: 'EM_STOCK' | 'ATRIBUIDO' | 'EM_REPARACAO' | 'RESERVADO' | 'ABATIDO';
  current_user_id?: number | null;
  current_user_name?: string;
  current_user_email?: string;
  current_user_phone?: string;
  department_id?: number | null;
  department_name?: string;
  purchase_date?: string;
  warranty_end_date?: string;
  ip_address?: string;
  mac_address?: string;
  operating_system?: string;
  specs_json?: string;
  notes?: string;
  created_at: string;
  ticket_count?: number;
  history?: AssetHistory[];
  tickets?: Ticket[];
  licenses?: any[];
}

export interface AssetHistory {
  id: number;
  asset_id: number;
  action_type: 'CRIADO' | 'ATRIBUIDO' | 'DEVOLVIDO' | 'TRANSFERIDO' | 'MANUTENCAO' | 'ALTERACAO_DADOS' | 'ABATIDO';
  details: string;
  performed_by_name: string;
  previous_user_name?: string;
  new_user_name?: string;
  created_at: string;
}

export interface SoftwareLicense {
  id: number;
  software_name: string;
  vendor: string;
  license_key?: string;
  license_type: 'SUBSCRIPTION' | 'PERPETUAL' | 'OEM' | 'ENTERPRISE';
  total_seats: number;
  allocated_seats: number;
  real_allocated_seats?: number;
  expiration_date?: string;
  cost_per_seat?: number;
  purchase_order?: string;
  created_at: string;
}

export interface KBArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category_id: number;
  category_name?: string;
  author_name?: string;
  is_internal_only: number;
  is_published: number;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCatalogItem {
  id: number;
  name: string;
  code: string;
  description: string;
  category_id: number;
  category_name?: string;
  icon: string;
  requires_approval: number;
  approver_role: string;
  default_priority: string;
  form_schema?: {
    fields: Array<{
      name: string;
      label: string;
      type: 'text' | 'select' | 'date';
      options?: string[];
      required?: boolean;
    }>;
  };
}

export interface ServiceApproval {
  id: number;
  ticket_id: number;
  ticket_number: string;
  ticket_title: string;
  ticket_priority: string;
  ticket_created_at: string;
  catalog_item_name: string;
  requested_by_name: string;
  requested_by_email: string;
  requester_department?: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  approval_notes?: string;
  requested_at: string;
  decided_at?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  link_url?: string;
  is_read: number;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string;
  manager_name?: string;
  user_count?: number;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  description?: string;
  department_name?: string;
  leader_name?: string;
  member_count?: number;
}

export interface SLAPolicy {
  id: number;
  name: string;
  description?: string;
  priority: string;
  first_response_minutes: number;
  resolution_minutes: number;
  business_hours_only: number;
  is_active: number;
}
