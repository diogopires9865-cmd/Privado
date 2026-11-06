// ========================================================================
// SW Service Desk v1.0 - Controlador Administrativo, Auditoria e Backups
// Empresa: SW Cloud Solutions
// ========================================================================

import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { query, queryOne, execute, getActiveDialect } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { backupService } from '../services/backupService.js';

export const adminController = {
  /**
   * Listar registos de auditoria
   */
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { resourceType, userId, limit = '100', offset = '0' } = req.query;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (resourceType) {
      whereClauses.push('a.resource_type = ?');
      params.push(String(resourceType));
    }
    if (userId) {
      whereClauses.push('a.user_id = ?');
      params.push(parseInt(String(userId), 10));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const logs = await query(
      `SELECT a.*, u.full_name as user_name, u.email as user_email
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ${whereSql}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(String(limit), 10), parseInt(String(offset), 10)]
    );

    const countRes = await queryOne(`SELECT count(*) as total FROM audit_logs a ${whereSql}`, params);
    const total = countRes ? Number(countRes.total) : 0;

    res.json({ total, data: logs });
  },

  /**
   * Criar snapshot de backup
   */
  async createBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const snapshot = await backupService.createBackupSnapshot();
    res.json({
      success: true,
      message: 'Snapshot de backup gerado com sucesso.',
      snapshot,
    });
  },

  /**
   * Descarregar ficheiro de backup
   */
  async downloadBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { filename } = req.params;
    const backups = backupService.listBackups();
    const found = backups.find((b) => b.filename === filename);

    if (!found) {
      res.status(404).json({ error: 'Ficheiro de backup não encontrado.' });
      return;
    }

    const safeFilename = path.basename(filename);
    const backupDir = backupService.getSecureBackupDir();
    const filepath = path.join(backupDir, safeFilename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: 'Ficheiro não existe no disco.' });
      return;
    }

    res.download(filepath, safeFilename);
  },

  /**
   * Listar backups disponíveis
   */
  async getBackups(req: AuthenticatedRequest, res: Response): Promise<void> {
    const backups = backupService.listBackups();
    res.json(backups);
  },

  /**
   * Restaurar snapshot de backup
   */
  async restoreBackup(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { sqlContent } = req.body;

    if (!sqlContent) {
      res.status(400).json({ error: 'Conteúdo SQL de restauro obrigatório.' });
      return;
    }

    const result = await backupService.restoreBackup(sqlContent);
    res.json({
      success: true,
      message: `Restauro executado com sucesso (${result.statementsExecuted} instruções executadas).`,
    });
  },

  /**
   * Obter configurações do sistema
   */
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const settings = await query('SELECT * FROM system_settings ORDER BY category, setting_key');
    res.json(settings);
  },

  /**
   * Atualizar configuração
   */
  async updateSetting(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { key } = req.params;
    const { value } = req.body;

    await execute('UPDATE system_settings SET setting_value = ?, updated_at = datetime("now") WHERE setting_key = ?', [
      String(value),
      key,
    ]);

    res.json({ success: true, message: `Configuração '${key}' atualizada.` });
  },
};
