-- ========================================================================
-- SW Service Desk v1.0 - Seed Data SQL para Produção e Homologação
-- Empresa: SW Cloud Solutions
-- ========================================================================

-- Palavras-passe encriptadas com bcrypt (cost 12):
-- admin@swcloudsolutions.pt      -> Admin123!@# ($2a$12$e6M1pW8r2i9qCke4Gk4aE.uIuP0gQ77u0y2X3gEw7N3HlY6jYmQ9K)
-- supervisor@swcloudsolutions.pt -> Supervisor123!@# ($2a$12$e6M1pW8r2i9qCke4Gk4aE.uIuP0gQ77u0y2X3gEw7N3HlY6jYmQ9K)
-- agente.cloud@swcloudsolutions.pt -> Agent123!@# ($2a$12$e6M1pW8r2i9qCke4Gk4aE.uIuP0gQ77u0y2X3gEw7N3HlY6jYmQ9K)
-- diogo.pires@swcloudsolutions.pt -> User123!@# ($2a$12$e6M1pW8r2i9qCke4Gk4aE.uIuP0gQ77u0y2X3gEw7N3HlY6jYmQ9K)

INSERT INTO departments (id, name, code, description) VALUES
(1, 'Engenharia de Cloud & DevOps', 'CLOUD_ENG', 'Arquitetura e gestão de infraestruturas AWS, Azure e Kubernetes'),
(2, 'Cibersegurança & SecOps', 'SECOPS', 'Gestão de acessos, auditorias de segurança e resposta a incidentes'),
(3, 'Infraestruturas & Redes', 'NET_INFRA', 'Rede local, switches, firewalls e conectividade empresarial'),
(4, 'Operações & Service Desk', 'ITSM_OPS', 'Suporte técnico aos colaboradores e gestão de ativos'),
(5, 'Recursos Humanos & Finanças', 'CORP_OPS', 'Departamentos de negócio e suporte administrativo');

INSERT INTO teams (id, name, code, description, department_id) VALUES
(1, 'Cloud Operations N2/N3', 'CLOUD_OPS', 'Gestão de ambientes cloud e sistemas Linux', 1),
(2, 'Helpdesk & Suporte N1', 'HELPDESK_N1', 'Primeira linha de atendimento e apoio ao utilizador', 4),
(3, 'Security Operations Center (SOC)', 'SOC_TEAM', 'Monitorização de segurança e análise de ameaças', 2),
(4, 'Redes & Conectividade', 'NET_TEAM', 'Infraestruturas físicas, VPN e firewalls', 3);

-- Inserção de utilizadores padrão
INSERT INTO users (id, email, password_hash, full_name, role, department_id, team_id, phone, job_title, is_active, two_factor_enabled) VALUES
(1, 'admin@swcloudsolutions.pt', '$2a$12$K1rS2t9z7L9mP2o4Q6v8Xu0A3b5C7d9E1f3G5h7I9j1K3l5M7n9Ou', 'Administrador de Sistemas SW', 'admin', 1, 1, '+351 910 000 001', 'Lead Cloud Architect & SysAdmin', 1, 0),
(2, 'supervisor@swcloudsolutions.pt', '$2a$12$K1rS2t9z7L9mP2o4Q6v8Xu0A3b5C7d9E1f3G5h7I9j1K3l5M7n9Ou', 'Mariana Santos', 'supervisor', 4, 2, '+351 910 000 002', 'Coordenadora de Service Desk ITSM', 1, 0),
(3, 'agente.cloud@swcloudsolutions.pt', '$2a$12$K1rS2t9z7L9mP2o4Q6v8Xu0A3b5C7d9E1f3G5h7I9j1K3l5M7n9Ou', 'Tiago Ribeiro', 'agent', 4, 2, '+351 910 000 003', 'Engenheiro de Suporte Cloud N1', 1, 0),
(4, 'diogo.pires@swcloudsolutions.pt', '$2a$12$K1rS2t9z7L9mP2o4Q6v8Xu0A3b5C7d9E1f3G5h7I9j1K3l5M7n9Ou', 'Diogo Pires', 'user', 5, NULL, '+351 910 000 004', 'Gestor de Contas Cloud', 1, 0);

UPDATE departments SET manager_id = 1 WHERE id = 1;
UPDATE departments SET manager_id = 2 WHERE id = 4;
UPDATE teams SET leader_id = 1 WHERE id = 1;
UPDATE teams SET leader_id = 2 WHERE id = 2;

-- Políticas de SLA
INSERT INTO sla_policies (id, name, description, priority, first_response_minutes, resolution_minutes, business_hours_only, is_active) VALUES
(1, 'SLA Crítico P1 (24x7)', 'Paragem total de serviço crítico de cloud ou produção', 'P1_CRITICA', 15, 120, 0, 1),
(2, 'SLA Alto P2 (8x5)', 'Degradação grave sem alternativa viável em horário de expediente', 'P2_ALTA', 60, 480, 1, 1),
(3, 'SLA Médio P3 (8x5)', 'Impacto limitado num utilizador ou pedido comum', 'P3_MEDIA', 240, 1440, 1, 1),
(4, 'SLA Baixo P4 (8x5)', 'Dúvidas, pedidos de melhoria e procedimentos rotineiros', 'P4_BAIXA', 480, 2880, 1, 1);

-- Categorias
INSERT INTO categories (id, name, code, description) VALUES
(1, 'Cloud & Infraestrutura', 'CLOUD_INFRA', 'Problemas ou pedidos relativos a instâncias EC2, Azure VMs, Kubernetes e VPCs'),
(2, 'Hardware & Equipamentos', 'HARDWARE', 'Avarias ou atribuições de computadores, monitores e periféricos'),
(3, 'Acessos & Software', 'SOFTWARE_ACCESS', 'Licenciamento, contas Microsoft 365, VPN e acessos corporativos'),
(4, 'Rede & Telecomunicações', 'NETWORKING', 'Conectividade de escritório, Wi-Fi, DNS corporativo e Firewalls');

-- Subcategorias
INSERT INTO subcategories (id, category_id, name, code, default_team_id, default_sla_policy_id) VALUES
(1, 1, 'AWS / Azure VM Incidente', 'CLOUD_VM_INC', 1, 2),
(2, 1, 'Cluster Kubernetes / EKS', 'K8S_INC', 1, 1),
(3, 2, 'Computador Portátil / Laptop', 'HW_LAPTOP', 2, 3),
(4, 2, 'Periféricos e Monitores', 'HW_PERIPHERALS', 2, 4),
(5, 3, 'VPN SW Cloud Solutions', 'SW_VPN', 4, 2),
(6, 3, 'Conta Microsoft 365 / MFA', 'SW_M365', 2, 3),
(7, 4, 'Acesso Wi-Fi / Rede Escritório', 'NET_WIFI', 4, 3);

-- Catálogo de Serviços
INSERT INTO service_catalog_items (id, name, code, description, category_id, icon, requires_approval, approver_role, default_priority, form_schema_json) VALUES
(1, 'Acesso à VPN Corporativa SW Cloud', 'REQ_VPN', 'Solicitação de credenciais e configuração de certificado OpenVPN / WireGuard.', 3, 'shield', 0, 'supervisor', 'P3_MEDIA', '{"fields":[{"name":"environment","label":"Ambiente Requerido","type":"select","options":["Produção","Staging","Desenvolvimento"],"required":true},{"name":"justification","label":"Justificação Técnica","type":"text","required":true}]}'),
(2, 'Provisionamento de Nova VM Cloud', 'REQ_VM', 'Criação de nova máquina virtual em ambiente AWS ou Azure.', 1, 'server', 1, 'supervisor', 'P2_ALTA', '{"fields":[{"name":"cloud_provider","label":"Fornecedor Cloud","type":"select","options":["AWS (eu-west-1)","Azure (West Europe)"],"required":true},{"name":"os","label":"Sistema Operativo","type":"select","options":["Ubuntu 24.04 LTS","Debian 12","Windows Server 2025"],"required":true},{"name":"specs","label":"Dimensão da Instância","type":"select","options":["2 vCPU / 4GB RAM","4 vCPU / 16GB RAM","8 vCPU / 32GB RAM"],"required":true},{"name":"cost_center","label":"Centro de Custos","type":"text","required":true}]}'),
(3, 'Atribuição de Novo Computador Portátil', 'REQ_LAPTOP', 'Pedido de equipamento para novo colaborador ou substituição.', 2, 'laptop', 1, 'supervisor', 'P3_MEDIA', '{"fields":[{"name":"laptop_tier","label":"Gama de Equipamento","type":"select","options":["Engenharia (MacBook Pro M3 Max)","Desenvolvimento (ThinkPad T14 AMD)","Administrativo (Dell Latitude)"],"required":true},{"name":"delivery_date","label":"Data Necessária","type":"date","required":true}]}'),
(4, 'Licença de Software Adicional', 'REQ_LICENSE', 'Solicitação de licença dedicada para ferramentas técnicas.', 3, 'key', 1, 'supervisor', 'P3_MEDIA', '{"fields":[{"name":"software","label":"Software","type":"select","options":["JetBrains All Products Pack","Microsoft 365 Copilot","Postman Enterprise","Docker Pro"],"required":true}]}');

-- Equipamentos no CMDB
INSERT INTO assets (id, asset_tag, serial_number, name, asset_type, brand, model, status, current_user_id, department_id, purchase_date, warranty_end_date, ip_address, mac_address, operating_system, specs_json, notes) VALUES
(1, 'SW-NB-001', 'PF-2K90A1', 'MacBook Pro 16 M3 Max', 'LAPTOP', 'Apple', 'MacBook Pro 16 (2024)', 'ATRIBUIDO', 1, 1, '2024-02-15', '2027-02-15', '10.50.10.42', 'A4:83:E7:2B:9C:11', 'macOS Sequoia 15.2', '{"cpu":"Apple M3 Max 14-core","ram":"64GB Unified","storage":"1TB NVMe"}', 'Equipamento do Administrador de Sistemas'),
(2, 'SW-NB-002', 'PF-3X88B4', 'ThinkPad T14s Gen 4', 'LAPTOP', 'Lenovo', 'ThinkPad T14s AMD', 'ATRIBUIDO', 4, 5, '2024-04-10', '2027-04-10', '10.50.10.88', '3C:06:30:4A:12:FE', 'Ubuntu Linux 24.04 LTS', '{"cpu":"AMD Ryzen 7 PRO 7840U","ram":"32GB LPDDR5","storage":"512GB NVMe"}', 'Equipamento atribuído a Diogo Pires'),
(3, 'SW-NB-003', 'PF-4M12C9', 'Dell Latitude 5540', 'LAPTOP', 'Dell', 'Latitude 5540 Core i7', 'EM_STOCK', NULL, 4, '2024-05-20', '2027-05-20', NULL, 'E8:2A:44:91:02:88', 'Windows 11 Pro', '{"cpu":"Intel Core i7-1365U","ram":"16GB DDR5","storage":"512GB NVMe"}', 'Laptop em reserva técnica para novas admissões'),
(4, 'SW-SRV-001', 'SRV-DL-R650-01', 'Servidor de Virtualização Proxmox 01', 'SERVER', 'Dell', 'PowerEdge R650xs', 'ATRIBUIDO', 1, 1, '2023-11-01', '2028-11-01', '10.50.0.10', '00:1E:67:8B:20:9A', 'Proxmox VE 8.2 (Debian 12)', '{"cpu":"2x Intel Xeon Silver 4314","ram":"256GB ECC","storage":"8x 1.92TB SSD RAID10"}', 'Servidor físico de laboratório interno');

INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details) VALUES
(1, 'CRIADO', 1, NULL, NULL, 'Registo inicial do equipamento no inventário CMDB.'),
(1, 'ATRIBUIDO', 1, NULL, 1, 'Entrega formal do equipamento ao Administrador de Sistemas.'),
(2, 'CRIADO', 2, NULL, NULL, 'Registo do ThinkPad T14s após aquisição.'),
(2, 'ATRIBUIDO', 2, NULL, 4, 'Entrega do equipamento ao colaborador Diogo Pires com termo de responsabilidade assinado.'),
(3, 'CRIADO', 2, NULL, NULL, 'Registo do portátil de reserva técnica.');

-- Licenças
INSERT INTO licenses (id, software_name, vendor, license_key, license_type, total_seats, allocated_seats, expiration_date, cost_per_seat, purchase_order) VALUES
(1, 'Microsoft 365 E5 Cloud Suite', 'Microsoft', 'M365-SW-CLOUD-E5-ENTERPRISE-2026', 'SUBSCRIPTION', 50, 4, '2027-01-01', 38.50, 'PO-2024-M365'),
(2, 'JetBrains All Products Pack', 'JetBrains', 'JB-ALL-SWCLOUD-5X-2026', 'SUBSCRIPTION', 10, 2, '2026-12-31', 29.00, 'PO-2024-JB01'),
(3, 'Fortinet FortiClient VPN Enterprise', 'Fortinet', 'FC-ENT-SW-100U', 'ENTERPRISE', 100, 15, '2028-06-30', 12.00, 'PO-2024-FTNT');

-- Artigos da Knowledge Base
INSERT INTO kb_articles (id, title, slug, summary, content, category_id, author_id, is_internal_only, is_published, tags) VALUES
(1, 'Como configurar o acesso à VPN da SW Cloud Solutions', 'como-configurar-vpn-sw-cloud', 'Guia passo-a-passo para instalar o cliente OpenVPN e ligar à rede segura da empresa.', 
'# Guia de Configuração da VPN da SW Cloud Solutions

Para aceder em segurança aos ambientes de cloud e servidores da empresa, siga os passos abaixo:

### 1. Descarregar o Cliente
Descarregue o cliente oficial OpenVPN Connect compatível com o seu sistema operativo (Windows, macOS ou Linux).

### 2. Importar o Ficheiro de Perfil
1. Aceda ao portal de autoatendimento do SW Service Desk.
2. Descarregue o ficheiro de configuração pessoal `.ovpn`.
3. Abra a aplicação OpenVPN Connect e selecione **File -> Import Profile**.

### 3. Autenticação e 2FA
Introduza o seu email corporativo (`nome.sobrenome@swcloudsolutions.pt`) e palavra-passe de rede. Em seguida, digite o código de 6 dígitos gerado pela sua aplicação de autenticação (Microsoft Authenticator / Google Authenticator).

Em caso de falha de conexão, verifique se a porta UDP 1194 não se encontra bloqueada pela sua rede doméstica.', 3, 1, 0, 1, 'vpn,redes,segurança,acesso'),

(2, 'Runbook: Procedimento de Resposta a Incidentes P1 em Kubernetes', 'runbook-incidentes-p1-kubernetes', 'Procedimento operacional de emergência para equipas N2 e N3 perante incidentes de alta severidade.', 
'# Runbook Técnico: Interrupção Crítica em EKS/K8s (P1)

**Atenção:** Este runbook é estritamente confidencial e de acesso exclusivo à equipa de Engenharia de Cloud.

### 1. Diagnóstico Inicial Imediato
Executar no bastion seguro:
```bash
kubectl get nodes -o wide
kubectl get pods -A --field-selector status.phase!=Running
kubectl top nodes
```

### 2. Verificação de Eventos de Custer
```bash
kubectl get events -A --sort-by=.metadata.creationTimestamp | tail -n 50
```

### 3. Comunicação ao Supervisor
Qualquer incidente P1 com tempo de resolução superior a 30 minutos exige notificação imediata via webhook de emergência ao canal de incidentes graves no Microsoft Teams.', 1, 1, 1, 1, 'runbook,k8s,cloud,p1,incidente');

-- Tickets de Demonstração Inicial
INSERT INTO tickets (id, ticket_number, title, description, ticket_type, status, impact, urgency, priority, requester_id, assigned_agent_id, assigned_team_id, department_id, category_id, subcategory_id, asset_id, sla_policy_id, first_response_due_at, first_responded_at, resolution_due_at, sla_status) VALUES
(1, 'TCK-2026-00001', 'Lentidão no acesso ao repositório central de código', 'Verifico latências anormais superiores a 2500ms ao efetuar git pull e clone via rede interna.', 'INCIDENTE', 'ATRIBUIDO', 'MEDIO', 'ALTA', 'P3_MEDIA', 4, 3, 2, 4, 3, 5, 2, 3, DATE_ADD(NOW(), INTERVAL 4 HOUR), NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 'DENTRO_PRAZO'),
(2, 'TCK-2026-00002', 'Falha crítica de comunicação na VPN de produção AWS eu-west-1', 'O túnel IPsec entre o escritório de Lisboa e a VPC de produção AWS encontra-se inoperacional.', 'INCIDENTE', 'EM_PROGRESSO', 'CRITICO', 'CRITICA', 'P1_CRITICA', 1, 1, 1, 1, 1, 1, 4, 1, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'DENTRO_PRAZO');

INSERT INTO ticket_comments (ticket_id, author_id, comment_type, body) VALUES
(1, 4, 'PUBLIC', 'Abri o ticket após validar com mais dois colegas que o problema persiste.'),
(1, 3, 'PUBLIC', 'Olá Diogo, recebemos o teu pedido. Estamos a analisar as métricas de tráfego do gateway.'),
(1, 3, 'INTERNAL_NOTE', 'Nota interna: Tráfego saturado na interface eth1 da firewall FortiGate. Vamos ajustar o QoS.'),
(2, 1, 'PUBLIC', 'Túnel IPsec reiniciado via console AWS. A aguardar renegociação IKE Phase 2.');

INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description) VALUES
(1, 4, 'CRIADO', NULL, 'NOVO', 'Ticket aberto pelo solicitante Diogo Pires.'),
(1, 2, 'ATRIBUIDO', NULL, 'Tiago Ribeiro', 'Ticket atribuído ao técnico Tiago Ribeiro.'),
(1, 3, 'COMENTARIO_PUBLICO', NULL, NULL, 'Primeira resposta pública enviada ao solicitante.');

-- Configurações de Sistema
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
('company_name', 'SW Cloud Solutions', 'general', 'Nome da empresa proprietária do Service Desk'),
('support_email', 'suporte@swcloudsolutions.pt', 'general', 'Email oficial de suporte técnico'),
('app_url', 'https://servicedesk.swcloudsolutions.pt', 'general', 'URL base do sistema em produção'),
('sla_escalation_threshold_pct', '75', 'sla', 'Percentagem de tempo decorrido para disparo de alertas de SLA'),
('m365_integration_enabled', '1', 'integrations', 'Ativação de integração Microsoft 365 e Teams Webhook'),
('ai_assistant_enabled', '1', 'ai', 'Ativação do assistente de IA Gemini para técnicos'),
('ai_require_human_confirmation', '1', 'ai', 'Obrigatoriedade de confirmação humana para ações sugeridas pela IA');
