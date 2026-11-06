// ========================================================================
// SW Service Desk v1.0 - Middleware de Registo de Auditoria
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { execute } from '../db/index.js';
import { logger } from '../utils/logger.js';

export async function logAuditAction(
  userId: number | null,
  action: string,
  resourceType: string,
  resourceId: string | number | null,
  oldValues: any,
  newValues: any,
  ipAddress: string,
  userAgent: string = ''
): Promise<void> {
  try {
    await execute(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values_json, new_values_json, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        resourceType,
        resourceId ? String(resourceId) : null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent.slice(0, 255),
      ]
    );
  } catch (err: any) {
    logger.error('Erro ao registar log de auditoria na base de dados:', {}, err);
  }
}

export function auditMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Apenas intercepta operações que alterem estado
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const originalJson = res.json;
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.get('user-agent') || '';
        const userId = req.user?.id || null;
        const resourceType = req.baseUrl.replace('/api/v1/', '') || 'resource';
        const resourceId = req.params.id || body?.id || null;

        logAuditAction(
          userId,
          `${req.method} ${req.path}`,
          resourceType,
          resourceId,
          null,
          req.method === 'DELETE' ? null : req.body,
          ipAddress,
          userAgent
        ).catch(() => {});
      }
      return originalJson.call(this, body);
    };
  }
  next();
}
