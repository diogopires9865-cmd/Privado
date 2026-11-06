-- ========================================================================
-- SW Service Desk v1.0 - MySQL 8.0+ / MariaDB 10.6+ Production Schema DDL
-- Empresa: SW Cloud Solutions
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS kb_articles;
DROP TABLE IF EXISTS service_approvals;
DROP TABLE IF EXISTS ticket_history;
DROP TABLE IF EXISTS ticket_attachments;
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS asset_licenses;
DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS asset_history;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS service_catalog_items;
DROP TABLE IF EXISTS sla_policies;
DROP TABLE IF EXISTS subcategories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS system_settings;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Departamentos
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NULL,
    manager_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Equipas Técnicas
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NULL,
    department_id INT NOT NULL,
    leader_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_teams_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Utilizadores
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role ENUM('admin', 'supervisor', 'agent', 'user') NOT NULL DEFAULT 'user',
    department_id INT NULL,
    team_id INT NULL,
    phone VARCHAR(30) NULL,
    job_title VARCHAR(100) NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
    two_factor_secret VARCHAR(255) NULL,
    two_factor_recovery_codes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Atualizar FKs circulares de gestão
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE teams ADD CONSTRAINT fk_teams_leader FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Sessões de Utilizador
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sessions_user_exp (user_id, expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Categorias
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Políticas de SLA
CREATE TABLE sla_policies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    priority ENUM('P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA') NOT NULL,
    first_response_minutes INT NOT NULL,
    resolution_minutes INT NOT NULL,
    business_hours_only TINYINT(1) NOT NULL DEFAULT 1,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Subcategorias
CREATE TABLE subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    default_team_id INT NULL,
    default_sla_policy_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subcat_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT fk_subcat_team FOREIGN KEY (default_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT fk_subcat_sla FOREIGN KEY (default_sla_policy_id) REFERENCES sla_policies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Catálogo de Serviços
CREATE TABLE service_catalog_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    category_id INT NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'tool',
    requires_approval TINYINT(1) NOT NULL DEFAULT 0,
    approver_role ENUM('supervisor', 'admin') NOT NULL DEFAULT 'supervisor',
    default_priority ENUM('P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA') NOT NULL DEFAULT 'P3_MEDIA',
    form_schema_json JSON NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_catalog_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Ativos de TI (CMDB)
CREATE TABLE assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    asset_type ENUM('LAPTOP', 'DESKTOP', 'SERVER', 'NETWORK', 'VM', 'MOBILE', 'OTHER') NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(150) NOT NULL,
    status ENUM('EM_STOCK', 'ATRIBUIDO', 'EM_REPARACAO', 'RESERVADO', 'ABATIDO') NOT NULL DEFAULT 'EM_STOCK',
    current_user_id INT NULL,
    department_id INT NULL,
    purchase_date DATE NULL,
    warranty_end_date DATE NULL,
    ip_address VARCHAR(45) NULL,
    mac_address VARCHAR(25) NULL,
    operating_system VARCHAR(100) NULL,
    specs_json JSON NULL,
    notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assets_user (current_user_id),
    INDEX idx_assets_status (status),
    CONSTRAINT fk_assets_user FOREIGN KEY (current_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_assets_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Histórico de Ativos
CREATE TABLE asset_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    action_type ENUM('CRIADO', 'ATRIBUIDO', 'DEVOLVIDO', 'TRANSFERIDO', 'MANUTENCAO', 'ALTERACAO_DADOS', 'ABATIDO') NOT NULL,
    performed_by_user_id INT NOT NULL,
    previous_user_id INT NULL,
    new_user_id INT NULL,
    details TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset_hist_asset (asset_id),
    CONSTRAINT fk_assethist_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_assethist_actor FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assethist_prev FOREIGN KEY (previous_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_assethist_new FOREIGN KEY (new_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Licenças de Software
CREATE TABLE licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    software_name VARCHAR(150) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    license_key VARCHAR(255) NULL,
    license_type ENUM('SUBSCRIPTION', 'PERPETUAL', 'OEM', 'ENTERPRISE') NOT NULL,
    total_seats INT NOT NULL DEFAULT 1,
    allocated_seats INT NOT NULL DEFAULT 0,
    expiration_date DATE NULL,
    cost_per_seat DECIMAL(10,2) NULL,
    purchase_order VARCHAR(50) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Associação Ativo/Licença
CREATE TABLE asset_licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    license_id INT NOT NULL,
    assigned_user_id INT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assetlic_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_assetlic_lic FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_assetlic_user FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Tickets
CREATE TABLE tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT NOT NULL,
    ticket_type ENUM('INCIDENTE', 'PEDIDO_SERVICO', 'PROBLEMA', 'ALTERACAO') NOT NULL DEFAULT 'INCIDENTE',
    status ENUM('NOVO', 'ATRIBUIDO', 'EM_PROGRESSO', 'PENDENTE_CLIENTE', 'PENDENTE_TERCEIROS', 'RESOLVIDO', 'FECHADO', 'CANCELADO') NOT NULL DEFAULT 'NOVO',
    impact ENUM('BAIXO', 'MEDIO', 'ALTO', 'CRITICO') NOT NULL DEFAULT 'MEDIO',
    urgency ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA',
    priority ENUM('P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA') NOT NULL DEFAULT 'P3_MEDIA',
    requester_id INT NOT NULL,
    assigned_agent_id INT NULL,
    assigned_team_id INT NULL,
    department_id INT NULL,
    category_id INT NULL,
    subcategory_id INT NULL,
    asset_id INT NULL,
    catalog_item_id INT NULL,
    sla_policy_id INT NULL,
    first_response_due_at DATETIME NULL,
    first_responded_at DATETIME NULL,
    resolution_due_at DATETIME NULL,
    resolved_at DATETIME NULL,
    closed_at DATETIME NULL,
    sla_status ENUM('DENTRO_PRAZO', 'EM_RISCO', 'VIOLADO', 'CUMPRIDO') NOT NULL DEFAULT 'DENTRO_PRAZO',
    resolution_summary TEXT NULL,
    cancel_reason TEXT NULL,
    custom_fields_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tickets_status_prio (status, priority, created_at),
    INDEX idx_tickets_requester (requester_id, status),
    INDEX idx_tickets_agent (assigned_agent_id, status),
    INDEX idx_tickets_team (assigned_team_id, status),
    INDEX idx_tickets_sla (sla_status, resolution_due_at),
    FULLTEXT idx_ft_ticket_search (title, description),
    CONSTRAINT fk_tickets_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tickets_agent FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_team FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_subcat FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_catalog FOREIGN KEY (catalog_item_id) REFERENCES service_catalog_items(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_sla FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Comentários
CREATE TABLE ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    author_id INT NOT NULL,
    comment_type ENUM('PUBLIC', 'INTERNAL_NOTE', 'SYSTEM_UPDATE') NOT NULL DEFAULT 'PUBLIC',
    body LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comments_ticket (ticket_id, created_at),
    CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Anexos
CREATE TABLE ticket_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    comment_id INT NULL,
    uploader_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL UNIQUE,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attach_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_attach_comment FOREIGN KEY (comment_id) REFERENCES ticket_comments(id) ON DELETE SET NULL,
    CONSTRAINT fk_attach_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Histórico de Tickets
CREATE TABLE ticket_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    actor_id INT NOT NULL,
    event_type ENUM('CRIADO', 'STATUS_ALTERADO', 'PRIORIDADE_ALTERADA', 'ATRIBUIDO', 'SLA_ATUALIZADO', 'RESOLVIDO', 'FECHADO', 'REABERTO', 'ANEXO_ADICIONADO', 'NOTA_INTERNA', 'COMENTARIO_PUBLICO', 'APROVACAO_SOLICITADA', 'APROVADO', 'REJEITADO') NOT NULL,
    old_value VARCHAR(255) NULL,
    new_value VARCHAR(255) NULL,
    description TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tickethist_ticket (ticket_id, created_at),
    CONSTRAINT fk_tickethist_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickethist_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Aprovações
CREATE TABLE service_approvals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    catalog_item_id INT NOT NULL,
    approver_id INT NULL,
    requested_by_id INT NOT NULL,
    status ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE',
    approval_notes TEXT NULL,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at DATETIME NULL,
    INDEX idx_approvals_status (status),
    CONSTRAINT fk_approvals_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_approvals_catitem FOREIGN KEY (catalog_item_id) REFERENCES service_catalog_items(id) ON DELETE RESTRICT,
    CONSTRAINT fk_approvals_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_approvals_reqby FOREIGN KEY (requested_by_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Base de Conhecimento (KB)
CREATE TABLE kb_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    content LONGTEXT NOT NULL,
    category_id INT NOT NULL,
    author_id INT NOT NULL,
    is_internal_only TINYINT(1) NOT NULL DEFAULT 0,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    view_count INT NOT NULL DEFAULT 0,
    helpful_count INT NOT NULL DEFAULT 0,
    not_helpful_count INT NOT NULL DEFAULT 0,
    tags VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT idx_ft_kb_search (title, summary, content),
    CONSTRAINT fk_kb_cat FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_kb_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Notificações
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('TICKET_ASSIGNED', 'TICKET_UPDATED', 'SLA_WARNING', 'APPROVAL_REQUEST', 'SYSTEM') NOT NULL,
    link_url VARCHAR(255) NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user_read (user_id, is_read, created_at),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Registos de Auditoria
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NULL,
    old_values_json JSON NULL,
    new_values_json JSON NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_res (resource_type, resource_id, created_at),
    INDEX idx_audit_user (user_id, created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Configurações Globais
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
