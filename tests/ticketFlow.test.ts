import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, query, queryOne, execute } from '../server/db/index.js';
import { runMigrations } from '../server/db/migrations.js';
import { runSeeds } from '../server/db/seed.js';
import { calculatePriority, calculateSlaDueDates, evaluateSlaStatus } from '../server/services/slaEngine.js';

test('Fluxo Completo de Ticket: Criar -> Atribuir -> Responder -> Alterar Prioridade -> SLA -> Resolver -> Fechar -> Consultar Histórico', async () => {
  // 0. Preparar ambiente e base de dados
  await initDatabase();
  await runMigrations();
  await runSeeds();

  const requesterId = 4; // Diogo Pires (Colaborador)
  const agentId = 3; // Tiago Ribeiro (Técnico de Suporte)

  // 1. Criar Ticket com Cálculo Automático de Prioridade (Impacto Alto + Urgência Alta -> P2_ALTA)
  const impact = 'ALTO';
  const urgency = 'ALTA';
  const priority = calculatePriority(impact, urgency);
  assert.equal(priority, 'P2_ALTA', 'Impacto ALTO + Urgência ALTA deve resultar em P2_ALTA');

  // Obter política de SLA para P2_ALTA
  const slaPolicy = await queryOne('SELECT * FROM sla_policies WHERE priority = ?', [priority]);
  assert.ok(slaPolicy, 'Deve existir política de SLA para P2_ALTA');

  const creationTime = new Date('2026-11-06T10:00:00Z');
  const { firstResponseDueAt, resolutionDueAt } = calculateSlaDueDates(
    {
      first_response_minutes: slaPolicy.first_response_minutes,
      resolution_minutes: slaPolicy.resolution_minutes,
      business_hours_only: Boolean(slaPolicy.business_hours_only),
    },
    creationTime
  );

  const ticketNumber = `TCK-TEST-${Date.now()}`;
  const insertTicketRes = await execute(
    `INSERT INTO tickets (
      ticket_number, title, description, ticket_type, requester_id,
      category_id, impact, urgency, priority, status,
      first_response_due_at, resolution_due_at, created_at
    ) VALUES (?, ?, ?, 'INCIDENTE', ?, 1, ?, ?, ?, 'NOVO', ?, ?, ?)`,
    [
      ticketNumber,
      'Falha de Conectividade VPN no Porto',
      'Colaboradores remotos não conseguem aceder à subnet interna.',
      requesterId,
      impact,
      urgency,
      priority,
      firstResponseDueAt.toISOString(),
      resolutionDueAt.toISOString(),
      creationTime.toISOString()
    ]
  );
  const ticketId = insertTicketRes.insertId!;
  assert.ok(ticketId > 0, 'O ticket deve ser criado com ID válido');

  // Registar histórico de criação
  await execute(
    `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
     VALUES (?, ?, 'CRIACAO', NULL, 'NOVO', 'Ticket criado com prioridade P2_ALTA')`,
    [ticketId, requesterId]
  );

  let ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  assert.equal(ticket.status, 'NOVO');
  assert.equal(ticket.assigned_agent_id, null);
  assert.equal(ticket.priority, 'P2_ALTA');

  // 2. Atribuir Ticket ao Técnico Tiago Ribeiro (ID: 3)
  await execute(
    `UPDATE tickets SET assigned_agent_id = ?, status = 'EM_ATENDIMENTO' WHERE id = ?`,
    [agentId, ticketId]
  );
  await execute(
    `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
     VALUES (?, 1, 'ATRIBUICAO', 'Nenhum', 'Tiago Ribeiro', 'Ticket atribuído a técnico')`,
    [ticketId]
  );

  ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  assert.equal(ticket.assigned_agent_id, agentId);
  assert.equal(ticket.status, 'EM_ATENDIMENTO');

  // 3. Responder ao Ticket (Comentário público aciona primeira resposta)
  const responseTime = new Date('2026-11-06T10:15:00Z');
  await execute(
    `INSERT INTO ticket_comments (ticket_id, author_id, comment_type, body, created_at)
     VALUES (?, ?, 'PUBLIC', 'Olá Diogo, estamos a investigar o gateway da VPN em conjunto com a equipa de redes.', ?)`,
    [ticketId, agentId, responseTime.toISOString()]
  );
  await execute(
    `UPDATE tickets SET first_responded_at = ? WHERE id = ? AND first_responded_at IS NULL`,
    [responseTime.toISOString(), ticketId]
  );
  await execute(
    `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
     VALUES (?, ?, 'PRIMEIRA_RESPOSTA', NULL, '2026-11-06T10:15:00Z', 'Primeira resposta pública enviada dentro do prazo')`,
    [ticketId, agentId]
  );

  ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  assert.ok(ticket.first_responded_at, 'O campo first_responded_at deve estar preenchido');

  // 4. Alterar Prioridade para Crítica (Impacto CRITICO + Urgência CRITICA -> P1_CRITICA)
  const newPriority = calculatePriority('CRITICO', 'CRITICA');
  assert.equal(newPriority, 'P1_CRITICA');

  const p1SlaPolicy = await queryOne('SELECT * FROM sla_policies WHERE priority = ?', [newPriority]);
  const newSlaDates = calculateSlaDueDates(
    {
      first_response_minutes: p1SlaPolicy.first_response_minutes,
      resolution_minutes: p1SlaPolicy.resolution_minutes,
      business_hours_only: Boolean(p1SlaPolicy.business_hours_only),
    },
    new Date(ticket.created_at)
  );

  await execute(
    `UPDATE tickets SET impact = 'CRITICO', urgency = 'CRITICA', priority = ?, resolution_due_at = ? WHERE id = ?`,
    [newPriority, newSlaDates.resolutionDueAt.toISOString(), ticketId]
  );
  await execute(
    `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
     VALUES (?, ?, 'ALTERACAO_PRIORIDADE', 'P2_ALTA', 'P1_CRITICA', 'Escalado por afetação global')`,
    [ticketId, agentId]
  );

  ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  assert.equal(ticket.priority, 'P1_CRITICA');
  assert.equal(ticket.impact, 'CRITICO');

  // 5. Verificar SLA
  const currentSlaStatus = evaluateSlaStatus(
    ticket.resolution_due_at,
    null,
    ticket.created_at,
    new Date('2026-11-06T10:30:00Z')
  );
  assert.equal(currentSlaStatus, 'DENTRO_PRAZO');

  // 6. Resolver Ticket
  const resolvedTime = new Date('2026-11-06T11:00:00Z');
  const finalSla = evaluateSlaStatus(ticket.resolution_due_at, resolvedTime, ticket.created_at, resolvedTime);
  assert.equal(finalSla, 'CUMPRIDO', 'Resolução antes do prazo deve marcar SLA como CUMPRIDO');

  await execute(
    `UPDATE tickets SET status = 'RESOLVIDO', resolution_summary = 'Reiniciado tunnel IPsec e recarregada rota OSPF.', resolved_at = ?, sla_status = ? WHERE id = ?`,
    [resolvedTime.toISOString(), finalSla, ticketId]
  );
  await execute(
    `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
     VALUES (?, ?, 'RESOLVIDO', 'EM_ATENDIMENTO', 'RESOLVIDO', 'RESOLVIDO - SLA Cumprido com sucesso')`,
    [ticketId, agentId]
  );

  ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  assert.equal(ticket.status, 'RESOLVIDO');
  assert.ok(ticket.resolved_at);

  // 7. Fechar Ticket
  const closedTime = new Date('2026-11-06T12:00:00Z');
  await execute(
    `UPDATE tickets SET status = 'FECHADO', closed_at = ? WHERE id = ?`,
    [closedTime.toISOString(), ticketId]
  );
  await execute(
    `INSERT INTO ticket_history (ticket_id, actor_id, event_type, old_value, new_value, description)
     VALUES (?, ?, 'FECHADO', 'RESOLVIDO', 'FECHADO', 'FECHADO após validação com o utilizador requerente')`,
    [ticketId, requesterId]
  );

  ticket = await queryOne('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  assert.equal(ticket.status, 'FECHADO');
  assert.ok(ticket.closed_at);

  // 8. Consultar Histórico Completo do Ticket
  const history = await query(
    'SELECT * FROM ticket_history WHERE ticket_id = ? ORDER BY id ASC',
    [ticketId]
  );
  assert.equal(history.length, 6, 'Devem existir 6 registos no histórico de auditoria do ticket');
  assert.equal(history[0].event_type, 'CRIACAO');
  assert.equal(history[1].event_type, 'ATRIBUICAO');
  assert.equal(history[2].event_type, 'PRIMEIRA_RESPOSTA');
  assert.equal(history[3].event_type, 'ALTERACAO_PRIORIDADE');
  assert.equal(history[4].event_type, 'RESOLVIDO');
  assert.equal(history[5].event_type, 'FECHADO');
});
