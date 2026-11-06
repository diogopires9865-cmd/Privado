# SW Service Desk v1.0 - Estrutura de Diretórios
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

```
sw-service-desk/
├── .env.example                     # Modelo de variáveis de ambiente de produção
├── .gitignore                       # Ignora node_modules, ficheiros de upload e backups locais
├── index.html                       # Entry-point HTML com metadados e branding
├── metadata.json                    # Metadados da aplicação AI Studio
├── package.json                     # Scripts de arranque (dev, build, start, test, lint) e dependências
├── server.ts                        # Ponto de entrada do backend Express + montagem Vite
├── tsconfig.json                    # Configuração TypeScript
├── vite.config.ts                   # Configuração Vite com Tailwind v4
│
├── docs/                            # Documentação técnica e especificações
│   ├── 01_ESPECIFICACAO_FUNCIONAL.md
│   ├── 02_ARQUITETURA_E_SEGURANCA.md
│   ├── 03_ESTRUTURA_DE_DIRETORIOS.md
│   ├── 04_MODELO_BASE_DE_DADOS_MYSQL.md
│   ├── 05_RELACOES_E_INDICES.md
│   ├── 06_MATRIZ_DE_PERMISSOES_RBAC.md
│   ├── 07_WORKFLOWS_E_SLA.md
│   └── 08_CHECKLIST_ACEITACAO_V1.md
│
├── scripts/                         # Automação de infraestrutura, deploys e backups
│   ├── mysql-schema.sql             # Esquema DDL completo para MySQL 8 / MariaDB
│   ├── mysql-seed.sql               # Dados de seed padrão para produção / homologação
│   ├── backup.sh                    # Script bash para backup automatizado (mysqldump + uploads)
│   ├── restore.sh                   # Script bash para recuperação de desastre (DR)
│   ├── nginx-sw-servicedesk.conf    # Configuração de Reverse Proxy Nginx com SSL e compressão
│   └── sw-servicedesk.service       # Ficheiro de serviço systemd para Linux
│
├── server/                          # Código Backend (Node.js + Express)
│   ├── config/
│   │   ├── env.ts                   # Leitura tipada e validação de variáveis de ambiente
│   │   └── constants.ts             # Enums de Ticket, Papéis, SLAs e limites
│   ├── db/
│   │   ├── index.ts                 # Pool de conexões SQL e interface unificada
│   │   ├── migrations.ts            # Executador de migrations idempotentes
│   │   └── seed.ts                  # Carregamento de dados de arranque (Admin padrão, equipas, SLAs)
│   ├── middleware/
│   │   ├── auth.ts                  # Validação JWT, sessão e recuperação de utilizador
│   │   ├── rbac.ts                  # Middleware de autorização por papel e permissão
│   │   ├── rateLimiter.ts           # Rate limiting para proteção de endpoints sensíveis
│   │   ├── upload.ts                # Validação segura de uploads (MIME, extensão, tamanho)
│   │   ├── auditLogger.ts           # Intercetor de auditoria para operações CUD
│   │   └── errorHandler.ts          # Tratamento centralizado e sanitização de erros
│   ├── services/
│   │   ├── slaEngine.ts             # Motor de cálculo de SLA útil e escalamentos
│   │   ├── emailService.ts          # Envio de emails transacionais e templates HTML
│   │   ├── teamsService.ts          # Notificações em webhook Microsoft Teams
│   │   ├── aiAssistantService.ts    # Assistente Gemini com validação estrita e confirmação humana
│   │   ├── auditService.ts          # Gravação estruturada de logs de auditoria
│   │   └── backupService.ts         # Geração e importação de snapshots de base de dados
│   ├── controllers/
│   │   ├── authController.ts        # Login, 2FA, logout, sessões ativas
│   │   ├── ticketController.ts      # CRUD de tickets, transições, prioridade automática
│   │   ├── commentController.ts     # Comentários públicos e notas internas privadas
│   │   ├── assetController.ts       # Gestão de inventário CMDB, histórico e custódia
│   │   ├── licenseController.ts     # Gestão de licenças de software e associações
│   │   ├── kbController.ts          # Base de conhecimento e artigos técnicos
│   │   ├── workflowController.ts    # Catálogo de serviços e aprovações
│   │   ├── userController.ts        # Gestão de utilizadores, equipas e departamentos
│   │   ├── slaController.ts         # Políticas e métricas de SLA
│   │   ├── reportController.ts      # Relatórios analíticos e exportação CSV
│   │   ├── aiController.ts          # Endpoints de IA (resumos, sugestões, triagem)
│   │   └── healthController.ts      # Health checks (/live e /ready)
│   └── routes/                      # Mapeamento RESTful de endpoints (/api/v1/*)
│       └── index.ts
│
├── src/                             # Código Frontend (React 19 + TypeScript + Vite)
│   ├── assets/                      # Imagens, logótipos e SVG da SW Cloud Solutions
│   ├── context/
│   │   ├── AuthContext.tsx          # Gestão de estado de autenticação, perfil e permissões
│   │   └── ToastContext.tsx         # Notificações visuais e mensagens de erro/sucesso
│   ├── services/
│   │   └── api.ts                   # Cliente HTTP tipado com tratamento de sessão e erros
│   ├── components/                  # Componentes reutilizáveis
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx        # Shell principal com Sidebar e Header
│   │   │   ├── Header.tsx           # Barra superior com pesquisa global, alertas e perfil
│   │   │   └── Sidebar.tsx          # Navegação lateral por perfil de acesso
│   │   ├── common/
│   │   │   ├── Badge.tsx            # Badges coloridas de prioridade, estado e impacto
│   │   │   ├── Modal.tsx            # Modais acessíveis
│   │   │   ├── ConfirmDialog.tsx    # Confirmação humana obrigatória para ações críticas
│   │   │   ├── DataTable.tsx        # Tabelas com paginação, ordenação e pesquisa
│   │   │   ├── SLAIndicator.tsx     # Barra visual de SLA e tempo restante
│   │   │   └── StatCard.tsx         # Cartões de métricas no dashboard
│   │   └── ai/
│   │       └── AIAssistantModal.tsx # Painel de IA com confirmação prévia obrigatória
│   ├── pages/                       # Vistas principais da aplicação
│   │   ├── Login.tsx                # Ecrã de Login seguro com suporte a 2FA TOTP
│   │   ├── TwoFactorSetup.tsx       # Configuração inicial de 2FA com QR Code
│   │   ├── Dashboard.tsx            # Dashboard executivo e operacional com métricas em tempo real
│   │   ├── Tickets.tsx              # Lista avançada de tickets com filtros e ordenação
│   │   ├── TicketDetail.tsx         # Vista 360º do ticket (comentários, notas, histórico, SLA, IA)
│   │   ├── CreateTicket.tsx         # Formulário guiado com cálculo automático de prioridade
│   │   ├── ServiceCatalog.tsx       # Catálogo de pedidos com workflows de aprovação
│   │   ├── AssetsCMDB.tsx           # Gestão de equipamentos, atribuição e ciclo de vida
│   │   ├── AssetDetail.tsx          # Ficha do equipamento, histórico de custódia e tickets
│   │   ├── Licenses.tsx             # Gestão de licenças de software e conformidade
│   │   ├── KnowledgeBase.tsx        # Base de conhecimento com artigos públicos e privados
│   │   ├── KBDetail.tsx             # Visualização e leitura de artigo com feedback
│   │   ├── Approvals.tsx            # Fila de pedidos pendentes de aprovação de supervisor
│   │   ├── Reports.tsx              # Relatórios analíticos e exportação de dados
│   │   ├── AuditLogs.tsx            # Registo imutável de auditoria e segurança
│   │   ├── Settings.tsx             # Configurações de utilizadores, equipas, SLAs e backups
│   │   └── SystemHealth.tsx         # Diagnóstico de integridade, serviços e base de dados
│   ├── App.tsx                      # Router e controlo de rotas autenticadas por RBAC
│   ├── main.tsx                     # Ponto de montagem React DOM
│   └── index.css                    # Folhas de estilo globais Tailwind CSS
│
└── tests/                           # Testes unitários com node:test
    ├── slaEngine.test.ts            # Teste de cálculo de SLA e horário útil
    ├── priorityMatrix.test.ts       # Teste da matriz Impacto x Urgência -> Prioridade
    ├── rbac.test.ts                 # Teste de regras de autorização por papel
    └── assetFlow.test.ts            # Teste do ciclo de vida e histórico de ativos
```
