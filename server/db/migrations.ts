// ========================================================================
// SW Service Desk v1.0 - Motor de Migrations Relacionais
// Empresa: SW Cloud Solutions
// ========================================================================

import { query, execute, getActiveDialect } from './index.js';

export async function runMigrations(): Promise<void> {
  const dialect = getActiveDialect();
  console.log(`📦 [Migrations] A verificar integridade do esquema no motor: ${dialect.toUpperCase()}...`);

  if (dialect === 'sqlite') {
    await runSqliteMigrations();
  } else {
    await runMysqlMigrations();
  }
}

async function runSqliteMigrations(): Promise<void> {
  // 1. Departamentos
  await execute(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      manager_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 2. Equipas Técnicas
  await execute(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      department_id INTEGER NOT NULL,
      leader_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
  `);

  // 3. Utilizadores
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      department_id INTEGER,
      team_id INTEGER,
      phone TEXT,
      job_title TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      two_factor_secret TEXT,
      two_factor_recovery_codes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );
  `);

  // 4. Sessões
  await execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 5. Categorias
  await execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 6. Políticas de SLA
  await execute(`
    CREATE TABLE IF NOT EXISTS sla_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      priority TEXT NOT NULL,
      first_response_minutes INTEGER NOT NULL,
      resolution_minutes INTEGER NOT NULL,
      business_hours_only INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 7. Subcategorias
  await execute(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      default_team_id INTEGER,
      default_sla_policy_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      FOREIGN KEY (default_team_id) REFERENCES teams(id) ON DELETE SET NULL,
      FOREIGN KEY (default_sla_policy_id) REFERENCES sla_policies(id) ON DELETE SET NULL
    );
  `);

  // 8. Catálogo de Serviços
  await execute(`
    CREATE TABLE IF NOT EXISTS service_catalog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      category_id INTEGER NOT NULL,
      icon TEXT NOT NULL DEFAULT 'tool',
      requires_approval INTEGER NOT NULL DEFAULT 0,
      approver_role TEXT NOT NULL DEFAULT 'supervisor',
      default_priority TEXT NOT NULL DEFAULT 'P3_MEDIA',
      form_schema_json TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // 9. Ativos de TI (CMDB)
  await execute(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT NOT NULL UNIQUE,
      serial_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'EM_STOCK',
      current_user_id INTEGER,
      department_id INTEGER,
      purchase_date TEXT,
      warranty_end_date TEXT,
      ip_address TEXT,
      mac_address TEXT,
      operating_system TEXT,
      specs_json TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (current_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );
  `);

  // 10. Histórico de Ativos
  await execute(`
    CREATE TABLE IF NOT EXISTS asset_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      performed_by_user_id INTEGER NOT NULL,
      previous_user_id INTEGER,
      new_user_id INTEGER,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by_user_id) REFERENCES users(id),
      FOREIGN KEY (previous_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (new_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 11. Licenças de Software
  await execute(`
    CREATE TABLE IF NOT EXISTS licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      software_name TEXT NOT NULL,
      vendor TEXT NOT NULL,
      license_key TEXT,
      license_type TEXT NOT NULL,
      total_seats INTEGER NOT NULL DEFAULT 1,
      allocated_seats INTEGER NOT NULL DEFAULT 0,
      expiration_date TEXT,
      cost_per_seat REAL,
      purchase_order TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 12. Associação Ativo / Licença
  await execute(`
    CREATE TABLE IF NOT EXISTS asset_licenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      license_id INTEGER NOT NULL,
      assigned_user_id INTEGER,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
      FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 13. Tickets
  await execute(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      ticket_type TEXT NOT NULL DEFAULT 'INCIDENTE',
      status TEXT NOT NULL DEFAULT 'NOVO',
      impact TEXT NOT NULL DEFAULT 'MEDIO',
      urgency TEXT NOT NULL DEFAULT 'MEDIA',
      priority TEXT NOT NULL DEFAULT 'P3_MEDIA',
      requester_id INTEGER NOT NULL,
      assigned_agent_id INTEGER,
      assigned_team_id INTEGER,
      department_id INTEGER,
      category_id INTEGER,
      subcategory_id INTEGER,
      asset_id INTEGER,
      catalog_item_id INTEGER,
      sla_policy_id INTEGER,
      first_response_due_at TEXT,
      first_responded_at TEXT,
      resolution_due_at TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      sla_status TEXT NOT NULL DEFAULT 'DENTRO_PRAZO',
      resolution_summary TEXT,
      cancel_reason TEXT,
      custom_fields_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (requester_id) REFERENCES users(id),
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
      FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
      FOREIGN KEY (catalog_item_id) REFERENCES service_catalog_items(id) ON DELETE SET NULL,
      FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id) ON DELETE SET NULL
    );
  `);

  // 14. Comentários de Tickets
  await execute(`
    CREATE TABLE IF NOT EXISTS ticket_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      comment_type TEXT NOT NULL DEFAULT 'PUBLIC',
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);

  // 15. Anexos
  await execute(`
    CREATE TABLE IF NOT EXISTS ticket_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      comment_id INTEGER,
      uploader_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      stored_file_name TEXT NOT NULL UNIQUE,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES ticket_comments(id) ON DELETE SET NULL,
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    );
  `);

  // 16. Histórico de Tickets
  await execute(`
    CREATE TABLE IF NOT EXISTS ticket_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      actor_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );
  `);

  // 17. Aprovações
  await execute(`
    CREATE TABLE IF NOT EXISTS service_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      catalog_item_id INTEGER NOT NULL,
      approver_id INTEGER,
      requested_by_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE',
      approval_notes TEXT,
      requested_at TEXT NOT NULL DEFAULT (datetime('now')),
      decided_at TEXT,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (catalog_item_id) REFERENCES service_catalog_items(id),
      FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (requested_by_id) REFERENCES users(id)
    );
  `);

  // 18. Base de Conhecimento (KB)
  await execute(`
    CREATE TABLE IF NOT EXISTS kb_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      is_internal_only INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      view_count INTEGER NOT NULL DEFAULT 0,
      helpful_count INTEGER NOT NULL DEFAULT 0,
      not_helpful_count INTEGER NOT NULL DEFAULT 0,
      tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);

  // 19. Notificações
  await execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      link_url TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 20. Auditoria
  await execute(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      old_values_json TEXT,
      new_values_json TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 21. Configurações
  await execute(`
    CREATE TABLE IF NOT EXISTS system_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Criar índices otimizados
  await execute(`CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status, priority, created_at);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_tickets_requester ON tickets(requester_id, status);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_tickets_agent ON tickets(assigned_agent_id, status);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(current_user_id);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read);`);

  console.log('✅ [Migrations] Esquema SQLite validado com sucesso.');
}

async function runMysqlMigrations(): Promise<void> {
  // Ler o ficheiro /scripts/mysql-schema.sql
  const fs = await import('fs');
  const path = await import('path');
  const schemaPath = path.resolve(process.cwd(), 'scripts', 'mysql-schema.sql');
  if (fs.existsSync(schemaPath)) {
    const ddl = fs.readFileSync(schemaPath, 'utf8');
    const statements = ddl
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    for (const stmt of statements) {
      await execute(stmt);
    }
    console.log('✅ [Migrations] Esquema MySQL 8 executado com sucesso.');
  }
}
