// ========================================================================
// SW Service Desk v1.0 - Middleware de Autorização Baseada em Papéis (RBAC)
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../config/constants.js';

export function checkRolePermission(userRole: string, allowedRoles: UserRole[]): boolean {
  if (userRole === 'admin') return true; // Administrador tem privilégio total
  return allowedRoles.includes(userRole as UserRole);
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }

    if (!checkRolePermission(req.user.role, allowedRoles)) {
      res.status(403).json({
        error: 'Acesso negado. Não tem permissões suficientes para executar esta operação.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
}
