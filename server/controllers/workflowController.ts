// ========================================================================
// SW Service Desk v1.0 - Controlador de Catálogo de Serviços e Aprovações
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute, transaction } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notificationService.js';
import { calculateSlaDueDates } from '../services/slaEngine.js';

export const workflowController = {
  /**
   * Listar itens do Catálogo de Serviços
   */
  async getCatalogItems(req: AuthenticatedRequest, res: Response): Promise<void> {
    const items = await query(`
      SELECT s.*, c.name as category_name
      FROM service_catalog_items s
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = 1
      ORDER BY s.name ASC
    `);

    res.json(
      items.map((item) => ({
        ...item,
        form_schema: item.form_schema_json ? JSON.parse(item.form_schema_json) : null,
      }))
    );
  },

  /**
   * Submeter um Pedido de Serviço a partir do Catálogo
   */
  async submitCatalogRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const catalogItemId = parseInt(req.params.id, 10);
    const { formData, justification, assetId } = req.body;

    const catalogItem = await queryOne('SELECT * FROM service_catalog_items WHERE id = ? AND is_active = 1', [catalogItemId]);
    if (!catalogItem) {
      res.status(404).json({ error: 'Item de catálogo não encontrado.' });
      return;
    }

    const priority = catalogItem.default_priority || 'P3_MEDIA';

    // Obter SLA
    const slaPolicy = await queryOne(
      'SELECT id, first_response_minutes, resolution_minutes, business_hours_only FROM sla_policies WHERE priority = ? AND is_active = 1',
      [priority]
    );

    const baseDate = new Date();
    let firstResponseDueAt: Date | null = null;
    let resolutionDueAt: Date | null = null;

    if (slaPolicy) {
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

    const year = baseDate.getFullYear();
    const countRes = await queryOne("SELECT count(*) as count FROM tickets WHERE ticket_number LIKE ?", [`TCK-${year}-%`]);
    const nextSeq = (countRes ? Number(countRes.count) : 0) + 1;
    const ticketNumber = `TCK-${year}-${String(nextSeq).padStart(5, '0')}`;

    const title = `[Pedido de Serviço] ${catalogItem.name}`;
    const description = `Pedido submetido via Catálogo de Serviços.\n${justification ? 'Justificação: ' + justification + '\n' : ''}Dados do Formulário: ${JSON.stringify(formData, null, 2)}`;

    const result = await transaction(async (tx) => {
      // 1. Criar ticket
      const insertTicket = await tx.execute(
        `INSERT INTO tickets (
          ticket_number, title, description, ticket_type, status, impact, urgency, priority,
          requester_id, category_id, catalog_item_id, sla_policy_id, asset_id,
          first_response_due_at, resolution_due_at, sla_status, custom_fields_json
        ) VALUES (?, ?, ?, 'PEDIDO_SERVICO', 'NOVO', 'MEDIO', 'MEDIA', ?, ?, ?, ?, ?, ?, ?, ?, 'DENTRO_PRAZO', ?)`,
        [
          ticketNumber,
          title,
          description,
          priority,
          user.id,
          catalogItem.category_id,
          catalogItem.id,
          slaPolicy ? slaPolicy.id : null,
          assetId || null,
          firstResponseDueAt ? firstResponseDueAt.toISOString().replace('T', ' ').slice(0, 19) : null,
          resolutionDueAt ? resolutionDueAt.toISOString().replace('T', ' ').slice(0, 19) : null,
          JSON.stringify(formData || {}),
        ]
      );

      const ticketId = insertTicket.insertId!;

      // 2. Registar histórico inicial
      await tx.execute(
        `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
         VALUES (?, ?, 'CRIADO', NULL, 'NOVO', ?)`,
        [ticketId, user.id, `Pedido de serviço '${catalogItem.name}' submetido por ${user.fullName}.`]
      );

      // 3. Se requer aprovação prévia, criar registo em service_approvals
      let approvalId: number | null = null;
      if (catalogItem.requires_approval === 1) {
        const appRes = await tx.execute(
          `INSERT INTO service_approvals (ticket_id, catalog_item_id, requested_by_id, status)
           VALUES (?, ?, ?, 'PENDENTE')`,
          [ticketId, catalogItem.id, user.id]
        );
        approvalId = appRes.insertId!;

        await tx.execute(
          `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
           VALUES (?, ?, 'APROVACAO_SOLICITADA', NULL, 'PENDENTE', 'Aprovação de supervisor necessária antes da execução.')`,
          [ticketId, user.id]
        );
      }

      return { ticketId, ticketNumber, requiresApproval: catalogItem.requires_approval === 1, approvalId };
    });

    // Se requer aprovação, notificar supervisores
    if (result.requiresApproval) {
      const supervisors = await query("SELECT id FROM users WHERE role IN ('supervisor', 'admin') AND is_active = 1");
      for (const sup of supervisors) {
        notificationService.createNotification(
          sup.id,
          'Aprovação Pendente no Service Desk',
          `Novo pedido de '${catalogItem.name}' requer a sua validação hierárquica.`,
          'APPROVAL_REQUEST',
          '/approvals'
        );
      }
    }

    res.status(201).json({
      success: true,
      ticketId: result.ticketId,
      ticketNumber: result.ticketNumber,
      requiresApproval: result.requiresApproval,
      message: result.requiresApproval
        ? 'Pedido submetido com sucesso! Encontra-se pendente de aprovação hierárquica.'
        : 'Pedido submetido e encaminhado para atendimento.',
    });
  },

  /**
   * Listar aprovações pendentes (para supervisores e admins)
   */
  async getPendingApprovals(req: AuthenticatedRequest, res: Response): Promise<void> {
    const approvals = await query(`
      SELECT a.*,
             t.ticket_number, t.title as ticket_title, t.priority as ticket_priority, t.created_at as ticket_created_at,
             c.name as catalog_item_name,
             u.full_name as requested_by_name, u.email as requested_by_email,
             d.name as requester_department
      FROM service_approvals a
      JOIN tickets t ON a.ticket_id = t.id
      JOIN service_catalog_items c ON a.catalog_item_id = c.id
      JOIN users u ON a.requested_by_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY a.requested_at DESC
    `);

    res.json(approvals);
  },

  /**
   * Decisão de aprovação (Aprovar ou Rejeitar)
   */
  async decideApproval(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const approvalId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;

    if (!['APROVADO', 'REJEITADO'].includes(status)) {
      res.status(400).json({ error: 'Decisão inválida. Deve ser APROVADO ou REJEITADO.' });
      return;
    }

    const approval = await queryOne('SELECT * FROM service_approvals WHERE id = ?', [approvalId]);
    if (!approval) {
      res.status(404).json({ error: 'Registo de aprovação não encontrado.' });
      return;
    }

    if (approval.status !== 'PENDENTE') {
      res.status(400).json({ error: 'Este pedido já foi decidido anteriormente.' });
      return;
    }

    await transaction(async (tx) => {
      // 1. Atualizar registo de aprovação
      await tx.execute(
        `UPDATE service_approvals 
         SET status = ?, approver_id = ?, approval_notes = ?, decided_at = datetime('now')
         WHERE id = ?`,
        [status, user.id, notes || null, approvalId]
      );

      // 2. Atualizar ticket associado
      if (status === 'APROVADO') {
        await tx.execute(
          `UPDATE tickets SET status = 'NOVO', updated_at = datetime('now') WHERE id = ?`,
          [approval.ticket_id]
        );
        await tx.execute(
          `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
           VALUES (?, ?, 'APROVADO', 'PENDENTE', 'APROVADO', ?)`,
          [approval.ticket_id, user.id, `Pedido aprovado pelo supervisor ${user.fullName}. ${notes ? 'Obs: ' + notes : ''}`]
        );
      } else {
        await tx.execute(
          `UPDATE tickets SET status = 'CANCELADO', cancel_reason = ?, updated_at = datetime('now') WHERE id = ?`,
          [notes || 'Rejeitado por supervisor', approval.ticket_id]
        );
        await tx.execute(
          `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
           VALUES (?, ?, 'REJEITADO', 'PENDENTE', 'REJEITADO', ?)`,
          [approval.ticket_id, user.id, `Pedido rejeitado por ${user.fullName}. Motivo: ${notes || 'Sem justificação adicional'}`]
        );
      }
    });

    // Notificar solicitante
    notificationService.createNotification(
      approval.requested_by_id,
      status === 'APROVADO' ? 'Pedido Aprovado' : 'Pedido Rejeitado',
      status === 'APROVADO'
        ? `O seu pedido foi aprovado pelo supervisor ${user.fullName} e está em processamento.`
        : `O seu pedido foi rejeitado. Motivo: ${notes || 'Critério de chefia'}.`,
      'APPROVAL_REQUEST',
      `/tickets/${approval.ticket_id}`
    );

    res.json({
      success: true,
      status,
      message: `Pedido ${status === 'APROVADO' ? 'aprovado' : 'rejeitado'} com sucesso.`,
    });
  },
};
