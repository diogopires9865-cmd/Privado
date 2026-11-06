# SW Service Desk v1.0 - Arquitetura de Sistema e Segurança
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

## 1. Arquitetura Geral do Sistema

```
                       +-----------------------------------+
                       |    Clientes Web / Mobile Browser  |
                       +-----------------+-----------------+
                                         | HTTPS (Port 443)
                                         v
                       +-----------------------------------+
                       |    Reverse Proxy: Nginx / Apache  |
                       |    - SSL Termination (Let's Encrypt)|
                       |    - Gzip/Brotli Compression      |
                       |    - Security Headers (HSTS, etc) |
                       |    - Rate Limiting Shield         |
                       +-----------------+-----------------+
                                         | Reverse Proxy (Port 3000)
                                         v
                       +-----------------------------------+
                       |      Node.js Express App Server   |
                       |                                   |
                       |  +-----------------------------+  |
                       |  |  Middlewares Globais        |  |
                       |  |  (Helmet, CORS, RateLimit,  |  |
                       |  |   BodyParser, CookieParser, |  |
                       |  |   Audit & Structured Logger)|  |
                       |  +--------------+--------------+  |
                       |                 |                 |
                       |  +--------------v--------------+  |
                       |  |  Rotas da API REST (/api/v1)|  |
                       |  |  - /auth (Login, 2FA, JWT)  |  |
                       |  |  - /tickets & /comments     |  |
                       |  |  - /assets (CMDB) & /lic... |  |
                       |  |  - /kb (Knowledge Base)     |  |
                       |  |  - /users & /teams & /dept  |  |
                       |  |  - /sla & /workflows        |  |
                       |  |  - /ai (Gemini Assistant)   |  |
                       |  |  - /admin (Audit, Backups)  |  |
                       |  |  - /health (Live & Ready)   |  |
                       |  +--------------+--------------+  |
                       |                 |                 |
                       |  +--------------v--------------+  |
                       |  |  Serviço SPA React Vite     |  |
                       |  |  (Static Assets / Front-end)|  |
                       |  +-----------------------------+  |
                       +-----------------+-----------------+
                                         | SQL Connection Pool
                                         v
                       +-----------------------------------+
                       |    Base de Dados MySQL / MariaDB  |
                       |    - Fonte de Verdade Relacional  |
                       |    - Transações ACID              |
                       |    - Migrations Versionadas       |
                       |    - Seeds Iniciais               |
                       |    - Índices Otimizados           |
                       +-----------------------------------+
```

---

## 2. Padrões de Segurança Implementados

### 2.1. Autenticação e Gestão de Segredos
- **Hashing de Palavras-passe:** Utilização de `bcryptjs` com custo computacional (salt rounds = 12).
- **Tokens de Acesso e Sessões:**
  - JWT com algoritmo HMAC-SHA256 e chave secreta robusta lida de `JWT_SECRET`.
  - Controlo de sessão em tabela `user_sessions`: permite invalidação imediata em caso de roubo de dispositivo ou término manual.
- **2FA Obrigatório para Técnicos/Admins (Opcional para Utilizadores):**
  - Implementação RFC 6238 TOTP (`speakeasy` + `qrcode`).
  - Chaves secretas armazenadas encriptadas na BD com chave de aplicação.
- **Proteção contra Brute Force:**
  - `express-rate-limit` aplicado a endpoints sensíveis (`/api/v1/auth/login`, `/api/v1/auth/verify-2fa`, `/api/v1/auth/reset-password`).
  - Janela de 15 minutos e máximo de 5 tentativas por IP/conta.

### 2.2. Proteção de Transporte e Cabeçalhos HTTP
- Configuração de cabeçalhos de segurança via `helmet`:
  - `Content-Security-Policy` (CSP)
  - `Strict-Transport-Security` (HSTS)
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Cookies com flags `HttpOnly`, `SameSite=Lax` e `Secure` (em produção HTTPS).

### 2.3. Sanitização e Prevenção de Injeção
- Todas as operações na base de dados utilizam **queries parametrizadas** com `?` (ou driver seguro).
- Sanitização de inputs nos controladores com validação de esquema de tipos (tamanhos de string, formatos de email, UUIDs/IDs inteiros, enums estritos).
- Prevenção de XSS na renderização através da fuga automática de strings no motor React.

### 2.4. Upload Seguro de Ficheiros
- Middleware `multer` com armazenamento isolado fora da raiz pública.
- Verificação estrita de MIME types autorizados:
  - Documentos: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/plain`
  - Imagens: `image/png`, `image/jpeg`, `image/webp`
  - Arquivos comprimidos: `application/zip`
- Bloqueio imediato de extensões perigosas (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.php`, `.py`, `.dll`, `.scr`, `.vbs`).
- Limite rígido de 20 MB por ficheiro.
- Renomeação aleatória (UUIDv4) para evitar sobrescritas ou Directory Traversal (`../../`).
- Acesso ao ficheiro apenas via rota autenticada `/api/v1/attachments/:id/download`, validando permissões de acesso ao ticket associado.

### 2.5. RBAC (Role-Based Access Control) Rigoroso
- O middleware `requireAuth` e `requireRole([...])` protege todas as rotas da API.
- Um utilizador padrão (`user`) apenas tem permissão de leitura e criação nos seus próprios tickets e artigos públicos da Knowledge Base.
- Técnicos (`agent`) têm acesso aos tickets atribuídos e filas de suporte, mas não têm acesso a configurações financeiras, licenças de software restritas ou gestão de utilizadores.
- Supervisores (`supervisor`) têm visão de relatórios, equipas, SLAs e aprovações.
- Administradores (`admin`) têm acesso pleno, auditoria, backups e parametrização do sistema.

### 2.6. Auditoria Estruturada (Audit Log)
- Tabela `audit_logs` imutável que regista:
  - `id`, `user_id`, `action`, `resource_type`, `resource_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`.
- Todas as ações críticas (criação/eliminação de utilizadores, alterações de permissões, abate de equipamentos, aprovações, violação de regras) são auditadas automaticamente.

---

## 3. Estratégia de Base de Dados e Compatibilidade
- **Base de Dados Primária:** MySQL 8.0+ / MariaDB 10.6+.
- **Abstração Relacional Segura:** O backend utiliza um adaptador relacional SQL com pool de conexões (`mysql2/promise`), transações ACID e suporte a migrations automáticas.
- **Ambiente de Desenvolvimento & AI Studio:** Para assegurar que o preview e os testes unitários funcionam imediatamente sem dependência externa, o sistema inclui um adaptador SQLite integrado (`better-sqlite3`) com as mesmas tabelas, chaves estrangeiras e índices relacionais quando `DB_DIALECT=sqlite` (predefinido para o ambiente de sandbox), alternando de forma transparente para `DB_DIALECT=mysql` em produção com base no ficheiro `.env`.
- **Scripts de Backup e Restauro:** Rotinas completas em `/scripts/backup.sh` e `/scripts/restore.sh`, acompanhadas de endpoint administrativo autenticado para download do snapshot SQL.
