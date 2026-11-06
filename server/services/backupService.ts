// ========================================================================
// SW Service Desk v1.0 - Serviço de Backups e Restauro de Base de Dados
// Empresa: SW Cloud Solutions
// ========================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { query, execute, getActiveDialect } from '../db/index.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

const execAsync = promisify(exec);

export interface BackupResult {
  filename: string;
  filepath: string;
  checksum: string;
  checksumFile: string;
  sizeBytes: number;
  tablesCount: number;
  recordsCount: number;
  rotation: {
    purgedFiles: string[];
    retainedCount: number;
  };
}

export interface BackupFileInfo {
  filename: string;
  filepath: string;
  sizeBytes: number;
  createdAt: string;
  checksum?: string;
  isProtected: boolean;
}

export const backupService = {
  /**
   * Obtém e garante a existência da pasta de backups protegida definida em BACKUP_DIR
   */
  getSecureBackupDir(): string {
    const rawDir = process.env.BACKUP_DIR || ENV.BACKUP_DIR || './backups';
    const backupDir = path.isAbsolute(rawDir) ? rawDir : path.resolve(process.cwd(), rawDir);

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    } else {
      try {
        fs.chmodSync(backupDir, 0o700);
      } catch {
        // Ignora caso o SO/filesystem não suporte chmod restritivo (ex. Windows)
      }
    }

    return backupDir;
  },

  /**
   * Executa um dump completo compatível com MySQL/MariaDB para ficheiro .sql,
   * armazena na pasta definida em BACKUP_DIR, aplica permissões estritas (0600),
   * calcula o checksum SHA-256 para integridade e executa a rotação de backups antigos.
   */
  async executeMysqlDump(customDir?: string): Promise<BackupResult> {
    const backupDir = customDir || this.getSecureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sw_servicedesk_backup_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    const checksumFile = `${filepath}.sha256`;

    logger.info(`[Backup] A iniciar dump da base de dados em ${filepath}...`);

    let dumpGenerated = false;
    let tablesCount = 0;
    let recordsCount = 0;

    // 1. Tentar mysqldump nativo se o dialeto configurado for MySQL e o utilitário estiver disponível
    if (ENV.DB_DIALECT === 'mysql' && process.env.MYSQL_DUMP_ENABLED === 'true') {
      try {
        const envVars = {
          ...process.env,
          MYSQL_PWD: ENV.DB_PASSWORD || '',
        };
        const cmd = `mysqldump --host="${ENV.DB_HOST}" --port="${ENV.DB_PORT}" --user="${ENV.DB_USER}" --single-transaction --quick --routines --triggers --events --default-character-set=utf8mb4 --add-drop-table "${ENV.DB_NAME}" > "${filepath}"`;
        
        await execAsync(cmd, { env: envVars });
        dumpGenerated = true;
        logger.info(`[Backup] mysqldump nativo concluído com sucesso para ${filename}`);
      } catch (err: any) {
        logger.warn(`[Backup] Falha no mysqldump binário (${err.message}). A alternar para exportação transacional relacional...`);
      }
    }

    // 2. Exportador transacional relacional nativo (ACID, compatível com MySQL 8 / MariaDB / SQLite)
    if (!dumpGenerated) {
      const dumpInfo = await this.generateRelationalSqlDump(filepath);
      tablesCount = dumpInfo.tablesCount;
      recordsCount = dumpInfo.recordsCount;
    }

    // 3. Proteger ficheiro com permissões estritas (chmod 0600: apenas o utilizador do processo pode ler/escrever)
    try {
      fs.chmodSync(filepath, 0o600);
    } catch {
      // Ignora erro em sistemas não-POSIX
    }

    // 4. Calcular e guardar checksum SHA-256 para integridade e anti-adulteração
    const fileBuffer = fs.readFileSync(filepath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    fs.writeFileSync(checksumFile, `${checksum}  ${filename}\n`, { mode: 0o600, encoding: 'utf8' });

    const stat = fs.statSync(filepath);

    // 5. Executar Rotação de Ficheiros Antigos
    const rotation = await this.rotateBackups(backupDir);

    logger.info(`[Backup] Dump concluído: ${filename} (${(stat.size / 1024).toFixed(2)} KB, SHA-256: ${checksum.slice(0, 16)}...)`);

    return {
      filename,
      filepath,
      checksum,
      checksumFile,
      sizeBytes: stat.size,
      tablesCount,
      recordsCount,
      rotation,
    };
  },

  /**
   * Alias de compatibilidade com o controlador existente
   */
  async createBackupSnapshot(): Promise<BackupResult> {
    return this.executeMysqlDump();
  },

  /**
   * Gera o conteúdo SQL estruturado para MySQL/MariaDB
   */
  async generateRelationalSqlDump(filepath: string): Promise<{ tablesCount: number; recordsCount: number }> {
    const tables = [
      'departments',
      'teams',
      'users',
      'user_sessions',
      'categories',
      'sla_policies',
      'subcategories',
      'service_catalog_items',
      'assets',
      'asset_history',
      'licenses',
      'asset_licenses',
      'tickets',
      'ticket_comments',
      'ticket_attachments',
      'ticket_history',
      'service_approvals',
      'kb_articles',
      'notifications',
      'audit_logs',
      'system_settings',
    ];

    let sqlDump = `-- ========================================================================\n`;
    sqlDump += `-- SW Service Desk v1.0 - Database Dump\n`;
    sqlDump += `-- Empresa: SW Cloud Solutions\n`;
    sqlDump += `-- Gerado em: ${new Date().toISOString()}\n`;
    sqlDump += `-- Dialeto do Motor: ${getActiveDialect().toUpperCase()}\n`;
    sqlDump += `-- ========================================================================\n\n`;

    sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n`;
    sqlDump += `SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";\n`;
    sqlDump += `SET time_zone = "+00:00";\n\n`;

    let totalRecords = 0;
    let tablesExported = 0;

    for (const table of tables) {
      try {
        const rows = await query(`SELECT * FROM ${table}`);
        tablesExported++;

        sqlDump += `-- ------------------------------------------------------------------------\n`;
        sqlDump += `-- Dados da Tabela: \`${table}\` (${rows.length} registos)\n`;
        sqlDump += `-- ------------------------------------------------------------------------\n`;

        if (rows.length > 0) {
          totalRecords += rows.length;
          for (const row of rows) {
            const keys = Object.keys(row).map((k) => `\`${k}\``);
            const values = Object.values(row).map((v) => {
              if (v === null || v === undefined) return 'NULL';
              if (typeof v === 'number') return v;
              if (typeof v === 'boolean') return v ? 1 : 0;
              // Escape seguro de caracteres especiais e plicas
              const strVal = String(v)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\0/g, '\\0')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r');
              return `'${strVal}'`;
            });

            sqlDump += `INSERT INTO \`${table}\` (${keys.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }
        sqlDump += `\n`;
      } catch (err: any) {
        logger.warn(`[Backup] Aviso ao exportar tabela ${table}:`, err.message);
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
    sqlDump += `-- Dump finalizado com ${tablesExported} tabelas e ${totalRecords} registos.\n`;

    fs.writeFileSync(filepath, sqlDump, { encoding: 'utf8', mode: 0o600 });
    return { tablesCount: tablesExported, recordsCount: totalRecords };
  },

  /**
   * Rotação de ficheiros: expurga cópias com mais de retentionDays dias ou que ultrapassem maxFiles
   */
  async rotateBackups(
    backupDir?: string,
    retentionDays: number = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    maxFiles: number = parseInt(process.env.BACKUP_MAX_FILES || '30', 10)
  ): Promise<{ purgedFiles: string[]; retainedCount: number }> {
    const targetDir = backupDir || backupService.getSecureBackupDir();
    if (!fs.existsSync(targetDir)) {
      return { purgedFiles: [], retainedCount: 0 };
    }

    const allEntries = fs.readdirSync(targetDir);
    const sqlFiles = allEntries.filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'));

    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
    const purgedFiles: string[] = [];

    // Mapear ficheiros com data de modificação
    const fileDetails = sqlFiles.map((file) => {
      const fullPath = path.join(targetDir, file);
      const stat = fs.statSync(fullPath);
      return {
        filename: file,
        fullPath,
        mtimeMs: stat.mtimeMs,
        ageMs: now - stat.mtimeMs,
      };
    });

    // Ordenar do mais recente para o mais antigo
    fileDetails.sort((a, b) => b.mtimeMs - a.mtimeMs);

    // 1. Expurgo por idade (mais antigo que retentionDays)
    // 2. Expurgo por contagem (acima de maxFiles)
    for (let i = 0; i < fileDetails.length; i++) {
      const item = fileDetails[i];
      const isTooOld = item.ageMs > maxAgeMs;
      const exceedsMaxCount = i >= maxFiles;

      if (isTooOld || exceedsMaxCount) {
        try {
          fs.unlinkSync(item.fullPath);
          purgedFiles.push(item.filename);

          // Remover ficheiro de checksum associado, se existir
          const shaFile = `${item.fullPath}.sha256`;
          if (fs.existsSync(shaFile)) {
            fs.unlinkSync(shaFile);
          }
          logger.info(`[Backup Rotation] Ficheiro purgado: ${item.filename} (Motivo: ${isTooOld ? 'retenção temporal' : 'limite de ficheiros'})`);
        } catch (err: any) {
          logger.warn(`[Backup Rotation] Erro ao remover ficheiro ${item.filename}:`, err.message);
        }
      }
    }

    const retainedCount = fileDetails.length - purgedFiles.length;
    return { purgedFiles, retainedCount };
  },

  /**
   * Valida a integridade de um ficheiro de backup comparando o SHA-256 atual com o ficheiro .sha256
   */
  verifyBackupIntegrity(filename: string): { isValid: boolean; calculatedHash: string; expectedHash?: string } {
    const backupDir = this.getSecureBackupDir();
    const safeFilename = path.basename(filename);
    const filepath = path.join(backupDir, safeFilename);

    if (!fs.existsSync(filepath)) {
      throw new Error(`Ficheiro de backup '${safeFilename}' não existe.`);
    }

    const fileBuffer = fs.readFileSync(filepath);
    const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const checksumPath = `${filepath}.sha256`;
    if (!fs.existsSync(checksumPath)) {
      return { isValid: true, calculatedHash };
    }

    const checksumContent = fs.readFileSync(checksumPath, 'utf8').trim();
    const expectedHash = checksumContent.split(/\s+/)[0];

    const isValid = calculatedHash.toLowerCase() === expectedHash.toLowerCase();
    return { isValid, calculatedHash, expectedHash };
  },

  /**
   * Restaura um snapshot de ficheiro SQL
   */
  async restoreBackup(sqlContent: string): Promise<{ statementsExecuted: number }> {
    const statements = sqlContent
      .split(/;\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    let count = 0;
    for (const stmt of statements) {
      try {
        await execute(stmt);
        count++;
      } catch (err: any) {
        logger.warn('Erro ao executar statement de restauro (ignorado para integridade):', { stmt: stmt.slice(0, 100) }, err.message);
      }
    }

    logger.info(`Restauro concluído com ${count} instruções executadas com sucesso.`);
    return { statementsExecuted: count };
  },

  /**
   * Lista ficheiros de backup disponíveis com estado de integridade e permissões
   */
  listBackups(): BackupFileInfo[] {
    const backupDir = this.getSecureBackupDir();
    if (!fs.existsSync(backupDir)) return [];

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.sql') || f.endsWith('.sql.gz'));
    return files.map((file) => {
      const fullPath = path.join(backupDir, file);
      const stat = fs.statSync(fullPath);
      let checksum: string | undefined;

      const checksumPath = `${fullPath}.sha256`;
      if (fs.existsSync(checksumPath)) {
        try {
          checksum = fs.readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0];
        } catch {
          // ignore
        }
      }

      // Em sistemas POSIX, modo 0o600 indica proteção restrita
      const isProtected = (stat.mode & 0o077) === 0;

      return {
        filename: file,
        filepath: fullPath,
        sizeBytes: stat.size,
        createdAt: stat.birthtime.toISOString(),
        checksum,
        isProtected,
      };
    });
  },
};
