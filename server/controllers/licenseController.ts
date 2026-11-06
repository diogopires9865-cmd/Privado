// ========================================================================
// SW Service Desk v1.0 - Controlador de Licenças de Software
// Empresa: SW Cloud Solutions
// ========================================================================

import { Response } from 'express';
import { query, queryOne, execute, transaction } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const licenseController = {
  /**
   * Listar licenças de software com assentos ocupados
   */
  async getLicenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    const licenses = await query(`
      SELECT l.*,
             (SELECT count(*) FROM asset_licenses al WHERE al.license_id = l.id) as real_allocated_seats
      FROM licenses l
      ORDER BY l.software_name ASC
    `);
    res.json(licenses);
  },

  /**
   * Criar registo de licença
   */
  async createLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    const {
      softwareName,
      vendor,
      licenseKey,
      licenseType,
      totalSeats = 1,
      expirationDate,
      costPerSeat,
      purchaseOrder,
    } = req.body;

    if (!softwareName || !vendor || !licenseType) {
      res.status(400).json({ error: 'Nome do software, fornecedor e tipo de licença são obrigatórios.' });
      return;
    }

    const insertRes = await execute(
      `INSERT INTO licenses (
        software_name, vendor, license_key, license_type, total_seats, allocated_seats,
        expiration_date, cost_per_seat, purchase_order
      ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        softwareName.trim(),
        vendor.trim(),
        licenseKey ? licenseKey.trim() : null,
        licenseType,
        totalSeats,
        expirationDate || null,
        costPerSeat || null,
        purchaseOrder || null,
      ]
    );

    res.status(201).json({
      success: true,
      id: insertRes.insertId,
      message: 'Licença registada com sucesso.',
    });
  },

  /**
   * Alocar licença a um equipamento ou utilizador
   */
  async allocateLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    const licenseId = parseInt(req.params.id, 10);
    const { assetId, userId } = req.body;

    if (!assetId) {
      res.status(400).json({ error: 'ID do equipamento é obrigatório para vincular licença.' });
      return;
    }

    const license = await queryOne('SELECT * FROM licenses WHERE id = ?', [licenseId]);
    if (!license) {
      res.status(404).json({ error: 'Licença não encontrada.' });
      return;
    }

    // Verificar se já excedeu a contagem de assentos
    const allocated = await queryOne('SELECT count(*) as count FROM asset_licenses WHERE license_id = ?', [licenseId]);
    if (allocated && Number(allocated.count) >= license.total_seats) {
      res.status(400).json({ error: `Capacidade máxima de assentos atingida (${license.total_seats} licenças).` });
      return;
    }

    await transaction(async (tx) => {
      await tx.execute(
        'INSERT INTO asset_licenses (asset_id, license_id, assigned_user_id) VALUES (?, ?, ?)',
        [assetId, licenseId, userId || null]
      );
      await tx.execute(
        'UPDATE licenses SET allocated_seats = (SELECT count(*) FROM asset_licenses WHERE license_id = ?) WHERE id = ?',
        [licenseId, licenseId]
      );
    });

    res.json({ success: true, message: 'Licença atribuída com sucesso.' });
  },

  /**
   * Desalocar licença
   */
  async deallocateLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    const licenseId = parseInt(req.params.id, 10);
    const assetLicenseId = parseInt(req.params.assetLicenseId, 10);

    await transaction(async (tx) => {
      await tx.execute('DELETE FROM asset_licenses WHERE id = ? AND license_id = ?', [assetLicenseId, licenseId]);
      await tx.execute(
        'UPDATE licenses SET allocated_seats = (SELECT count(*) FROM asset_licenses WHERE license_id = ?) WHERE id = ?',
        [licenseId, licenseId]
      );
    });

    res.json({ success: true, message: 'Licença desalocada com sucesso.' });
  },
};
