// ========================================================================
// SW Service Desk v1.0 - Controlador de Gestão de Ativos e CMDB
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute, transaction } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ASSET_STATUSES, ASSET_TYPES, AssetStatus } from '../config/constants.js';

export const assetController = {
  /**
   * Listar equipamentos do CMDB com filtros avançados
   */
  async getAssets(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const { status, type, userId, departmentId, search } = req.query;

    const whereClauses: string[] = [];
    const params: any[] = [];

    // Se for utilizador comum, só pode ver os equipamentos atribuídos a si
    if (user.role === 'user') {
      whereClauses.push('a.current_user_id = ?');
      params.push(user.id);
    } else if (userId) {
      whereClauses.push('a.current_user_id = ?');
      params.push(parseInt(String(userId), 10));
    }

    if (status) {
      whereClauses.push('a.status = ?');
      params.push(String(status));
    }
    if (type) {
      whereClauses.push('a.asset_type = ?');
      params.push(String(type));
    }
    if (departmentId) {
      whereClauses.push('a.department_id = ?');
      params.push(parseInt(String(departmentId), 10));
    }
    if (search) {
      const term = `%${String(search).trim()}%`;
      whereClauses.push('(a.asset_tag LIKE ? OR a.serial_number LIKE ? OR a.name LIKE ? OR a.model LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const listSql = `
      SELECT a.*,
             u.full_name as current_user_name, u.email as current_user_email,
             d.name as department_name,
             (SELECT count(*) FROM tickets t WHERE t.asset_id = a.id) as ticket_count
      FROM assets a
      LEFT JOIN users u ON a.current_user_id = u.id
      LEFT JOIN departments d ON a.department_id = d.id
      ${whereSql}
      ORDER BY a.created_at DESC
    `;

    const assets = await query(listSql, params);
    res.json(assets);
  },

  /**
   * Ficha detalhada do equipamento (dados, especificações, tickets associados e histórico de custódia)
   */
  async getAssetById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const assetId = req.params.id;

    const asset = await queryOne(
      `SELECT a.*,
              u.full_name as current_user_name, u.email as current_user_email, u.phone as current_user_phone,
              d.name as department_name
       FROM assets a
       LEFT JOIN users u ON a.current_user_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = ? OR a.asset_tag = ?`,
      [assetId, assetId]
    );

    if (!asset) {
      res.status(404).json({ error: 'Equipamento não encontrado no CMDB.' });
      return;
    }

    // RBAC: Utilizador comum só pode ver equipamentos atribuídos a si
    if (user.role === 'user' && asset.current_user_id !== user.id) {
      res.status(403).json({ error: 'Acesso negado a este equipamento.' });
      return;
    }

    // Histórico de alterações e transferências do ativo
    const history = await query(
      `SELECT h.id, h.action_type, h.details, h.created_at,
              actor.full_name as performed_by_name,
              prev.full_name as previous_user_name,
              curr.full_name as new_user_name
       FROM asset_history h
       JOIN users actor ON h.performed_by_user_id = actor.id
       LEFT JOIN users prev ON h.previous_user_id = prev.id
       LEFT JOIN users curr ON h.new_user_id = curr.id
       WHERE h.asset_id = ?
       ORDER BY h.created_at DESC`,
      [asset.id]
    );

    // Tickets associados a este equipamento
    const tickets = await query(
      `SELECT t.id, t.ticket_number, t.title, t.ticket_type, t.status, t.priority, t.created_at,
              req.full_name as requester_name
       FROM tickets t
       JOIN users req ON t.requester_id = req.id
       WHERE t.asset_id = ?
       ORDER BY t.created_at DESC`,
      [asset.id]
    );

    // Licenças de software associadas
    const licenses = await query(
      `SELECT l.id, l.software_name, l.vendor, l.license_type, al.assigned_at
       FROM asset_licenses al
       JOIN licenses l ON al.license_id = l.id
       WHERE al.asset_id = ?`,
      [asset.id]
    );

    res.json({
      ...asset,
      history,
      tickets,
      licenses,
    });
  },

  /**
   * Registar novo equipamento no inventário CMDB (Entrada em Stock)
   */
  async createAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const {
      assetTag,
      serialNumber,
      name,
      assetType,
      brand,
      model,
      departmentId,
      purchaseDate,
      warrantyEndDate,
      ipAddress,
      macAddress,
      operatingSystem,
      specs,
      notes,
    } = req.body;

    if (!assetTag || !serialNumber || !name || !assetType || !brand || !model) {
      res.status(400).json({ error: 'Tag de ativo, número de série, nome, tipo, marca e modelo são obrigatórios.' });
      return;
    }

    // Verificar duplicação de tag ou serial
    const existing = await queryOne(
      'SELECT id FROM assets WHERE asset_tag = ? OR serial_number = ?',
      [assetTag.trim(), serialNumber.trim()]
    );
    if (existing) {
      res.status(400).json({ error: 'Já existe um equipamento com este Asset Tag ou Número de Série.' });
      return;
    }

    const result = await transaction(async (tx) => {
      const insertRes = await tx.execute(
        `INSERT INTO assets (
          asset_tag, serial_number, name, asset_type, brand, model, status,
          current_user_id, department_id, purchase_date, warranty_end_date,
          ip_address, mac_address, operating_system, specs_json, notes
        ) VALUES (?, ?, ?, ?, ?, ?, 'EM_STOCK', NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assetTag.trim().toUpperCase(),
          serialNumber.trim(),
          name.trim(),
          assetType,
          brand.trim(),
          model.trim(),
          departmentId || null,
          purchaseDate || null,
          warrantyEndDate || null,
          ipAddress || null,
          macAddress || null,
          operatingSystem || null,
          specs ? JSON.stringify(specs) : null,
          notes || null,
        ]
      );

      const newAssetId = insertRes.insertId!;

      await tx.execute(
        `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
         VALUES (?, 'CRIADO', ?, NULL, NULL, ?)`,
        [newAssetId, user.id, `Equipamento ${assetTag} (${name}) registado no inventário em stock por ${user.fullName}.`]
      );

      return newAssetId;
    });

    res.status(201).json({
      success: true,
      id: result,
      message: `Equipamento ${assetTag} criado com sucesso no CMDB.`,
    });
  },

  /**
   * Atribuir equipamento a colaborador (Registo de custódia)
   */
  async assignAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const assetId = parseInt(req.params.id, 10);
    const { userId, notes } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'Colaborador de destino é obrigatório.' });
      return;
    }

    const asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!asset) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }

    if (asset.status === 'ABATIDO') {
      res.status(400).json({ error: 'Não é possível atribuir um equipamento que se encontra abatido/desativado.' });
      return;
    }

    const targetUser = await queryOne('SELECT id, full_name, email, department_id FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      res.status(404).json({ error: 'Utilizador não encontrado.' });
      return;
    }

    await transaction(async (tx) => {
      await tx.execute(
        `UPDATE assets 
         SET current_user_id = ?, department_id = ?, status = 'ATRIBUIDO', updated_at = datetime('now')
         WHERE id = ?`,
        [targetUser.id, targetUser.department_id || asset.department_id, assetId]
      );

      await tx.execute(
        `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
         VALUES (?, 'ATRIBUIDO', ?, ?, ?, ?)`,
        [
          assetId,
          user.id,
          asset.current_user_id,
          targetUser.id,
          `Equipamento atribuído a ${targetUser.full_name} (${targetUser.email}). ${notes ? 'Obs: ' + notes : ''}`,
        ]
      );
    });

    res.json({
      success: true,
      message: `Equipamento ${asset.asset_tag} atribuído com sucesso a ${targetUser.full_name}.`,
    });
  },

  /**
   * Transferir equipamento entre utilizadores (A -> B)
   */
  async transferAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const assetId = parseInt(req.params.id, 10);
    const { newUserId, justification } = req.body;

    if (!newUserId) {
      res.status(400).json({ error: 'Novo colaborador de destino é obrigatório.' });
      return;
    }

    const asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!asset) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }

    const previousUser = asset.current_user_id
      ? await queryOne('SELECT full_name FROM users WHERE id = ?', [asset.current_user_id])
      : null;

    const newUser = await queryOne('SELECT id, full_name, email, department_id FROM users WHERE id = ?', [newUserId]);
    if (!newUser) {
      res.status(404).json({ error: 'Novo utilizador não encontrado.' });
      return;
    }

    await transaction(async (tx) => {
      await tx.execute(
        `UPDATE assets 
         SET current_user_id = ?, department_id = ?, status = 'ATRIBUIDO', updated_at = datetime('now')
         WHERE id = ?`,
        [newUser.id, newUser.department_id || asset.department_id, assetId]
      );

      await tx.execute(
        `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
         VALUES (?, 'TRANSFERIDO', ?, ?, ?, ?)`,
        [
          assetId,
          user.id,
          asset.current_user_id,
          newUser.id,
          `Custódia transferida de ${previousUser?.full_name || 'Stock'} para ${newUser.full_name}. ${justification ? 'Justificação: ' + justification : ''}`,
        ]
      );
    });

    res.json({
      success: true,
      message: `Equipamento ${asset.asset_tag} transferido para ${newUser.full_name}.`,
    });
  },

  /**
   * Devolver equipamento para stock (Recolha)
   */
  async returnToStock(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const assetId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    const asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!asset) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }

    const previousUserId = asset.current_user_id;
    const previousUser = previousUserId
      ? await queryOne('SELECT full_name FROM users WHERE id = ?', [previousUserId])
      : null;

    await transaction(async (tx) => {
      await tx.execute(
        `UPDATE assets 
         SET current_user_id = NULL, status = 'EM_STOCK', updated_at = datetime('now')
         WHERE id = ?`,
        [assetId]
      );

      await tx.execute(
        `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
         VALUES (?, 'DEVOLVIDO', ?, ?, NULL, ?)`,
        [
          assetId,
          user.id,
          previousUserId,
          `Equipamento devolvido por ${previousUser?.full_name || 'colaborador'} e colocado em stock. ${reason ? 'Motivo: ' + reason : ''}`,
        ]
      );
    });

    res.json({ success: true, message: `Equipamento ${asset.asset_tag} devolvido ao stock.` });
  },

  /**
   * Abater / Retirar equipamento de serviço
   */
  async retireAsset(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    const assetId = parseInt(req.params.id, 10);
    const { justification } = req.body;

    if (!justification) {
      res.status(400).json({ error: 'Justificação de abate/desativação é obrigatória.' });
      return;
    }

    const asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
    if (!asset) {
      res.status(404).json({ error: 'Equipamento não encontrado.' });
      return;
    }

    await transaction(async (tx) => {
      // 1. Atualizar ativo para ABATIDO
      await tx.execute(
        `UPDATE assets 
         SET status = 'ABATIDO', current_user_id = NULL, updated_at = datetime('now')
         WHERE id = ?`,
        [assetId]
      );

      // 2. Registar no histórico
      await tx.execute(
        `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
         VALUES (?, 'ABATIDO', ?, ?, NULL, ?)`,
        [
          assetId,
          user.id,
          asset.current_user_id,
          `Equipamento retirado de serviço definitivamente (Abate). Justificação: ${justification}`,
        ]
      );

      // 3. Libertar licenças associadas
      await tx.execute('DELETE FROM asset_licenses WHERE asset_id = ?', [assetId]);
    });

    res.json({
      success: true,
      message: `Equipamento ${asset.asset_tag} abatido e retirado de serviço com sucesso.`,
    });
  },
};
