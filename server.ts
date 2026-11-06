// ========================================================================
// SW Service Desk v1.0 - Servidor Express & Ponto de Entrada Full-Stack
// Empresa: SW Cloud Solutions
// ========================================================================

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './server/config/env.js';
import { initDatabase } from './server/db/index.js';
import { runMigrations } from './server/db/migrations.js';
import { runSeeds } from './server/db/seed.js';
import { apiRouter } from './server/routes/index.js';
import { healthController } from './server/controllers/healthController.js';
import { logger } from './server/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = ENV.PORT || 3000;

  // 1. Inicializar Base de Dados e aplicar Migrations/Seeds
  try {
    await initDatabase();
    await runMigrations();
    await runSeeds();
  } catch (err: any) {
    logger.error('Erro crítico na inicialização da base de dados:', {}, err);
    process.exit(1);
  }

  // 2. Middlewares de Segurança e Parsing
  app.use(
    helmet({
      contentSecurityPolicy: false, // Vite dev server requer carregamento dinâmico de scripts
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Request tracing & logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        logger.info(`${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // 3. Health Checks
  app.get('/health/live', healthController.getLive);
  app.get('/health/ready', healthController.getReady);

  // 4. Rotas da API REST
  app.use('/api/v1', apiRouter);

  // Diretório de uploads estáticos protegidos
  const uploadsPath = path.resolve(__dirname, ENV.UPLOADS_DIR);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // 5. Integração com Frontend (Vite no dev e Dist em prod)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    logger.info('🚀 [Vite] Middleware de desenvolvimento montado no servidor Express.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    logger.info(`📦 [Production] A servir assets compilados a partir de: ${distPath}`);
  }

  // 6. Arrancar servidor HTTP na porta 3000
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`⚡ [Server] SW Service Desk v1.0 em execução em http://0.0.0.0:${PORT}`);
    logger.info(`🌐 Empresa: SW Cloud Solutions | Ambiente: ${ENV.NODE_ENV}`);
  });
}

startServer().catch((err) => {
  logger.error('Falha catastrófica ao arrancar o servidor:', {}, err);
});
