# SW Service Desk v1.0 - Relações e Índices
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

## 1. Matriz de Integridade Referencial (Foreign Keys)

| Tabela Origem | Coluna Origem | Tabela Destino | Coluna Destino | ON DELETE | Justificação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `departments` | `manager_id` | `users` | `id` | `SET NULL` | A remoção de utilizador não apaga o departamento. |
| `teams` | `department_id` | `departments` | `id` | `RESTRICT` | Um departamento com equipas não pode ser apagado inadvertidamente. |
| `teams` | `leader_id` | `users` | `id` | `SET NULL` | A saída de um líder mantém a equipa intacta. |
| `users` | `department_id` | `departments` | `id` | `SET NULL` | Desassociação suave em reorganizações. |
| `users` | `team_id` | `teams` | `id` | `SET NULL` | Transferência suave entre equipas. |
| `user_sessions` | `user_id` | `users` | `id` | `CASCADE` | Sessões do utilizador são expurgadas na sua eliminação. |
| `subcategories` | `category_id` | `categories` | `id` | `CASCADE` | Subcategorias dependem estritamente da categoria pai. |
| `service_catalog_items` | `category_id` | `categories` | `id` | `RESTRICT` | Impede apagar categorias com serviços ativos. |
| `assets` | `current_user_id` | `users` | `id` | `SET NULL` | Saída de colaborador deixa ativo em stock sem perder o registo do equipamento. |
| `assets` | `department_id` | `departments` | `id` | `SET NULL` | Desassociação departamental sem perda de equipamento. |
| `asset_history` | `asset_id` | `assets` | `id` | `CASCADE` | Histórico acompanha a existência do ativo. |
| `asset_history` | `performed_by_user_id`| `users` | `id` | `RESTRICT` | Garante rastreabilidade forense do operador. |
| `asset_licenses`| `asset_id` | `assets` | `id` | `CASCADE` | Desalocação automática ao abater equipamento. |
| `asset_licenses`| `license_id` | `licenses` | `id` | `CASCADE` | Remoção de licença desaloca vínculos. |
| `tickets` | `requester_id` | `users` | `id` | `RESTRICT` | Histórico de tickets do solicitante é preservado. |
| `tickets` | `assigned_agent_id`| `users` | `id` | `SET NULL` | Se o técnico sair, o ticket fica livre para reatribuição. |
| `tickets` | `assigned_team_id` | `teams` | `id` | `SET NULL` | Ticket não é perdido se equipa for descontinuada. |
| `tickets` | `asset_id` | `assets` | `id` | `SET NULL` | Abate de equipamento mantém o ticket histórico. |
| `tickets` | `sla_policy_id` | `sla_policies` | `id` | `SET NULL` | Preserva ticket se regra de SLA for arquivada. |
| `ticket_comments`| `ticket_id` | `tickets` | `id` | `CASCADE` | Comentários acompanham o ticket. |
| `ticket_attachments`| `ticket_id` | `tickets` | `id` | `CASCADE` | Anexos são eliminados com o ticket. |
| `ticket_history` | `ticket_id` | `tickets` | `id` | `CASCADE` | Linha temporal pertence exclusivamente ao ticket. |
| `service_approvals`| `ticket_id` | `tickets` | `id` | `CASCADE` | Registo de aprovação vinculado ao ticket. |
| `notifications` | `user_id` | `users` | `id` | `CASCADE` | Notificações de utilizador removido são limpas. |
| `audit_logs` | `user_id` | `users` | `id` | `SET NULL` | Log de auditoria permanece para sempre mesmo após saída de funcionário. |

---

## 2. Estratégia de Índices e Otimização de Performance

### 2.1. Índices Únicos (Unicidade e Integridade)
- `users(email)`: Pesquisa imediata em O(1) no login e garantia de emails únicos.
- `user_sessions(token_hash)`: Lookup rápido da sessão ativa a cada pedido HTTP autenticado.
- `assets(asset_tag)`: Código de barras / Tag de inventário unívoca.
- `assets(serial_number)`: Garantia de não duplicação de hardware no CMDB.
- `tickets(ticket_number)`: Chave pública de referência (ex.: `TCK-2026-00001`).
- `categories(code)` e `service_catalog_items(code)`: Chaves programáticas de catálogo.
- `kb_articles(slug)`: URLs amigáveis para partilha direta de artigos.

### 2.2. Índices Compostos (Composite B-Tree Indexes)
- `tickets(status, priority, created_at)`: Utilizado na vista principal de fila de suporte (Dashboard e Inbox de Técnicos).
- `tickets(assigned_agent_id, status)`: Utilizado na vista "Os Meus Tickets Atribuídos".
- `tickets(requester_id, status)`: Utilizado no portal do utilizador "Os Meus Pedidos".
- `tickets(sla_status, resolution_due_at)`: Utilizado pelo motor de monitorização de SLAs em risco ou violados.
- `assets(status, asset_type)`: Filtro rápido no inventário de stock disponível para entrega.
- `assets(current_user_id)`: Consulta imediata de todos os equipamentos na posse de um colaborador.
- `notifications(user_id, is_read, created_at)`: Consulta da badge de notificações não lidas no cabeçalho.
- `audit_logs(resource_type, resource_id, created_at)`: Timeline forense de auditoria de um recurso específico.
- `audit_logs(user_id, created_at)`: Auditoria de atividades por operador.

### 2.3. Índices de Texto Completo (Full-Text Search)
- `tickets(title, description)`: Pesquisa global por termos, códigos de erro ou mensagens de clientes.
- `kb_articles(title, summary, content)`: Pesquisa inteligente de soluções e runbooks recomendados.
