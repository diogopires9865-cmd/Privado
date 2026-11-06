// ========================================================================
// SW Service Desk v1.0 - Health Checks (Liveness & Readiness)
// Empresa: SW Cloud Solutions
// ========================================================================

import { Request, Response } from 'express';
import { queryOne, getActiveDialect } from '../db/index.js';

export const healthController = {
  /**
   * Health Check Liveness (/health/live)
   */
  getLive(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'SW Service Desk v1.0',
    });
  },

  /**
   * Health Check Readiness (/health/ready) - Valida ligação à base de dados
   */
  async getReady(_req: Request, res: Response): Promise<void> {
    try {
      const dbCheck = await queryOne('SELECT 1 as healthy');
      if (!dbCheck) {
        res.status(503).json({
          status: 'DOWN',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const usersCount = await queryOne('SELECT count(*) as count FROM users');
      const ticketsCount = await queryOne('SELECT count(*) as count FROM tickets');
      const memory = process.memoryUsage();

      res.status(200).json({
        status: 'UP',
        database: {
          status: 'connected',
          dialect: getActiveDialect().toUpperCase(),
          totalUsers: usersCount ? Number(usersCount.count) : 0,
          totalTickets: ticketsCount ? Number(ticketsCount.count) : 0,
        },
        memoryMb: {
          rss: Math.round(memory.rss / (1024 * 1024)),
          heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'DOWN',
        database: 'error',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
};
