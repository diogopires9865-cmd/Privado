// ========================================================================
// SW Service Desk v1.0 - Controlador de Autenticação e Gestão de Sessões
// Empresa: SW Cloud Solutions
// ========================================================================

import { Request, Response } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { security } from '../utils/security.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const authController = {
  /**
   * Login inicial (Palavra-passe + verificação de 2FA obrigatório ou opcional)
   */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password, twoFactorCode } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email e palavra-passe são obrigatórios.' });
      return;
    }

    const user = await queryOne(
      'SELECT id, email, password_hash, full_name, role, department_id, team_id, is_active, two_factor_enabled, two_factor_secret FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    if (user.is_active !== 1) {
      res.status(403).json({ error: 'A sua conta encontra-se inativa. Por favor contacte o administrador.' });
      return;
    }

    const passwordMatch = await security.comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    // Se 2FA estiver ativado na conta
    if (user.two_factor_enabled === 1) {
      if (!twoFactorCode) {
        // Requer segundo fator
        res.status(200).json({
          requires2FA: true,
          message: 'Autenticação de dois fatores necessária. Introduza o código do seu autenticador.',
          email: user.email,
        });
        return;
      }

      // Validar código TOTP
      const isValid = security.verify2FAToken(twoFactorCode, user.two_factor_secret);
      if (!isValid) {
        res.status(401).json({ error: 'Código de autenticação 2FA inválido ou expirado.' });
        return;
      }
    }

    // Gerar token de sessão e registar na base de dados
    const rawSessionToken = `${user.id}_${Date.now()}_${Math.random()}`;
    const tokenHash = security.hashSessionToken(rawSessionToken);
    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.get('user-agent') || 'Browser';

    const sessionRes = await execute(
      `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, datetime('now', '+8 hours'))`,
      [user.id, tokenHash, ipAddress, userAgent.slice(0, 255)]
    );

    const token = security.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionRes.insertId,
    });

    // Definir cookie seguro
    res.cookie('sw_session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas
    });

    logger.info('Sessão iniciada com sucesso:', { userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        departmentId: user.department_id,
        teamId: user.team_id,
        twoFactorEnabled: user.two_factor_enabled === 1,
      },
    });
  },

  /**
   * Obter perfil do utilizador autenticado (/me)
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const user = await queryOne(
      `SELECT u.id, u.email, u.full_name, u.role, u.department_id, u.team_id, u.phone, u.job_title, 
              u.two_factor_enabled, d.name as department_name, t.name as team_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN teams t ON u.team_id = t.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ error: 'Utilizador não encontrado.' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      departmentId: user.department_id,
      departmentName: user.department_name,
      teamId: user.team_id,
      teamName: user.team_name,
      phone: user.phone,
      jobTitle: user.job_title,
      twoFactorEnabled: user.two_factor_enabled === 1,
    });
  },

  /**
   * Configuração de 2FA (gera segredo e QR Code)
   */
  async setup2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const { otpauthUrl, base32 } = security.generate2FASecret(req.user.email);
    const qrCodeDataUrl = await security.generateQRCode(otpauthUrl!);
    const { plainCodes, hashedCodes } = security.generateRecoveryCodes();

    // Guardar segredo temporário
    await execute(
      'UPDATE users SET two_factor_secret = ?, two_factor_recovery_codes = ? WHERE id = ?',
      [base32, JSON.stringify(hashedCodes), req.user.id]
    );

    res.json({
      secret: base32,
      qrCode: qrCodeDataUrl,
      recoveryCodes: plainCodes,
    });
  },

  /**
   * Confirmação e Ativação do 2FA
   */
  async verifyAndEnable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Código 2FA de confirmação obrigatório.' });
      return;
    }

    const user = await queryOne('SELECT two_factor_secret FROM users WHERE id = ?', [req.user.id]);
    if (!user?.two_factor_secret) {
      res.status(400).json({ error: 'Configuração de 2FA não iniciada.' });
      return;
    }

    const isValid = security.verify2FAToken(token, user.two_factor_secret);
    if (!isValid) {
      res.status(400).json({ error: 'Código incorreto. Por favor tente novamente.' });
      return;
    }

    await execute('UPDATE users SET two_factor_enabled = 1 WHERE id = ?', [req.user.id]);
    logger.info('2FA ativado com sucesso para o utilizador:', { userId: req.user.id });

    res.json({ success: true, message: 'Autenticação de dois fatores ativada com sucesso!' });
  },

  /**
   * Desativação de 2FA
   */
  async disable2FA(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({ error: 'Palavra-passe de confirmação necessária.' });
      return;
    }

    const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const match = await security.comparePassword(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Palavra-passe incorreta.' });
      return;
    }

    await execute('UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?', [req.user.id]);
    logger.info('2FA desativado pelo utilizador:', { userId: req.user.id });

    res.json({ success: true, message: '2FA desativado.' });
  },

  /**
   * Listar sessões ativas do utilizador corrente
   */
  async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const sessions = await query(
      `SELECT id, ip_address, user_agent, created_at, last_active_at, expires_at 
       FROM user_sessions 
       WHERE user_id = ? AND expires_at > datetime('now')
       ORDER BY last_active_at DESC`,
      [req.user.id]
    );

    res.json(sessions.map((s) => ({
      ...s,
      isCurrent: s.id === req.user?.sessionId,
    })));
  },

  /**
   * Revogar sessão remota
   */
  async revokeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const sessionId = parseInt(req.params.id, 10);
    await execute('DELETE FROM user_sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    res.json({ success: true, message: 'Sessão revogada com sucesso.' });
  },

  /**
   * Terminar sessão (Logout)
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user?.sessionId) {
      await execute('DELETE FROM user_sessions WHERE id = ?', [req.user.sessionId]);
    }
    res.clearCookie('sw_session_token');
    res.json({ success: true, message: 'Sessão terminada.' });
  },
};
