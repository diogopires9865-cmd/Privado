# SW Service Desk v1.0 - Checklist de Aceitação da Versão 1.0
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

Esta checklist define os critérios obrigatórios que devem ser validados e verificados antes de declarar o **SW Service Desk v1.0** pronto para ambiente de produção.

---

### [ ] 1. Arquitetura e Stack
- [ ] Backend Node.js Express rodando com suporte a TypeScript (`tsx`) e endpoints REST estruturados em `/api/v1/`.
- [ ] Frontend React 19 + Vite com Tailwind CSS responsivo e acessível.
- [ ] Base de dados relacional como única fonte de verdade (sem JSON ou localStorage para dados de negócio).
- [ ] Ficheiro `.env.example` completo com todas as variáveis de produção documentadas.
- [ ] DDL de migrações e seeds SQL para MySQL/MariaDB versionados e testados.
- [ ] Endpoints de integridade operacional `/api/v1/health/live` e `/api/v1/health/ready`.
- [ ] Scripts de infraestrutura Linux fornecidos (`backup.sh`, `restore.sh`, `sw-servicedesk.service`, `nginx-sw-servicedesk.conf`).

---

### [ ] 2. Autenticação, Sessões e 2FA
- [ ] Registo e autenticação com hash `bcryptjs` (salt 12).
- [ ] Autenticação de dois fatores (2FA TOTP RFC 6238) com geração de segredo, QR Code e códigos de recuperação.
- [ ] Gestão de sessões ativas com possibilidade de visualização e revogação.
- [ ] Rate limiting ativo em endpoints de autenticação contra brute-force.
- [ ] Cabeçalhos HTTP de segurança (`helmet`, CSP, HSTS, X-Frame-Options, X-Content-Type-Options).

---

### [ ] 3. Fluxo Completo de Gestão de Tickets (ITSM)
- [ ] Criação de Ticket guiada com seleção de tipo (Incidente, Pedido, Problema, Alteração), Categoria e Subcategoria.
- [ ] Matriz de prioridade automática calculada em tempo real com base no Impacto e Urgência.
- [ ] Atribuição de ticket a técnico ou equipa com notificação.
- [ ] Registo de primeira resposta com paragem de relógio do SLA de primeira resposta.
- [ ] Distinção entre comentários públicos (cliente) e notas internas confidenciais (técnicos).
- [ ] Upload seguro de anexos com validação de extensão, MIME e tamanho máximo de 20MB.
- [ ] Transições de estado completas: `NOVO` -> `ATRIBUIDO` -> `EM_PROGRESSO` -> `PENDENTE` -> `RESOLVIDO` -> `FECHADO`.
- [ ] Linha do tempo e histórico imutável com auditoria de todas as alterações de campo.

---

### [ ] 4. Políticas de SLA e Calendários
- [ ] Prazos distintos de primeira resposta e resolução para P1, P2, P3 e P4.
- [ ] Cálculo considerando horário útil de trabalho (8x5) e ininterrupto (24x7 para P1).
- [ ] Pausa automática de contagem de SLA quando o ticket está em `PENDENTE_CLIENTE` ou `PENDENTE_TERCEIROS`.
- [ ] Indicador visual com tempo restante e alerta de SLA em risco / violado.

---

### [ ] 5. CMDB e Gestão de Equipamentos (Ativos)
- [ ] Registo de equipamentos com Tag de Ativo, Serial Number, Marca, Modelo, Tipo e Specs.
- [ ] Atribuição de equipamento a colaborador com registo de termo de responsabilidade no histórico.
- [ ] Associação bidirecional de equipamento a tickets de suporte/avarias.
- [ ] Transferência de equipamento entre colaboradores com histórico de custódia inalterável.
- [ ] Abate de equipamento com justificação obrigatória e libertação de licenças vinculadas.

---

### [ ] 6. Gestão de Software e Licenças
- [ ] Registo de licenças por tipo (Subscrição, Perpétua, OEM, Enterprise) e chave de ativação.
- [ ] Controlo de assentos (Total de assentos vs. Alocados).
- [ ] Associação de licenças a equipamentos e colaboradores.
- [ ] Alertas de expiração próxima de subscrições.

---

### [ ] 7. Catálogo de Serviços e Workflows de Aprovação
- [ ] Catálogo de pedidos com formulários dinâmicos.
- [ ] Fluxo de aprovação integrado para itens que requerem autorização de supervisor.
- [ ] Fila de aprovações pendentes para aprovação/rejeição com justificação.

---

### [ ] 8. Base de Conhecimento (KB)
- [ ] Artigos organizados por categorias e tags.
- [ ] Distinção entre artigos públicos (colaboradores) e runbooks internos (técnicos).
- [ ] Controlo de visualizações e feedback útil/não útil.

---

### [ ] 9. Módulo de IA Privada para Técnicos
- [ ] Resumo executivo de tickets complexos.
- [ ] Sugestão de triagem (categoria, impacto, urgência).
- [ ] Sugestão de respostas técnicas baseadas no histórico.
- [ ] Regra de ouro: Confirmação humana obrigatória para qualquer alteração ou resposta sugerida pela IA.

---

### [ ] 10. Matriz de Segurança e RBAC
- [ ] Bloqueio estrito de acesso a dados alheios para o perfil `user`.
- [ ] Notas internas ocultas para clientes finais.
- [ ] Permissões de administração e auditoria restritas ao perfil `admin`.
- [ ] Registo detalhado em `audit_logs` para todas as ações operacionais.

---

### [ ] 11. Testes Automatizados e Resiliência
- [ ] Testes unitários para regras de cálculo de prioridade (`priorityMatrix.test.ts`).
- [ ] Testes unitários para motor de cálculo de prazos de SLA (`slaEngine.test.ts`).
- [ ] Testes unitários para ciclo de vida de ativos e histórico (`assetFlow.test.ts`).
- [ ] Testes unitários para matriz de permissões RBAC (`rbac.test.ts`).

---

### [ ] 12. Procedimentos de Backup, Restauro e Produção
- [ ] Scripts de dump e importação testados e operacionais.
- [ ] Endpoint seguro para exportação e importação de snapshot da base de dados por administradores.
- [ ] Configuração documentada para deployment em Linux com Nginx reverse proxy e systemd.
