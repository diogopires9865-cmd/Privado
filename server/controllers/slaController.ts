// ========================================================================
// SW Service Desk v1.0 - Controlador de Políticas e Métricas de SLA
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const slaController = {
  /**
   * Obter políticas de SLA
   */
  async getPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
    const policies = await query('SELECT * FROM sla_policies ORDER BY priority ASC');
    res.json(policies);
  },

  /**
   * Atualizar política de SLA
   */
  async updatePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
    const policyId = parseInt(req.params.id, 10);
    const { firstResponseMinutes, resolutionMinutes, businessHoursOnly, isActive } = req.body;

    await execute(
      `UPDATE sla_policies 
       SET first_response_minutes = ?, resolution_minutes = ?, business_hours_only = ?, is_active = ?
       WHERE id = ?`,
      [firstResponseMinutes, resolutionMinutes, businessHoursOnly ? 1 : 0, isActive ? 1 : 0, policyId]
    );

    res.json({ success: true, message: 'Política de SLA atualizada com sucesso.' });
  },

  /**
   * Resumo executivo de cumprimento de SLA
   */
  async getSlaMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const totalTickets = await queryOne('SELECT count(*) as count FROM tickets');
    const withinSla = await queryOne("SELECT count(*) as count FROM tickets WHERE sla_status IN ('DENTRO_PRAZO', 'CUMPRIDO')");
    const atRisk = await queryOne("SELECT count(*) as count FROM tickets WHERE sla_status = 'EM_RISCO'");
    const violated = await queryOne("SELECT count(*) as count FROM tickets WHERE sla_status = 'VIOLADO'");

    const total = totalResult(totalTickets);
    const compliant = totalResult(withinSla);
    const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

    res.json({
      total,
      compliant,
      atRisk: totalResult(atRisk),
      violated: totalResult(violated),
      complianceRate,
    });
  },
};

function totalResult(row: any): number {
  return row ? Number(row.count) : 0;
}
