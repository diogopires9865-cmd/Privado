// ========================================================================
// SW Service Desk v1.0 - Controlador de Utilizadores, Equipas e Departamentos
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { security } from '../utils/security.js';
import { ROLES, UserRole } from '../config/constants.js';

export const userController = {
  /**
   * Listar todos os utilizadores
   */
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { role, departmentId, teamId, isActive, search } = req.query;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (role) {
      whereClauses.push('u.role = ?');
      params.push(String(role));
    }
    if (departmentId) {
      whereClauses.push('u.department_id = ?');
      params.push(parseInt(String(departmentId), 10));
    }
    if (teamId) {
      whereClauses.push('u.team_id = ?');
      params.push(parseInt(String(teamId), 10));
    }
    if (isActive !== undefined) {
      whereClauses.push('u.is_active = ?');
      params.push(isActive === 'true' || isActive === '1' ? 1 : 0);
    }
    if (search) {
      const term = `%${String(search).trim()}%`;
      whereClauses.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.job_title LIKE ?)');
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const users = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.department_id, u.team_id, u.phone, u.job_title,
              u.is_active, u.two_factor_enabled, u.created_at,
              d.name as department_name,
              t.name as team_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN teams t ON u.team_id = t.id
       ${whereSql}
       ORDER BY u.full_name ASC`,
      params
    );

    res.json(users);
  },

  /**
   * Criar novo utilizador (Gestão de RH e TI)
   */
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password, fullName, role = 'user', departmentId, teamId, phone, jobTitle } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Email, palavra-passe e nome completo são obrigatórios.' });
      return;
    }

    if (!Object.values(ROLES).includes(role as UserRole)) {
      res.status(400).json({ error: 'Papel de utilizador inválido.' });
      return;
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      res.status(400).json({ error: 'Já existe um utilizador registado com este email.' });
      return;
    }

    const passwordHash = await security.hashPassword(password);

    const insertRes = await execute(
      `INSERT INTO users (
        email, password_hash, full_name, role, department_id, team_id, phone, job_title, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        email.trim().toLowerCase(),
        passwordHash,
        fullName.trim(),
        role,
        departmentId || null,
        teamId || null,
        phone || null,
        jobTitle || null,
      ]
    );

    res.status(201).json({
      success: true,
      id: insertRes.insertId,
      message: 'Utilizador criado com sucesso.',
    });
  },

  /**
   * Atualizar dados de utilizador
   */
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = parseInt(req.params.id, 10);
    const { fullName, role, departmentId, teamId, phone, jobTitle, isActive, password } = req.body;

    const user = await queryOne('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
      res.status(404).json({ error: 'Utilizador não encontrado.' });
      return;
    }

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    if (fullName !== undefined) {
      updates.push('full_name = ?');
      params.push(fullName.trim());
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (departmentId !== undefined) {
      updates.push('department_id = ?');
      params.push(departmentId || null);
    }
    if (teamId !== undefined) {
      updates.push('team_id = ?');
      params.push(teamId || null);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (jobTitle !== undefined) {
      updates.push('job_title = ?');
      params.push(jobTitle);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    if (password) {
      const hash = await security.hashPassword(password);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    params.push(userId);
    await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Dados do utilizador atualizados com sucesso.' });
  },

  /**
   * Listar Departamentos
   */
  async getDepartments(req: AuthenticatedRequest, res: Response): Promise<void> {
    const departments = await query(`
      SELECT d.*, m.full_name as manager_name,
             (SELECT count(*) FROM users u WHERE u.department_id = d.id) as user_count
      FROM departments d
      LEFT JOIN users m ON d.manager_id = m.id
      ORDER BY d.name ASC
    `);
    res.json(departments);
  },

  /**
   * Listar Equipas
   */
  async getTeams(req: AuthenticatedRequest, res: Response): Promise<void> {
    const teams = await query(`
      SELECT t.*, d.name as department_name, l.full_name as leader_name,
             (SELECT count(*) FROM users u WHERE u.team_id = t.id) as member_count
      FROM teams t
      JOIN departments d ON t.department_id = d.id
      LEFT JOIN users l ON t.leader_id = l.id
      ORDER BY t.name ASC
    `);
    res.json(teams);
  },
};
