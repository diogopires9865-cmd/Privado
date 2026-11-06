# SW Service Desk v1.0 - Matriz de Permissões RBAC
**Empresa:** SW Cloud Solutions  
**Versão:** 1.0.0 Production Ready  
**Data:** 2026-11-06  

---

## 1. Definição dos Papéis de Acesso

- **`user` (Colaborador / Solicitante):**  
  Acesso ao portal de autoatendimento. Pode abrir tickets, consultar os seus próprios pedidos, aprovar/confirmar resolução dos seus tickets, consultar artigos públicos da Knowledge Base e visualizar os equipamentos que tem sob a sua custódia.
  
- **`agent` (Técnico / Engenheiro de Suporte):**  
  Responsável pelo tratamento de pedidos e incidentes. Pode visualizar tickets da sua equipa e globais, interagir com solicitantes, registar notas internas privadas, consultar runbooks e artigos internos, associar ativos do CMDB a tickets e utilizar a assistência de IA (sujeita a confirmação).
  
- **`supervisor` (Coordenador de Service Desk):**  
  Responsável pela supervisão operacional. Aprova pedidos de serviço que exigem validação hierárquica, reatribui tickets entre equipas, monitoriza o cumprimento de SLAs e tempos de resposta, gere artigos da Knowledge Base e visualiza relatórios e dashboards executivos.
  
- **`admin` (Administrador de Sistema):**  
  Acesso irrestrito a todas as operações, incluindo parametrização de infraestrutura, gestão de utilizadores e papéis, redefinição forçada de 2FA, configuração de políticas de SLA, inspeção dos registos de auditoria, execução de backups e restauro da base de dados.

---

## 2. Matriz Granular de Acesso

| Funcionalidade / Operação | `user` | `agent` | `supervisor` | `admin` |
| :--- | :---: | :---: | :---: | :---: |
| **Tickets & Incidentes** |
| Abrir novo ticket / incidente | Sim | Sim | Sim | Sim |
| Ver tickets próprios | Sim | Sim | Sim | Sim |
| Ver todos os tickets da equipa/empresa | Não | Sim | Sim | Sim |
| Atribuir ticket a si próprio | Não | Sim | Sim | Sim |
| Reatribuir ticket a outro técnico/equipa | Não | Sim | Sim | Sim |
| Adicionar comentário público | Sim (próprios) | Sim | Sim | Sim |
| Adicionar nota interna confidencial | Não | Sim | Sim | Sim |
| Alterar Prioridade / Impacto / Urgência | Não | Sim | Sim | Sim |
| Alterar Estado (Em Progresso / Pendente) | Não | Sim | Sim | Sim |
| Marcar como Resolvido | Não | Sim | Sim | Sim |
| Confirmar Resolução e Fechar Ticket | Sim (próprio) | Sim | Sim | Sim |
| Cancelar Ticket | Sim (se Novo) | Sim | Sim | Sim |
| Ver Linha do Tempo e Histórico Completo | Parcial (Público) | Completo | Completo | Completo |
| **CMDB & Gestão de Ativos** |
| Ver equipamentos atribuídos a si | Sim | Sim | Sim | Sim |
| Ver inventário completo de equipamentos | Não | Sim | Sim | Sim |
| Registar novo equipamento (Entrada em Stock) | Não | Sim | Sim | Sim |
| Atribuir equipamento a colaborador | Não | Sim | Sim | Sim |
| Registar devolução / recolha de equipamento | Não | Sim | Sim | Sim |
| Transferir equipamento entre utilizadores | Não | Sim | Sim | Sim |
| Abater / Retirar equipamento de serviço | Não | Não | Sim | Sim |
| Consultar histórico de custódia do ativo | Não | Sim | Sim | Sim |
| Associar equipamento a Ticket de Incidente | Sim (atribuído) | Sim | Sim | Sim |
| **Software & Licenças** |
| Consultar licenças atribuídas a si | Sim | Sim | Sim | Sim |
| Consultar inventário global de licenças | Não | Sim | Sim | Sim |
| Adicionar / Comprar novas licenças | Não | Não | Sim | Sim |
| Associar licença a equipamento / utilizador | Não | Sim | Sim | Sim |
| **Catálogo de Serviços & Aprovações** |
| Solicitar item do Catálogo | Sim | Sim | Sim | Sim |
| Aprovar / Rejeitar pedidos de serviço | Não | Não | Sim | Sim |
| Criar / Editar itens do Catálogo | Não | Não | Não | Sim |
| **Base de Conhecimento (KB)** |
| Ler artigos públicos | Sim | Sim | Sim | Sim |
| Ler artigos internos (Runbooks / Guias Técnicos)| Não | Sim | Sim | Sim |
| Criar / Editar artigos | Não | Sim | Sim | Sim |
| Eliminar artigos | Não | Não | Sim | Sim |
| **Módulo de IA Privada** |
| Resumo do ticket por IA | Não | Sim | Sim | Sim |
| Sugestão de resposta por IA | Não | Sim | Sim | Sim |
| Confirmação humana para aplicar sugestão IA | N/A | Obrigatória | Obrigatória | Obrigatória |
| **Gestão e Administração** |
| Gerir utilizadores, equipas e departamentos | Não | Não | Não | Sim |
| Configurar Políticas de SLA e Calendários | Não | Não | Sim | Sim |
| Dashboards e Relatórios Analíticos | Não | Próprio | Completo | Completo |
| Consultar Audit Logs (Segurança) | Não | Não | Não | Sim |
| Executar / Descarregar Backup de BD | Não | Não | Não | Sim |
| Restaurar Snapshot de BD | Não | Não | Não | Sim |
| Health Check e Diagnóstico de Serviços | Não | Não | Não | Sim |
