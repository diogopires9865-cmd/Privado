// ========================================================================
// SW Service Desk v1.0 - Configuração e Variáveis de Ambiente
// Empresa: SW Cloud Solutions
// ========================================================================

import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // Base de dados
  DB_DIALECT: (process.env.DB_DIALECT || 'sqlite') as 'mysql' | 'sqlite',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_NAME: process.env.DB_NAME || 'sw_servicedesk',
  DB_USER: process.env.DB_USER || 'sw_user',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),

  // Autenticação e Criptografia
  JWT_SECRET: process.env.JWT_SECRET || 'sw_cloud_solutions_super_secure_jwt_secret_key_2026_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  SESSION_SECRET: process.env.SESSION_SECRET || 'sw_cloud_solutions_session_secret_key_2026',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'sw_cloud_32_byte_aes_secret_key!',

  // Gemini IA
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // Integrações
  M365_ENABLED: process.env.M365_ENABLED === 'true',
  M365_TENANT_ID: process.env.M365_TENANT_ID || '',
  M365_CLIENT_ID: process.env.M365_CLIENT_ID || '',
  M365_CLIENT_SECRET: process.env.M365_CLIENT_SECRET || '',
  TEAMS_WEBHOOK_URL: process.env.TEAMS_WEBHOOK_URL || '',

  // Ficheiros
  UPLOADS_DIR: process.env.UPLOADS_DIR || './uploads',
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10),
};
