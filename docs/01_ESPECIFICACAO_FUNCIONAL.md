# SW Service Desk v1.0 - Especificação Funcional Completa
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

## 1. Visão Geral e Âmbito
O **SW Service Desk v1.0** é o sistema central de gestão de serviços de TI (ITSM) e suporte técnico da **SW Cloud Solutions**, concebido de acordo com as melhores práticas da framework ITIL v4, adaptadas à realidade operacional de suporte de cloud e infraestruturas críticas.

O sistema atua como ponto único de contacto (SPOC) para colaboradores internos, equipas técnicas de engenharia de cloud e administração de sistemas.

---

## 2. Módulos Funcionais Principais

### 2.1. Gestão de Identidades, Acessos e Sessões
- **Autenticação Local Segura:** Hashing com BCrypt (salt rounds 12), proteção contra brute-force e rate-limiting (5 tentativas falhadas / 15 min de bloqueio progressivo).
- **Autenticação de Dois Fatores (2FA / TOTP):** Baseada em RFC 6238 (compatível com Microsoft Authenticator e Google Authenticator), geração de segredo, QR Code e códigos de recuperação unívocos.
- **Gestão de Sessões Ativas:** Tokens JWT assinados com expiração configurável, armazenamento seguro de sessão na base de dados com registo de IP, User-Agent, data de último acesso e capacidade de revogação remota individual ou global.
- **RBAC (Role-Based Access Control):** 4 papéis base com granularidade estrita:
  1. `admin` (Administrador de Sistema)
  2. `supervisor` (Coordenador de Service Desk / ITSM Lead)
  3. `agent` (Técnico / Engenheiro de Suporte)
  4. `user` (Colaborador / Solicitante final)

### 2.2. Gestão de Incidentes e Pedidos de Serviço (Service Desk ITSM)
- **Tipos de Ticket:**
  - *Incidente:* Interrupção não planeada ou degradação de um serviço de TI.
  - *Pedido de Serviço:* Solicitação de novo acesso, equipamento, alteração de permissões ou informação.
  - *Problema:* Causa raiz subjacente a incidentes recorrentes ou incidentes críticos.
  - *Alteração (RFC - Request For Change):* Modificação estrutural em serviços ou infraestrutura.
- **Categorização Hierárquica:** Categoria e Subcategoria (ex.: Cloud Infrastructure > AWS VPC, Hardware > Laptop, Software > Microsoft 365, etc.).
- **Matriz de Prioridade Automática:**
  - Impacto (Baixo, Médio, Alto, Crítico)
  - Urgência (Baixa, Média, Alta, Crítica)
  - Cálculo automático: $Prioridade = f(Impacto, Urgência)$ resultando em P1 (Crítica), P2 (Alta), P3 (Média), P4 (Baixa).
- **Ciclo de Vida do Ticket:**
  - `NOVO` -> `ATRIBUIDO` -> `EM_PROGRESSO` -> `PENDENTE_CLIENTE` / `PENDENTE_TERCEIROS` -> `RESOLVIDO` -> `FECHADO` -> `CANCELADO`.
- **Comunicação Dual:**
  - *Comentários Públicos:* Visíveis para o solicitante e equipa técnica.
  - *Notas Internas (Privadas):* Exclusivas para técnicos e supervisores.
- **Atribuição:** Atribuição direta a técnico ou atribuição por equipa (ex.: Cloud Ops, Helpdesk N1, Networking, SecOps).
- **Gestão de Anexos:** Upload com validação de extensão permitida, análise de MIME type, limite de 20MB por ficheiro e armazenamento isolado com URLs protegidos por autenticação.
- **Histórico e Auditoria:** Timeline imutável registando todas as transições de estado, alterações de campo, reatribuições e tempos de resposta.

### 2.3. Gestão de SLA (Service Level Agreements) e Calendários
- **Políticas de SLA:**
  - Tempo Limite de Primeira Resposta (First Response SLA)
  - Tempo Limite de Resolução (Resolution SLA)
- **Cálculo Baseado em Horário de Trabalho:**
  - Calendário 8x5 (dias úteis das 09:00 às 18:00 com pausa de almoço)
  - Calendário 24x7 para tickets P1 Críticos de infraestrutura
- **Pausa de SLA:** SLA pausa automaticamente nos estados `PENDENTE_CLIENTE` e `PENDENTE_TERCEIROS`.
- **Escalamento:** Notificação automática a supervisores quando o SLA atinge 75% e 100% do tempo decorrido.

### 2.4. Catálogo de Serviços e Formulários Dinâmicos
- Catálogo de serviços com itens padronizados (ex.: Acesso VPN, Provisionamento de VM AWS/Azure, Novo Posto de Trabalho, Licença de Software).
- Campos customizados com validações (obrigatório, tipo texto, numérico, seleção, data).
- Fluxos de Aprovação (Workflow): Itens que exigem aprovação de chefia ou supervisor antes da execução técnica.

### 2.5. CMDB & Gestão de Ativos (Equipamentos e Software)
- Registo completo de ativos físicos e virtuais: Servidores, Laptops, Desktops, Routers/Switches, VMs, Instâncias Cloud.
- Dados: Número de Série, Tag de Ativo, Modelo, Fabricante, IP, MAC Address, Estado (Em stock, Atribuído, Em reparação, Abatido).
- **Associação de Ativos a Colaboradores:** Registo de entrega, histórico de custódia e transferências entre utilizadores.
- **Associação Ativo-Ticket:** Diagnóstico de incidentes recorrentes associados a uma máquina específica.
- **Inventário de Software e Licenças:** Licenças adquiridas vs. atribuídas, chave de ativação, fornecedor, validade e renovação.
- Histórico do ciclo de vida: do provisionamento ao abate definitivo com registo de data e justificação.

### 2.6. Base de Conhecimento (Knowledge Base / KB)
- Artigos técnicos organizados por categorias e tags.
- Níveis de visibilidade: Artigos públicos (para colaboradores) e Artigos internos (runbooks para técnicos).
- Mecanismo de feedback e contagem de visualizações úteis ("Isto foi útil?").

### 2.7. Módulo de IA Privada para Técnicos (Assistência Segura)
- **Geração de Resumo Executivo:** Resumo automático de tickets longos com múltiplos comentários.
- **Classificação e Sugestão de Prioridade/Categoria:** Sugestão inteligente para novos pedidos.
- **Sugestão de Respostas Técnicas:** Geração de resposta contextualizada com base no histórico e runbooks.
- **Pesquisa Semântica na Base de Conhecimento:** Busca por similaridade conceptual.
- **Guarda de Segurança Humana (Human-in-the-Loop):** Nenhuma alteração de estado, atribuição ou envio de mensagem de IA é executado sem clique explícito de confirmação por parte do técnico humano.

### 2.8. Notificações e Integrações
- Notificações internas no sistema em tempo real (painel com contadores de não lidas).
- Notificações por Email com templates HTML profissionais (SW Cloud Solutions branding).
- Suporte a webhook e conectores para Microsoft Teams e Microsoft 365 (notificação de tickets P1 em canal dedicado).

### 2.9. Dashboards, Métricas e Relatórios
- Indicadores em tempo real:
  - Tickets Abertos por Prioridade e Estado
  - Cumprimento de SLA (% no prazo vs violados)
  - MTTA (Mean Time to Acknowledge / Primeiro Contacto)
  - MTTR (Mean Time to Resolution)
  - Distribuição de tickets por técnico e equipa
  - Ativos mais problemáticos no CMDB
- Exportação de relatórios em CSV e JSON.
