// ========================================================================
// SW Service Desk v1.0 - Controlador de Relatórios e Métricas
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const reportController = {
  /**
   * Métricas do Dashboard em tempo real
   */
  async getDashboardMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;

    // Condição de filtro de utilizador
    const userFilter = user.role === 'user' ? `WHERE requester_id = ${user.id}` : '';
    const userAnd = user.role === 'user' ? `AND requester_id = ${user.id}` : '';

    // Contadores de tickets por estado
    const totalTicketsRes = await queryOne(`SELECT count(*) as count FROM tickets ${userFilter}`);
    const openTicketsRes = await queryOne(`SELECT count(*) as count FROM tickets WHERE status IN ('NOVO', 'ATRIBUIDO', 'EM_PROGRESSO', 'PENDENTE_CLIENTE', 'PENDENTE_TERCEIROS') ${userAnd}`);
    const criticalP1Res = await queryOne(`SELECT count(*) as count FROM tickets WHERE priority = 'P1_CRITICA' AND status NOT IN ('RESOLVIDO', 'FECHADO', 'CANCELADO') ${userAnd}`);
    const resolvedRes = await queryOne(`SELECT count(*) as count FROM tickets WHERE status IN ('RESOLVIDO', 'FECHADO') ${userAnd}`);

    // Distribuição por Prioridade
    const priorityStats = await query(`
      SELECT priority, count(*) as count
      FROM tickets
      ${userFilter}
      GROUP BY priority
    `);

    // Distribuição por Categoria
    const categoryStats = await query(`
      SELECT c.name as category_name, count(t.id) as count
      FROM categories c
      LEFT JOIN tickets t ON t.category_id = c.id ${userAnd}
      GROUP BY c.id, c.name
    `);

    // Distribuição por Equipa
    const teamStats = await query(`
      SELECT tm.name as team_name, count(t.id) as count
      FROM teams tm
      LEFT JOIN tickets t ON t.assigned_team_id = tm.id AND t.status NOT IN ('RESOLVIDO', 'FECHADO', 'CANCELADO')
      GROUP BY tm.id, tm.name
    `);

    // Métricas CMDB
    const assetStats = await query(`
      SELECT status, count(*) as count
      FROM assets
      GROUP BY status
    `);

    // Tickets recentes
    const recentTickets = await query(`
      SELECT t.id, t.ticket_number, t.title, t.status, t.priority, t.created_at,
             req.full_name as requester_name
      FROM tickets t
      JOIN users req ON t.requester_id = req.id
      ${userFilter}
      ORDER BY t.created_at DESC
      LIMIT 8
    `);

    res.json({
      summary: {
        total: getCount(totalTicketsRes),
        open: getCount(openTicketsRes),
        criticalP1: getCount(criticalP1Res),
        resolved: getCount(resolvedRes),
      },
      priorityStats,
      categoryStats,
      teamStats,
      assetStats,
      recentTickets,
    });
  },

  /**
   * Exportar tickets em formato CSV
   */
  async exportTicketsCsv(req: AuthenticatedRequest, res: Response): Promise<void> {
    const tickets = await query(`
      SELECT t.ticket_number, t.title, t.ticket_type, t.status, t.priority,
             t.first_responded_at, t.resolved_at, t.created_at,
             req.full_name as requester, agent.full_name as agent,
             cat.name as category
      FROM tickets t
      JOIN users req ON t.requester_id = req.id
      LEFT JOIN users agent ON t.assigned_agent_id = agent.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      ORDER BY t.created_at DESC
    `);

    let csv = 'Número,Título,Tipo,Estado,Prioridade,Solicitante,Técnico,Categoria,Criado Em,Resolvido Em\n';
    for (const t of tickets) {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      csv += `${escape(t.ticket_number)},${escape(t.title)},${escape(t.ticket_type)},${escape(t.status)},${escape(t.priority)},${escape(t.requester)},${escape(t.agent)},${escape(t.category)},${escape(t.created_at)},${escape(t.resolved_at)}\n`;
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="tickets_sw_servicedesk.csv"');
    res.send(csv);
  },
};

function getCount(row: any): number {
  return row ? Number(row.count) : 0;
}
