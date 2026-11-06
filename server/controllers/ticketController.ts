// ========================================================================
// SW Service Desk v1.0 - Controlador de Gestão de Tickets (ITSM)
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute, transaction } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  calculatePriority,
  calculateSlaDueDates,
  evaluateSlaStatus,
} from '../services/slaEngine.js';
import { notificationService } from '../services/notificationService.js';
import {
  ImpactLevel,
  UrgencyLevel,
  PriorityLevel,
  TicketType,
  TicketStatus,
  TICKET_STATUS,
} from '../config/constants.js';

export const ticketController = {
  /**
   * Listar tickets com filtros avançados e paginação
   */
  async getTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const {
      status,
      priority,
      type,
      departmentId,
      teamId,
      agentId,
      requesterId,
      search,
      slaStatus,
      limit = '50',
      offset = '0',
    } = req.query;

    const whereClauses: string[] = [];
    const params: any[] = [];

    // RBAC: Utilizadores regulares só veem os seus próprios tickets
    if (user.role === 'user') {
      whereClauses.push('t.requester_id = ?');
      params.push(user.id);
    } else if (requesterId) {
      whereClauses.push('t.requester_id = ?');
      params.push(parseInt(String(requesterId), 10));
    }

    if (status) {
      whereClauses.push('t.status = ?');
      params.push(String(status));
    }
    if (priority) {
      whereClauses.push('t.priority = ?');
      params.push(String(priority));
    }
    if (type) {
      whereClauses.push('t.ticket_type = ?');
      params.push(String(type));
    }
    if (departmentId) {
      whereClauses.push('t.department_id = ?');
      params.push(parseInt(String(departmentId), 10));
    }
    if (teamId) {
      whereClauses.push('t.assigned_team_id = ?');
      params.push(parseInt(String(teamId), 10));
    }
    if (agentId) {
      if (agentId === 'unassigned') {
        whereClauses.push('t.assigned_agent_id IS NULL');
      } else {
        whereClauses.push('t.assigned_agent_id = ?');
        params.push(parseInt(String(agentId), 10));
      }
    }
    if (slaStatus) {
      whereClauses.push('t.sla_status = ?');
      params.push(String(slaStatus));
    }
    if (search) {
      const searchTerm = `%${String(search).trim()}%`;
      whereClauses.push('(t.ticket_number LIKE ? OR t.title LIKE ? OR t.description LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `SELECT count(*) as total FROM tickets t ${whereSql}`;
    const totalResult = await queryOne(countSql, params);
    const total = totalResult ? Number(totalResult.total) : 0;

    const listSql = `
      SELECT t.id, t.ticket_number, t.title, t.ticket_type, t.status, t.impact, t.urgency, t.priority,
             t.sla_status, t.first_response_due_at, t.first_responded_at, t.resolution_due_at, t.resolved_at,
             t.created_at, t.updated_at,
             req.full_name as requester_name, req.email as requester_email,
             agent.full_name as agent_name,
             team.name as team_name,
             cat.name as category_name,
             dept.name as department_name,
             asset.asset_tag, asset.name as asset_name
      FROM tickets t
      JOIN users req ON t.requester_id = req.id
      LEFT JOIN users agent ON t.assigned_agent_id = agent.id
      LEFT JOIN teams team ON t.assigned_team_id = team.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      LEFT JOIN departments dept ON t.department_id = dept.id
      LEFT JOIN assets asset ON t.asset_id = asset.id
      ${whereSql}
      ORDER BY 
        CASE t.priority 
          WHEN 'P1_CRITICA' THEN 1 
          WHEN 'P2_ALTA' THEN 2 
          WHEN 'P3_MEDIA' THEN 3 
          ELSE 4 
        END ASC,
        t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(String(limit), 10), parseInt(String(offset), 10));
    const tickets = await query(listSql, params);

    // Avaliar e atualizar dinamicamente o estado corrente de SLA
    const evaluatedTickets = tickets.map((t) => ({
      ...t,
      current_sla_status: evaluateSlaStatus(t.resolution_due_at, t.resolved_at, t.created_at),
    }));

    res.json({
      total,
      limit: parseInt(String(limit), 10),
      offset: parseInt(String(offset), 10),
      data: evaluatedTickets,
    });
  },

  /**
   * Obter detalhe completo de um ticket (360º view)
   */
  async getTicketById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = req.params.id;

    const ticket = await queryOne(
      `SELECT t.*,
              req.full_name as requester_name, req.email as requester_email, req.phone as requester_phone,
              agent.full_name as agent_name, agent.email as agent_email,
              team.name as team_name,
              dept.name as department_name,
              cat.name as category_name,
              subcat.name as subcategory_name,
              asset.asset_tag, asset.name as asset_name, asset.serial_number as asset_serial,
              catalog.name as catalog_item_name,
              sla.name as sla_policy_name
       FROM tickets t
       JOIN users req ON t.requester_id = req.id
       LEFT JOIN users agent ON t.assigned_agent_id = agent.id
       LEFT JOIN teams team ON t.assigned_team_id = team.id
       LEFT JOIN departments dept ON t.department_id = dept.id
       LEFT JOIN categories cat ON t.category_id = cat.id
       LEFT JOIN subcategories subcat ON t.subcategory_id = subcat.id
       LEFT JOIN assets asset ON t.asset_id = asset.id
       LEFT JOIN service_catalog_items catalog ON t.catalog_item_id = catalog.id
       LEFT JOIN sla_policies sla ON t.sla_policy_id = sla.id
       WHERE t.id = ? OR t.ticket_number = ?`,
      [ticketId, ticketId]
    );

    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    // RBAC: Utilizador normal só pode aceder ao seu próprio ticket
    if (user.role === 'user' && ticket.requester_id !== user.id) {
      res.status(403).json({ error: 'Não tem permissão para consultar este ticket.' });
      return;
    }

    // Obter comentários (filtrando notas internas se for user comum)
    const commentFilter = user.role === 'user' ? "AND c.comment_type = 'PUBLIC'" : '';
    const comments = await query(
      `SELECT c.id, c.comment_type, c.body, c.created_at,
              u.id as author_id, u.full_name as author_name, u.role as author_role
       FROM ticket_comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.ticket_id = ? ${commentFilter}
       ORDER BY c.created_at ASC`,
      [ticket.id]
    );

    // Obter anexos
    const attachments = await query(
      `SELECT a.id, a.file_name, a.file_size, a.mime_type, a.created_at,
              u.full_name as uploader_name
       FROM ticket_attachments a
       JOIN users u ON a.uploader_id = u.id
       WHERE a.ticket_id = ?
       ORDER BY a.created_at DESC`,
      [ticket.id]
    );

    // Obter histórico de alterações
    const history = await query(
      `SELECT h.id, h.event_type, h.old_value, h.new_value, h.description, h.created_at,
              u.full_name as actor_name
       FROM ticket_history h
       JOIN users u ON h.actor_id = u.id
       WHERE h.ticket_id = ?
       ORDER BY h.created_at ASC`,
      [ticket.id]
    );

    const currentSlaStatus = evaluateSlaStatus(ticket.resolution_due_at, ticket.resolved_at, ticket.created_at);

    res.json({
      ...ticket,
      current_sla_status: currentSlaStatus,
      comments,
      attachments,
      history,
    });
  },

  /**
   * Criar novo ticket (Cálculo automático de Prioridade e SLA)
   */
  async createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const {
      title,
      description,
      ticketType = 'INCIDENTE',
      impact = 'MEDIO',
      urgency = 'MEDIA',
      categoryId,
      subcategoryId,
      assetId,
      catalogItemId,
      customFields,
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: 'Título e descrição são campos obrigatórios.' });
      return;
    }

    // Calcular prioridade automaticamente via matriz ITIL: f(Impacto, Urgência)
    const priority = calculatePriority(impact as ImpactLevel, urgency as UrgencyLevel);

    // Obter política de SLA correspondente
    const slaPolicy = await queryOne(
      'SELECT id, first_response_minutes, resolution_minutes, business_hours_only FROM sla_policies WHERE priority = ? AND is_active = 1',
      [priority]
    );

    const baseDate = new Date();
    let firstResponseDueAt: Date | null = null;
    let resolutionDueAt: Date | null = null;
    let slaPolicyId: number | null = null;

    if (slaPolicy) {
      slaPolicyId = slaPolicy.id;
      const dues = calculateSlaDueDates(
        {
          first_response_minutes: slaPolicy.first_response_minutes,
          resolution_minutes: slaPolicy.resolution_minutes,
          business_hours_only: slaPolicy.business_hours_only === 1,
        },
        baseDate
      );
      firstResponseDueAt = dues.firstResponseDueAt;
      resolutionDueAt = dues.resolutionDueAt;
    }

    // Gerar número de ticket sequencial único: TCK-YYYY-XXXXX
    const year = baseDate.getFullYear();
    const countRes = await queryOne("SELECT count(*) as count FROM tickets WHERE ticket_number LIKE ?", [`TCK-${year}-%`]);
    const nextSeq = (countRes ? Number(countRes.count) : 0) + 1;
    const ticketNumber = `TCK-${year}-${String(nextSeq).padStart(5, '0')}`;

    // Determinar equipa responsável padrão com base na subcategoria
    let defaultTeamId: number | null = null;
    if (subcategoryId) {
      const subcat = await queryOne('SELECT default_team_id FROM subcategories WHERE id = ?', [subcategoryId]);
      if (subcat?.default_team_id) defaultTeamId = subcat.default_team_id;
    }

    const result = await transaction(async (tx) => {
      const insertRes = await tx.execute(
        `INSERT INTO tickets (
          ticket_number, title, description, ticket_type, status, impact, urgency, priority,
          requester_id, assigned_team_id, department_id, category_id, subcategory_id,
          asset_id, catalog_item_id, sla_policy_id, first_response_due_at, resolution_due_at,
          sla_status, custom_fields_json
        ) VALUES (?, ?, ?, ?, 'NOVO', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DENTRO_PRAZO', ?)`,
        [
          ticketNumber,
          title.trim(),
          description.trim(),
          ticketType,
          impact,
          urgency,
          priority,
          user.id,
          defaultTeamId,
          user.departmentId || null,
          categoryId || null,
          subcategoryId || null,
          assetId || null,
          catalogItemId || null,
          slaPolicyId,
          firstResponseDueAt ? firstResponseDueAt.toISOString().replace('T', ' ').slice(0, 19) : null,
          resolutionDueAt ? resolutionDueAt.toISOString().replace('T', ' ').slice(0, 19) : null,
          customFields ? JSON.stringify(customFields) : null,
        ]
      );

      const newTicketId = insertRes.insertId!;

      // Registar evento inicial na linha do tempo
      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'CRIADO', NULL, 'NOVO', ?)`,
        [newTicketId, user.id, `Ticket ${ticketNumber} aberto pelo solicitante ${user.fullName} com prioridade ${priority}.`]
      );

      return { ticketId: newTicketId, ticketNumber, priority };
    });

    // Se for ticket P1 Crítico, notificar Teams imediatamente
    if (priority === 'P1_CRITICA') {
      notificationService.sendTeamsWebhook(`INCIDENTE CRÍTICO P1: ${ticketNumber}`, title, [
        { name: 'Solicitante', value: user.fullName },
        { name: 'Prioridade', value: 'P1 CRÍTICA (24x7)' },
        { name: 'SLA Resolução', value: '2 Horas' },
      ]);
    }

    res.status(201).json({
      success: true,
      id: result.ticketId,
      ticketNumber: result.ticketNumber,
      priority: result.priority,
      message: 'Ticket criado com sucesso.',
    });
  },

  /**
   * Atribuir ticket a técnico ou equipa
   */
  async assignTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    const { agentId, teamId } = req.body;

    const ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    let agentName = 'Nenhum';
    if (agentId) {
      const agent = await queryOne('SELECT full_name FROM users WHERE id = ?', [agentId]);
      if (agent) agentName = agent.full_name;
    }

    const nextStatus = ticket.status === 'NOVO' ? 'ATRIBUIDO' : ticket.status;

    await transaction(async (tx) => {
      await tx.execute(
        'UPDATE tickets SET assigned_agent_id = ?, assigned_team_id = ?, status = ?, updated_at = datetime("now") WHERE id = ?',
        [agentId || null, teamId || ticket.assigned_team_id, nextStatus, ticketId]
      );

      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'ATRIBUIDO', ?, ?, ?)`,
        [
          ticketId,
          user.id,
          String(ticket.assigned_agent_id || 'Não atribuído'),
          agentName,
          `Ticket atribuído ao técnico ${agentName} por ${user.fullName}.`,
        ]
      );
    });

    if (agentId) {
      notificationService.createNotification(
        agentId,
        'Novo Ticket Atribuído',
        `Foi-lhe atribuído o ticket #${ticket.ticket_number}: ${ticket.title}`,
        'TICKET_ASSIGNED',
        `/tickets/${ticketId}`
      );
    }

    res.json({ success: true, message: `Ticket atribuído com sucesso a ${agentName}.` });
  },

  /**
   * Alterar estado do ticket (Ciclo de vida completo)
   */
  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    const { status, resolutionSummary, cancelReason } = req.body;

    if (!Object.values(TICKET_STATUS).includes(status)) {
      res.status(400).json({ error: 'Estado de ticket inválido.' });
      return;
    }

    const ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    let resolvedAt = ticket.resolved_at;
    let closedAt = ticket.closed_at;

    if (status === 'RESOLVIDO' && !resolvedAt) {
      resolvedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    if (status === 'FECHADO' && !closedAt) {
      closedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }

    await transaction(async (tx) => {
      await tx.execute(
        `UPDATE tickets 
         SET status = ?, resolved_at = ?, closed_at = ?, resolution_summary = ?, cancel_reason = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          status,
          resolvedAt,
          closedAt,
          resolutionSummary || ticket.resolution_summary,
          cancelReason || ticket.cancel_reason,
          ticketId,
        ]
      );

      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'STATUS_ALTERADO', ?, ?, ?)`,
        [
          ticketId,
          user.id,
          ticket.status,
          status,
          `Estado alterado de ${ticket.status} para ${status} por ${user.fullName}.`,
        ]
      );
    });

    // Notificar solicitante sobre resolução
    if (status === 'RESOLVIDO') {
      notificationService.createNotification(
        ticket.requester_id,
        'Ticket Resolvido',
        `O seu pedido #${ticket.ticket_number} foi marcado como resolvido. Por favor confirme.`,
        'TICKET_UPDATED',
        `/tickets/${ticketId}`
      );
    }

    res.json({ success: true, message: `Estado do ticket alterado para ${status}.` });
  },

  /**
   * Alterar Prioridade (recalcula SLA)
   */
  async updatePriority(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    const { impact, urgency } = req.body;

    const ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket não encontrado.' });
      return;
    }

    const newPriority = calculatePriority(impact as ImpactLevel, urgency as UrgencyLevel);

    const slaPolicy = await queryOne(
      'SELECT id, first_response_minutes, resolution_minutes, business_hours_only FROM sla_policies WHERE priority = ? AND is_active = 1',
      [newPriority]
    );

    let firstResponseDueAt: Date | null = null;
    let resolutionDueAt: Date | null = null;

    if (slaPolicy) {
      const dues = calculateSlaDueDates(
        {
          first_response_minutes: slaPolicy.first_response_minutes,
          resolution_minutes: slaPolicy.resolution_minutes,
          business_hours_only: slaPolicy.business_hours_only === 1,
        },
        new Date(ticket.created_at)
      );
      firstResponseDueAt = dues.firstResponseDueAt;
      resolutionDueAt = dues.resolutionDueAt;
    }

    await transaction(async (tx) => {
      await tx.execute(
        `UPDATE tickets 
         SET impact = ?, urgency = ?, priority = ?, first_response_due_at = ?, resolution_due_at = ?, updated_at = datetime('now')
         WHERE id = ?`,
        [
          impact,
          urgency,
          newPriority,
          firstResponseDueAt ? firstResponseDueAt.toISOString().replace('T', ' ').slice(0, 19) : ticket.first_response_due_at,
          resolutionDueAt ? resolutionDueAt.toISOString().replace('T', ' ').slice(0, 19) : ticket.resolution_due_at,
          ticketId,
        ]
      );

      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'PRIORIDADE_ALTERADA', ?, ?, ?)`,
        [
          ticketId,
          user.id,
          ticket.priority,
          newPriority,
          `Prioridade alterada de ${ticket.priority} para ${newPriority} (Impacto: ${impact}, Urgência: ${urgency}) por ${user.fullName}. Prazos de SLA recalculados.`,
        ]
      );
    });

    res.json({
      success: true,
      priority: newPriority,
      message: `Prioridade recalculada com sucesso para ${newPriority}.`,
    });
  },

  /**
   * Associar Ativo CMDB ao ticket
   */
  async linkAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    const { assetId } = req.body;

    const asset = await queryOne('SELECT asset_tag, name FROM assets WHERE id = ?', [assetId]);
    if (!asset) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }

    await transaction(async (tx) => {
      await tx.execute('UPDATE tickets SET asset_id = ?, updated_at = datetime("now") WHERE id = ?', [assetId, ticketId]);
      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'STATUS_ALTERADO', NULL, ?, ?)`,
        [ticketId, user.id, asset.asset_tag, `Equipamento ${asset.asset_tag} (${asset.name}) associado ao ticket por ${user.fullName}.`]
      );
    });

    res.json({ success: true, message: `Equipamento ${asset.asset_tag} associado com sucesso.` });
  },
};
