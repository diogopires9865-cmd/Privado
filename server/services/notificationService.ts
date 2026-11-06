// ========================================================================
// SW Service Desk v1.0 - Serviço de Notificações Internas, Email e Teams
// Empresa: SW Cloud Solutions
// ========================================================================

import { execute, query } from '../db/index.js';
import { NotificationType } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export const notificationService = {
  /**
   * Cria uma notificação interna no sistema
   */
  async createNotification(
    userId: number,
    title: string,
    message: string,
    type: NotificationType,
    linkUrl?: string
  ): Promise<void> {
    try {
      await execute(
        `INSERT INTO notifications (user_id, title, message, notification_type, link_url, is_read)
         VALUES (?, ?, ?, ?, ?, 0)`,
        [userId, title, message, type, linkUrl || null]
      );
      logger.info('Notificação interna gerada:', { userId, title, type });
    } catch (err: any) {
      logger.error('Erro ao gravar notificação interna:', { userId }, err);
    }
  },

  /**
   * Notifica por email (com template HTML profissional)
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    // Template de email institucional da SW Cloud Solutions
    const brandedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 20px; margin: 0; letter-spacing: -0.5px; }
          .header p { color: #38bdf8; font-size: 13px; margin: 4px 0 0 0; }
          .content { padding: 32px 24px; line-height: 1.6; font-size: 15px; }
          .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .btn { display: inline-block; padding: 10px 20px; background-color: #0284c7; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>SW Service Desk</h1>
            <p>SW Cloud Solutions - Suporte Empresarial</p>
          </div>
          <div class="content">
            ${htmlContent}
          </div>
          <div class="footer">
            <p>Esta é uma mensagem automática enviada pelo SW Service Desk v1.0.<br>Por favor não responda diretamente a este email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Em ambiente de produção conectaria com nodemailer/SMTP
    // No ambiente do sistema, logamos estruturadamente e confirmamos entrega
    logger.info(`[Email Simulado / Transacional] Enviado para: ${to} | Assunto: ${subject}`);
    return true;
  },

  /**
   * Notifica canal Microsoft Teams via Webhook (especialmente tickets P1/Críticos)
   */
  async sendTeamsWebhook(title: string, message: string, facts: { name: string; value: string }[]): Promise<boolean> {
    if (!ENV.TEAMS_WEBHOOK_URL) {
      logger.info('[Teams Webhook] Webhook URL não configurada, mensagem interna ignorada.');
      return false;
    }

    try {
      const card = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'D9381E', // Vermelho para alerta
        summary: title,
        sections: [
          {
            activityTitle: `🚨 SW Service Desk Alerta: ${title}`,
            activitySubtitle: message,
            facts,
            markdown: true,
          },
        ],
      };

      const res = await fetch(ENV.TEAMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });

      return res.ok;
    } catch (err: any) {
      logger.warn('[Teams Webhook] Falha ao enviar para Microsoft Teams:', err.message);
      return false;
    }
  },
};
