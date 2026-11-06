# SW Service Desk v1.0 - Modelo Completo da Base de Dados (MySQL / MariaDB)
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

## 1. Visão Geral da Base de Dados
A base de dados do **SW Service Desk v1.0** foi desenhada para motores relacionais padrão **MySQL 8.0+** e **MariaDB 10.6+**, garantindo total integridade referencial com chaves estrangeiras (`FOREIGN KEY`), conformidade ACID, codificação `utf8mb4_unicode_ci` e tipos de dados estritos.

A base de dados é a **única fonte de verdade**.

---

## 2. Entidades Principais e Esquema de Tabelas

### 2.1. Organização e Utilizadores
1. **`departments`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `name` VARCHAR(100) NOT NULL UNIQUE
   - `code` VARCHAR(20) NOT NULL UNIQUE
   - `description` TEXT NULL
   - `manager_id` INT NULL (FK -> users.id)
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

2. **`teams`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `name` VARCHAR(100) NOT NULL UNIQUE
   - `code` VARCHAR(20) NOT NULL UNIQUE (Ex: CLOUD_OPS, HELPDESK_N1, SECOPS, NETWORKING)
   - `description` TEXT NULL
   - `department_id` INT NOT NULL (FK -> departments.id)
   - `leader_id` INT NULL (FK -> users.id)
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

3. **`users`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `email` VARCHAR(191) NOT NULL UNIQUE
   - `password_hash` VARCHAR(255) NOT NULL
   - `full_name` VARCHAR(150) NOT NULL
   - `role` ENUM('admin', 'supervisor', 'agent', 'user') NOT NULL DEFAULT 'user'
   - `department_id` INT NULL (FK -> departments.id)
   - `team_id` INT NULL (FK -> teams.id)
   - `phone` VARCHAR(30) NULL
   - `job_title` VARCHAR(100) NULL
   - `is_active` TINYINT(1) NOT NULL DEFAULT 1
   - `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0
   - `two_factor_secret` VARCHAR(255) NULL
   - `two_factor_recovery_codes` TEXT NULL (JSON array de hashes de recuperação)
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

4. **`user_sessions`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `user_id` INT NOT NULL (FK -> users.id ON DELETE CASCADE)
   - `token_hash` VARCHAR(128) NOT NULL UNIQUE
   - `ip_address` VARCHAR(45) NOT NULL
   - `user_agent` VARCHAR(255) NULL
   - `expires_at` DATETIME NOT NULL
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `last_active_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.2. Classificação, SLAs e Catálogo de Serviços
5. **`categories`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `name` VARCHAR(100) NOT NULL UNIQUE
   - `code` VARCHAR(50) NOT NULL UNIQUE
   - `description` TEXT NULL
   - `is_active` TINYINT(1) NOT NULL DEFAULT 1
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

6. **`subcategories`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `category_id` INT NOT NULL (FK -> categories.id ON DELETE CASCADE)
   - `name` VARCHAR(100) NOT NULL
   - `code` VARCHAR(50) NOT NULL
   - `default_team_id` INT NULL (FK -> teams.id ON DELETE SET NULL)
   - `default_sla_policy_id` INT NULL (FK -> sla_policies.id ON DELETE SET NULL)
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

7. **`sla_policies`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `name` VARCHAR(100) NOT NULL UNIQUE
   - `description` TEXT NULL
   - `priority` ENUM('P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA') NOT NULL
   - `first_response_minutes` INT NOT NULL (Minutos máximos para primeira resposta)
   - `resolution_minutes` INT NOT NULL (Minutos máximos para resolução definitiva)
   - `business_hours_only` TINYINT(1) NOT NULL DEFAULT 1 (1 = 09:00-18:00 seg-sex, 0 = 24/7)
   - `is_active` TINYINT(1) NOT NULL DEFAULT 1
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

8. **`service_catalog_items`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `name` VARCHAR(150) NOT NULL
   - `code` VARCHAR(50) NOT NULL UNIQUE
   - `description` TEXT NULL
   - `category_id` INT NOT NULL (FK -> categories.id)
   - `icon` VARCHAR(50) NOT NULL DEFAULT 'tool'
   - `requires_approval` TINYINT(1) NOT NULL DEFAULT 0
   - `approver_role` ENUM('supervisor', 'admin') NOT NULL DEFAULT 'supervisor'
   - `default_priority` ENUM('P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA') NOT NULL DEFAULT 'P3_MEDIA'
   - `form_schema_json` JSON NULL
   - `is_active` TINYINT(1) NOT NULL DEFAULT 1
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.3. CMDB e Gestão de Ativos
9. **`assets`**
   - `id` INT AUTO_INCREMENT PRIMARY KEY
   - `asset_tag` VARCHAR(50) NOT NULL UNIQUE (Ex: SW-NB-0042, SW-SRV-001)
   - `serial_number` VARCHAR(100) NOT NULL UNIQUE
   - `name` VARCHAR(150) NOT NULL
   - `asset_type` ENUM('LAPTOP', 'DESKTOP', 'SERVER', 'NETWORK', 'VM', 'MOBILE', 'OTHER') NOT NULL
   - `brand` VARCHAR(100) NOT NULL
   - `model` VARCHAR(150) NOT NULL
   - `status` ENUM('EM_STOCK', 'ATRIBUIDO', 'EM_REPARACAO', 'RESERVADO', 'ABATIDO') NOT NULL DEFAULT 'EM_STOCK'
   - `current_user_id` INT NULL (FK -> users.id ON DELETE SET NULL)
   - `department_id` INT NULL (FK -> departments.id ON DELETE SET NULL)
   - `purchase_date` DATE NULL
   - `warranty_end_date` DATE NULL
   - `ip_address` VARCHAR(45) NULL
   - `mac_address` VARCHAR(25) NULL
   - `operating_system` VARCHAR(100) NULL
   - `specs_json` JSON NULL
   - `notes` TEXT NULL
   - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
   - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

10. **`asset_history`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `asset_id` INT NOT NULL (FK -> assets.id ON DELETE CASCADE)
    - `action_type` ENUM('CRIADO', 'ATRIBUIDO', 'DEVOLVIDO', 'TRANSFERIDO', 'MANUTENCAO', 'ALTERACAO_DADOS', 'ABATIDO') NOT NULL
    - `performed_by_user_id` INT NOT NULL (FK -> users.id)
    - `previous_user_id` INT NULL (FK -> users.id ON DELETE SET NULL)
    - `new_user_id` INT NULL (FK -> users.id ON DELETE SET NULL)
    - `details` TEXT NOT NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

11. **`licenses`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `software_name` VARCHAR(150) NOT NULL
    - `vendor` VARCHAR(100) NOT NULL
    - `license_key` VARCHAR(255) NULL
    - `license_type` ENUM('SUBSCRIPTION', 'PERPETUAL', 'OEM', 'ENTERPRISE') NOT NULL
    - `total_seats` INT NOT NULL DEFAULT 1
    - `allocated_seats` INT NOT NULL DEFAULT 0
    - `expiration_date` DATE NULL
    - `cost_per_seat` DECIMAL(10,2) NULL
    - `purchase_order` VARCHAR(50) NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

12. **`asset_licenses`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `asset_id` INT NOT NULL (FK -> assets.id ON DELETE CASCADE)
    - `license_id` INT NOT NULL (FK -> licenses.id ON DELETE CASCADE)
    - `assigned_user_id` INT NULL (FK -> users.id ON DELETE SET NULL)
    - `assigned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

### 2.4. Tickets, Comentários, Anexos e Histórico
13. **`tickets`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `ticket_number` VARCHAR(30) NOT NULL UNIQUE (Ex: TCK-2026-00001)
    - `title` VARCHAR(255) NOT NULL
    - `description` LONGTEXT NOT NULL
    - `ticket_type` ENUM('INCIDENTE', 'PEDIDO_SERVICO', 'PROBLEMA', 'ALTERACAO') NOT NULL DEFAULT 'INCIDENTE'
    - `status` ENUM('NOVO', 'ATRIBUIDO', 'EM_PROGRESSO', 'PENDENTE_CLIENTE', 'PENDENTE_TERCEIROS', 'RESOLVIDO', 'FECHADO', 'CANCELADO') NOT NULL DEFAULT 'NOVO'
    - `impact` ENUM('BAIXO', 'MEDIO', 'ALTO', 'CRITICO') NOT NULL DEFAULT 'MEDIO'
    - `urgency` ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') NOT NULL DEFAULT 'MEDIA'
    - `priority` ENUM('P1_CRITICA', 'P2_ALTA', 'P3_MEDIA', 'P4_BAIXA') NOT NULL DEFAULT 'P3_MEDIA'
    - `requester_id` INT NOT NULL (FK -> users.id)
    - `assigned_agent_id` INT NULL (FK -> users.id ON DELETE SET NULL)
    - `assigned_team_id` INT NULL (FK -> teams.id ON DELETE SET NULL)
    - `department_id` INT NULL (FK -> departments.id ON DELETE SET NULL)
    - `category_id` INT NULL (FK -> categories.id ON DELETE SET NULL)
    - `subcategory_id` INT NULL (FK -> subcategories.id ON DELETE SET NULL)
    - `asset_id` INT NULL (FK -> assets.id ON DELETE SET NULL)
    - `catalog_item_id` INT NULL (FK -> service_catalog_items.id ON DELETE SET NULL)
    - `sla_policy_id` INT NULL (FK -> sla_policies.id ON DELETE SET NULL)
    - `first_response_due_at` DATETIME NULL
    - `first_responded_at` DATETIME NULL
    - `resolution_due_at` DATETIME NULL
    - `resolved_at` DATETIME NULL
    - `closed_at` DATETIME NULL
    - `sla_status` ENUM('DENTRO_PRAZO', 'EM_RISCO', 'VIOLADO', 'CUMPRIDO') NOT NULL DEFAULT 'DENTRO_PRAZO'
    - `resolution_summary` TEXT NULL
    - `cancel_reason` TEXT NULL
    - `custom_fields_json` JSON NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

14. **`ticket_comments`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `ticket_id` INT NOT NULL (FK -> tickets.id ON DELETE CASCADE)
    - `author_id` INT NOT NULL (FK -> users.id)
    - `comment_type` ENUM('PUBLIC', 'INTERNAL_NOTE', 'SYSTEM_UPDATE') NOT NULL DEFAULT 'PUBLIC'
    - `body` LONGTEXT NOT NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

15. **`ticket_attachments`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `ticket_id` INT NOT NULL (FK -> tickets.id ON DELETE CASCADE)
    - `comment_id` INT NULL (FK -> ticket_comments.id ON DELETE SET NULL)
    - `uploader_id` INT NOT NULL (FK -> users.id)
    - `file_name` VARCHAR(255) NOT NULL
    - `stored_file_name` VARCHAR(255) NOT NULL UNIQUE
    - `file_size` INT NOT NULL
    - `mime_type` VARCHAR(100) NOT NULL
    - `file_path` VARCHAR(500) NOT NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

16. **`ticket_history`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `ticket_id` INT NOT NULL (FK -> tickets.id ON DELETE CASCADE)
    - `actor_id` INT NOT NULL (FK -> users.id)
    - `event_type` ENUM('CRIADO', 'STATUS_ALTERADO', 'PRIORIDADE_ALTERADA', 'ATRIBUIDO', 'SLA_ATUALIZADO', 'RESOLVIDO', 'FECHADO', 'REABERTO', 'ANEXO_ADICIONADO', 'NOTA_INTERNA', 'COMENTARIO_PUBLICO', 'APROVACAO_SOLICITADA', 'APROVADO', 'REJEITADO') NOT NULL
    - `old_value` VARCHAR(255) NULL
    - `new_value` VARCHAR(255) NULL
    - `description` TEXT NOT NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

17. **`service_approvals`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `ticket_id` INT NOT NULL (FK -> tickets.id ON DELETE CASCADE)
    - `catalog_item_id` INT NOT NULL (FK -> service_catalog_items.id)
    - `approver_id` INT NULL (FK -> users.id ON DELETE SET NULL)
    - `requested_by_id` INT NOT NULL (FK -> users.id)
    - `status` ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE'
    - `approval_notes` TEXT NULL
    - `requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    - `decided_at` DATETIME NULL

### 2.5. Base de Conhecimento, Notificações e Auditoria
18. **`kb_articles`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `title` VARCHAR(255) NOT NULL
    - `slug` VARCHAR(255) NOT NULL UNIQUE
    - `summary` TEXT NOT NULL
    - `content` LONGTEXT NOT NULL
    - `category_id` INT NOT NULL (FK -> categories.id)
    - `author_id` INT NOT NULL (FK -> users.id)
    - `is_internal_only` TINYINT(1) NOT NULL DEFAULT 0
    - `is_published` TINYINT(1) NOT NULL DEFAULT 1
    - `view_count` INT NOT NULL DEFAULT 0
    - `helpful_count` INT NOT NULL DEFAULT 0
    - `not_helpful_count` INT NOT NULL DEFAULT 0
    - `tags` VARCHAR(255) NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

19. **`notifications`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `user_id` INT NOT NULL (FK -> users.id ON DELETE CASCADE)
    - `title` VARCHAR(200) NOT NULL
    - `message` TEXT NOT NULL
    - `notification_type` ENUM('TICKET_ASSIGNED', 'TICKET_UPDATED', 'SLA_WARNING', 'APPROVAL_REQUEST', 'SYSTEM') NOT NULL
    - `link_url` VARCHAR(255) NULL
    - `is_read` TINYINT(1) NOT NULL DEFAULT 0
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

20. **`audit_logs`**
    - `id` INT AUTO_INCREMENT PRIMARY KEY
    - `user_id` INT NULL (FK -> users.id ON DELETE SET NULL)
    - `action` VARCHAR(100) NOT NULL
    - `resource_type` VARCHAR(100) NOT NULL
    - `resource_id` VARCHAR(100) NULL
    - `old_values_json` JSON NULL
    - `new_values_json` JSON NULL
    - `ip_address` VARCHAR(45) NOT NULL
    - `user_agent` VARCHAR(255) NULL
    - `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

21. **`system_settings`**
    - `setting_key` VARCHAR(100) PRIMARY KEY
    - `setting_value` TEXT NOT NULL
    - `category` VARCHAR(50) NOT NULL
    - `description` VARCHAR(255) NULL
    - `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
