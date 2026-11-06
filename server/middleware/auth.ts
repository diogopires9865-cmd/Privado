// ========================================================================
// SW Service Desk v1.0 - Middleware de Autenticação e Sessão
// Empresa: SW Cloud Solutions
// ========================================================================

import { Request, Response, NextFunction } from 'express';
import { security, TokenPayload } from '../utils/security.js';
import { queryOne } from '../db/index.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: 'admin' | 'supervisor' | 'agent' | 'user';
  fullName: string;
  departmentId?: number | null;
  teamId?: number | null;
  sessionId?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.sw_session_token) {
      token = req.cookies.sw_session_token;
    }

    if (!token) {
      res.status(401).json({ error: 'Não autenticado. Por favor inicie sessão.' });
      return;
    }

    let payload: TokenPayload;
    try {
      payload = security.verifyToken(token);
    } catch (err: any) {
      res.status(401).json({ error: 'Sessão expirada ou inválida. Por favor volte a iniciar sessão.' });
      return;
    }

    // Verificar se o utilizador continua ativo na base de dados
    const user = await queryOne(
      'SELECT id, email, role, full_name, department_id, team_id, is_active FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!user || user.is_active !== 1) {
      res.status(401).json({ error: 'Conta de utilizador suspensa ou desativada.' });
      return;
    }

    // Verificar se a sessão é válida e não foi revogada (se sessionId existir)
    if (payload.sessionId) {
      const session = await queryOne(
        "SELECT id FROM user_sessions WHERE id = ? AND user_id = ? AND expires_at > datetime('now')",
        [payload.sessionId, user.id]
      );
      if (!session) {
        res.status(401).json({ error: 'Sessão remota revogada ou expirada.' });
        return;
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      departmentId: user.department_id,
      teamId: user.team_id,
      sessionId: payload.sessionId,
    };

    next();
  } catch (err: any) {
    logger.error('Erro no middleware de autenticação:', {}, err);
    res.status(500).json({ error: 'Erro interno ao validar autenticação.' });
  }
}
