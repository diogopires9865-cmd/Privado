// ========================================================================
// SW Service Desk v1.0 - Camada de Acesso a Dados Relacional (SQL)
// Suporta MySQL 8.0+ / MariaDB e SQLite local para ambientes de sandbox/testes
// Empresa: SW Cloud Solutions
// ========================================================================

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import { ENV } from '../config/env.js';

export interface DatabaseTransaction {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ insertId?: number; affectedRows: number }>;
}

let mysqlPool: mysql.Pool | null = null;
let sqliteDb: Database.Database | null = null;
let activeDialect: 'mysql' | 'sqlite' = ENV.DB_DIALECT;

export function getActiveDialect(): 'mysql' | 'sqlite' {
  return activeDialect;
}

export async function initDatabase(): Promise<void> {
  if (activeDialect === 'mysql') {
    try {
      mysqlPool = mysql.createPool({
        host: ENV.DB_HOST,
        port: ENV.DB_PORT,
        user: ENV.DB_USER,
        password: ENV.DB_PASSWORD,
        database: ENV.DB_NAME,
        connectionLimit: ENV.DB_CONNECTION_LIMIT,
        waitForConnections: true,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        timezone: '+00:00',
      });
      // Testar conexão
      const [rows] = await mysqlPool.query('SELECT 1 as connected');
      console.log('✅ [Database] Conexão MySQL/MariaDB estabelecida com sucesso.');
      return;
    } catch (err: any) {
      console.warn(`⚠️ [Database] Falha ao conectar ao MySQL em ${ENV.DB_HOST}:${ENV.DB_PORT} (${err.message}). A alternar para o motor relacional SQLite local.`);
      activeDialect = 'sqlite';
    }
  }

  // SQLite Engine
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const dbPath = path.join(dataDir, 'sw_servicedesk.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  console.log(`✅ [Database] Motor relacional SQLite (WAL) inicializado em: ${dbPath}`);
}

// Converte parâmetros e sintaxe quando necessário
function normalizeSql(sql: string): string {
  if (activeDialect === 'sqlite') {
    // Normalizar funções de data MySQL para SQLite
    return sql
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, "DEFAULT CURRENT_TIMESTAMP")
      .replace(/AUTO_INCREMENT/gi, "AUTOINCREMENT")
      .replace(/TINYINT\(1\)/gi, "INTEGER")
      .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+MINUTE\)/gi, "datetime('now', '+$1 minutes')")
      .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+HOUR\)/gi, "datetime('now', '+$1 hours')")
      .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "datetime('now', '+$1 days')");
  }
  return sql;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const normalized = normalizeSql(sql);
  if (activeDialect === 'mysql' && mysqlPool) {
    const [rows] = await mysqlPool.query(normalized, params);
    return rows as T[];
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(normalized);
    return stmt.all(...params) as T[];
  }

  throw new Error('Database not initialized');
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<{ insertId?: number; affectedRows: number }> {
  const normalized = normalizeSql(sql);
  if (activeDialect === 'mysql' && mysqlPool) {
    const [result] = await mysqlPool.execute(normalized, params) as any;
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  }

  if (sqliteDb) {
    const stmt = sqliteDb.prepare(normalized);
    const result = stmt.run(...params);
    return {
      insertId: Number(result.lastInsertRowid),
      affectedRows: result.changes,
    };
  }

  throw new Error('Database not initialized');
}

export async function transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
  if (activeDialect === 'mysql' && mysqlPool) {
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();
    const tx: DatabaseTransaction = {
      query: async (sql, params = []) => {
        const [rows] = await connection.query(normalizeSql(sql), params);
        return rows as any;
      },
      queryOne: async (sql, params = []) => {
        const [rows] = await connection.query(normalizeSql(sql), params) as any;
        return rows.length > 0 ? rows[0] : null;
      },
      execute: async (sql, params = []) => {
        const [result] = await connection.execute(normalizeSql(sql), params) as any;
        return { insertId: result.insertId, affectedRows: result.affectedRows };
      },
    };

    try {
      const res = await callback(tx);
      await connection.commit();
      return res;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  if (sqliteDb) {
    const tx = {
      query: async (sql: string, params: any[] = []) => {
        const stmt = sqliteDb!.prepare(normalizeSql(sql));
        return stmt.all(...params);
      },
      queryOne: async (sql: string, params: any[] = []) => {
        const stmt = sqliteDb!.prepare(normalizeSql(sql));
        const res = stmt.get(...params);
        return res || null;
      },
      execute: async (sql: string, params: any[] = []) => {
        const stmt = sqliteDb!.prepare(normalizeSql(sql));
        const res = stmt.run(...params);
        return { insertId: Number(res.lastInsertRowid), affectedRows: res.changes };
      },
    };

    sqliteDb.exec('BEGIN TRANSACTION');
    try {
      const res = await callback(tx as any);
      sqliteDb.exec('COMMIT');
      return res;
    } catch (err) {
      sqliteDb.exec('ROLLBACK');
      throw err;
    }
  }

  throw new Error('Database not initialized');
}
