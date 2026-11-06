// ========================================================================
// SW Service Desk v1.0 - Cliente de API Frontend
// Empresa: SW Cloud Solutions
// ========================================================================

const API_BASE = '/api/v1';

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('sw_auth_token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Erro ${res.status}`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMsg);
  }

  // Se a resposta for vazia ou arquivo
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return res.text() as any;
}

export const api = {
  // Autenticação
  login: (data: { email: string; password: string; twoFactorCode?: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  setup2FA: () => request('/auth/2fa/setup', { method: 'POST' }),
  verify2FA: (token: string) => request('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ token }) }),
  disable2FA: (password: string) => request('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ password }) }),
  getSessions: () => request('/auth/sessions'),
  revokeSession: (id: number) => request(`/auth/sessions/${id}`, { method: 'DELETE' }),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Tickets
  getTickets: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/tickets${q ? '?' + q : ''}`);
  },
  getTicketById: (id: string | number) => request(`/tickets/${id}`),
  createTicket: (data: any) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  assignTicket: (id: number, data: { agentId?: number | null; teamId?: number | null }) =>
    request(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  updateTicketStatus: (id: number, data: { status: string; resolutionSummary?: string; cancelReason?: string }) =>
    request(`/tickets/${id}/status`, { method: 'POST', body: JSON.stringify(data) }),
  updateTicketPriority: (id: number, data: { impact: string; urgency: string }) =>
    request(`/tickets/${id}/priority`, { method: 'POST', body: JSON.stringify(data) }),
  linkAssetToTicket: (id: number, assetId: number) =>
    request(`/tickets/${id}/link-asset`, { method: 'POST', body: JSON.stringify({ assetId }) }),
  addComment: (id: number, data: { body: string; commentType?: string }) =>
    request(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  uploadAttachment: (ticketId: number, formData: FormData) =>
    request(`/tickets/${ticketId}/attachments`, { method: 'POST', body: formData }),

  // CMDB & Ativos
  getAssets: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/assets${q ? '?' + q : ''}`);
  },
  getAssetById: (id: string | number) => request(`/assets/${id}`),
  createAsset: (data: any) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  assignAsset: (id: number, data: { userId: number; notes?: string }) =>
    request(`/assets/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  transferAsset: (id: number, data: { newUserId: number; justification?: string }) =>
    request(`/assets/${id}/transfer`, { method: 'POST', body: JSON.stringify(data) }),
  returnAsset: (id: number, data: { reason?: string }) =>
    request(`/assets/${id}/return`, { method: 'POST', body: JSON.stringify(data) }),
  retireAsset: (id: number, data: { justification: string }) =>
    request(`/assets/${id}/retire`, { method: 'POST', body: JSON.stringify(data) }),

  // Licenças
  getLicenses: () => request('/licenses'),
  createLicense: (data: any) => request('/licenses', { method: 'POST', body: JSON.stringify(data) }),
  allocateLicense: (licenseId: number, data: { assetId: number; userId?: number }) =>
    request(`/licenses/${licenseId}/allocate`, { method: 'POST', body: JSON.stringify(data) }),
  deallocateLicense: (licenseId: number, assetLicenseId: number) =>
    request(`/licenses/${licenseId}/allocate/${assetLicenseId}`, { method: 'DELETE' }),

  // Base de Conhecimento
  getKBArticles: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/kb${q ? '?' + q : ''}`);
  },
  getKBArticleBySlug: (slugOrId: string) => request(`/kb/${slugOrId}`),
  createKBArticle: (data: any) => request('/kb', { method: 'POST', body: JSON.stringify(data) }),
  voteKBArticle: (id: number, helpful: boolean) =>
    request(`/kb/${id}/vote`, { method: 'POST', body: JSON.stringify({ helpful }) }),

  // Catálogo & Workflows
  getCatalogItems: () => request('/catalog'),
  submitCatalogRequest: (id: number, data: { formData: any; justification?: string; assetId?: number }) =>
    request(`/catalog/${id}/request`, { method: 'POST', body: JSON.stringify(data) }),
  getApprovals: () => request('/approvals'),
  decideApproval: (id: number, data: { status: 'APROVADO' | 'REJEITADO'; notes?: string }) =>
    request(`/approvals/${id}/decide`, { method: 'POST', body: JSON.stringify(data) }),

  // Utilizadores & Organização
  getUsers: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/users${q ? '?' + q : ''}`);
  },
  createUser: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDepartments: () => request('/departments'),
  getTeams: () => request('/teams'),

  // SLA
  getSLAPolicies: () => request('/sla/policies'),
  updateSLAPolicy: (id: number, data: any) => request(`/sla/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSLAMetrics: () => request('/sla/metrics'),

  // Relatórios
  getDashboardMetrics: () => request('/reports/dashboard'),
  getExportCsvUrl: () => `${API_BASE}/reports/export-csv`,

  // IA
  aiSummarizeTicket: (ticketId: number) =>
    request('/ai/summarize-ticket', { method: 'POST', body: JSON.stringify({ ticketId }) }),
  aiSuggestClassification: (title: string, description: string) =>
    request('/ai/suggest-classification', { method: 'POST', body: JSON.stringify({ title, description }) }),
  aiSuggestResponse: (ticketId: number) =>
    request('/ai/suggest-response', { method: 'POST', body: JSON.stringify({ ticketId }) }),
  aiSearchKB: (queryText: string) =>
    request('/ai/search-kb', { method: 'POST', body: JSON.stringify({ query: queryText }) }),

  // Notificações
  getNotifications: () => request('/notifications'),
  markNotificationAsRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // Administração & Auditoria
  getAuditLogs: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${q ? '?' + q : ''}`);
  },
  getBackups: () => request('/admin/backups'),
  createBackup: () => request('/admin/backups', { method: 'POST' }),
  restoreBackup: (sqlContent: string) => request('/admin/restore', { method: 'POST', body: JSON.stringify({ sqlContent }) }),
  getSettings: () => request('/admin/settings'),
  updateSetting: (key: string, value: string) => request(`/admin/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  // Health
  getHealthStatus: () => fetch('/health/ready').then((r) => r.json()),
};
