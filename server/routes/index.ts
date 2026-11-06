// ========================================================================
// SW Service Desk v1.0 - Mapeamento Central de Rotas RESTful da API (/api/v1)
// Empresa: SW Cloud Solutions
// ========================================================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { secureUpload } from '../middleware/upload.js';
import { auditMiddleware } from '../middleware/auditLogger.js';

import { authController } from '../controllers/authController.js';
import { ticketController } from '../controllers/ticketController.js';
import { commentController } from '../controllers/commentController.js';
import { assetController } from '../controllers/assetController.js';
import { licenseController } from '../controllers/licenseController.js';
import { kbController } from '../controllers/kbController.js';
import { workflowController } from '../controllers/workflowController.js';
import { userController } from '../controllers/userController.js';
import { slaController } from '../controllers/slaController.js';
import { reportController } from '../controllers/reportController.js';
import { aiController } from '../controllers/aiController.js';
import { adminController } from '../controllers/adminController.js';
import { healthController } from '../controllers/healthController.js';
import { query, execute } from '../db/index.js';

export const apiRouter = Router();

// Rate limiter para endpoints de autenticação (proteção contra brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Demasiadas tentativas de autenticação. Por favor aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Intercetor de auditoria para operações de mutação
apiRouter.use(auditMiddleware);

// --- 1. Autenticação & Sessões ---
apiRouter.post('/auth/login', authLimiter, authController.login);
apiRouter.get('/auth/me', requireAuth, authController.getCurrentUser);
apiRouter.post('/auth/2fa/setup', requireAuth, authController.setup2FA);
apiRouter.post('/auth/2fa/verify', requireAuth, authController.verifyAndEnable2FA);
apiRouter.post('/auth/2fa/disable', requireAuth, authController.disable2FA);
apiRouter.get('/auth/sessions', requireAuth, authController.getSessions);
apiRouter.delete('/auth/sessions/:id', requireAuth, authController.revokeSession);
apiRouter.post('/auth/logout', requireAuth, authController.logout);

// --- 2. Gestão de Tickets (ITSM) ---
apiRouter.get('/tickets', requireAuth, ticketController.getTickets);
apiRouter.get('/tickets/:id', requireAuth, ticketController.getTicketById);
apiRouter.post('/tickets', requireAuth, ticketController.createTicket);
apiRouter.post('/tickets/:id/assign', requireAuth, requireRole(['agent', 'supervisor', 'admin']), ticketController.assignTicket);
apiRouter.post('/tickets/:id/status', requireAuth, ticketController.updateStatus);
apiRouter.post('/tickets/:id/priority', requireAuth, requireRole(['agent', 'supervisor', 'admin']), ticketController.updatePriority);
apiRouter.post('/tickets/:id/link-asset', requireAuth, requireRole(['agent', 'supervisor', 'admin']), ticketController.linkAsset);

// --- 3. Comentários, Notas Internas e Anexos ---
apiRouter.post('/tickets/:id/comments', requireAuth, commentController.addComment);
apiRouter.post('/tickets/:id/attachments', requireAuth, secureUpload.single('file'), commentController.uploadAttachment);

// --- 4. CMDB & Gestão de Ativos ---
apiRouter.get('/assets', requireAuth, assetController.getAssets);
apiRouter.get('/assets/:id', requireAuth, assetController.getAssetById);
apiRouter.post('/assets', requireAuth, requireRole(['agent', 'supervisor', 'admin']), assetController.createAsset);
apiRouter.post('/assets/:id/assign', requireAuth, requireRole(['agent', 'supervisor', 'admin']), assetController.assignAsset);
apiRouter.post('/assets/:id/transfer', requireAuth, requireRole(['agent', 'supervisor', 'admin']), assetController.transferAsset);
apiRouter.post('/assets/:id/return', requireAuth, requireRole(['agent', 'supervisor', 'admin']), assetController.returnToStock);
apiRouter.post('/assets/:id/retire', requireAuth, requireRole(['supervisor', 'admin']), assetController.retireAsset);

// --- 5. Software & Licenças ---
apiRouter.get('/licenses', requireAuth, licenseController.getLicenses);
apiRouter.post('/licenses', requireAuth, requireRole(['supervisor', 'admin']), licenseController.createLicense);
apiRouter.post('/licenses/:id/allocate', requireAuth, requireRole(['agent', 'supervisor', 'admin']), licenseController.allocateLicense);
apiRouter.delete('/licenses/:id/allocate/:assetLicenseId', requireAuth, requireRole(['supervisor', 'admin']), licenseController.deallocateLicense);

// --- 6. Base de Conhecimento (KB) ---
apiRouter.get('/kb', requireAuth, kbController.getArticles);
apiRouter.get('/kb/:slugOrId', requireAuth, kbController.getArticleBySlugOrId);
apiRouter.post('/kb', requireAuth, requireRole(['agent', 'supervisor', 'admin']), kbController.createArticle);
apiRouter.post('/kb/:id/vote', requireAuth, kbController.voteArticle);

// --- 7. Catálogo de Serviços & Aprovações ---
apiRouter.get('/catalog', requireAuth, workflowController.getCatalogItems);
apiRouter.post('/catalog/:id/request', requireAuth, workflowController.submitCatalogRequest);
apiRouter.get('/approvals', requireAuth, requireRole(['supervisor', 'admin']), workflowController.getPendingApprovals);
apiRouter.post('/approvals/:id/decide', requireAuth, requireRole(['supervisor', 'admin']), workflowController.decideApproval);

// --- 8. Utilizadores, Departamentos & Equipas ---
apiRouter.get('/users', requireAuth, userController.getUsers);
apiRouter.post('/users', requireAuth, requireRole(['admin']), userController.createUser);
apiRouter.put('/users/:id', requireAuth, requireRole(['admin']), userController.updateUser);
apiRouter.get('/departments', requireAuth, userController.getDepartments);
apiRouter.get('/teams', requireAuth, userController.getTeams);

// --- 9. SLA & Políticas ---
apiRouter.get('/sla/policies', requireAuth, slaController.getPolicies);
apiRouter.put('/sla/policies/:id', requireAuth, requireRole(['supervisor', 'admin']), slaController.updatePolicy);
apiRouter.get('/sla/metrics', requireAuth, slaController.getSlaMetrics);

// --- 10. Relatórios & Dashboards ---
apiRouter.get('/reports/dashboard', requireAuth, reportController.getDashboardMetrics);
apiRouter.get('/reports/export-csv', requireAuth, requireRole(['supervisor', 'admin']), reportController.exportTicketsCsv);

// --- 11. Módulo de IA Privada (Gemini API) ---
apiRouter.post('/ai/summarize-ticket', requireAuth, requireRole(['agent', 'supervisor', 'admin']), aiController.summarizeTicket);
apiRouter.post('/ai/suggest-classification', requireAuth, aiController.suggestClassification);
apiRouter.post('/ai/suggest-response', requireAuth, requireRole(['agent', 'supervisor', 'admin']), aiController.suggestResponse);
apiRouter.post('/ai/search-kb', requireAuth, aiController.searchKnowledgeBase);

// --- 12. Notificações Internas ---
apiRouter.get('/notifications', requireAuth, async (req: any, res) => {
  const notifs = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
    [req.user.id]
  );
  res.json(notifs);
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: any, res) => {
  await execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

apiRouter.post('/notifications/read-all', requireAuth, async (req: any, res) => {
  await execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

// --- 13. Administração, Auditoria & Backups ---
apiRouter.get('/admin/audit-logs', requireAuth, requireRole(['admin']), adminController.getAuditLogs);
apiRouter.get('/admin/backups', requireAuth, requireRole(['admin']), adminController.getBackups);
apiRouter.post('/admin/backups', requireAuth, requireRole(['admin']), adminController.createBackup);
apiRouter.get('/admin/backups/:filename', requireAuth, requireRole(['admin']), adminController.downloadBackup);
apiRouter.post('/admin/restore', requireAuth, requireRole(['admin']), adminController.restoreBackup);
apiRouter.get('/admin/settings', requireAuth, requireRole(['admin']), adminController.getSettings);
apiRouter.put('/admin/settings/:key', requireAuth, requireRole(['admin']), adminController.updateSetting);

// --- 14. Health Checks Públicos ---
apiRouter.get('/health/live', healthController.getLive);
apiRouter.get('/health/ready', healthController.getReady);
