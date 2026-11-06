import test from 'node:test';
import assert from 'node:assert/strict';
import { initDatabase, query, queryOne, execute, transaction } from '../server/db/index.js';
import { runMigrations } from '../server/db/migrations.js';
import { runSeeds } from '../server/db/seed.js';

test('Fluxo Completo de Equipamento (CMDB): Criar -> Atribuir -> Associar Ticket -> Alterar Utilizador -> Consultar Histórico -> Abater', async () => {
  // Inicializar base de dados em memória/local para os testes
  await initDatabase();
  await runMigrations();
  await runSeeds();

  const testAssetTag = `TEST-NB-${Date.now()}`;
  const testSerial = `SN-${Date.now()}`;

  // 1. Criar Equipamento (Entrada em Stock)
  const createRes = await execute(
    `INSERT INTO assets (asset_tag, serial_number, name, asset_type, brand, model, status)
     VALUES (?, ?, 'ThinkPad T14 Teste', 'LAPTOP', 'Lenovo', 'T14 Gen 4', 'EM_STOCK')`,
    [testAssetTag, testSerial]
  );
  const assetId = createRes.insertId!;
  assert.ok(assetId > 0, 'O equipamento deve ter sido inserido com ID válido');

  await execute(
    `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, details)
     VALUES (?, 'CRIADO', 1, 'Equipamento criado em stock para testes')`,
    [assetId]
  );

  let asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
  assert.equal(asset.status, 'EM_STOCK');
  assert.equal(asset.current_user_id, null);

  // 2. Atribuir Equipamento a Utilizador (Diogo Pires, ID: 4)
  await execute(
    `UPDATE assets SET current_user_id = 4, status = 'ATRIBUIDO' WHERE id = ?`,
    [assetId]
  );
  await execute(
    `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
     VALUES (?, 'ATRIBUIDO', 1, NULL, 4, 'Atribuído a Diogo Pires')`,
    [assetId]
  );

  asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
  assert.equal(asset.status, 'ATRIBUIDO');
  assert.equal(asset.current_user_id, 4);

  // 3. Associar Equipamento a Ticket de Incidente
  const assetTicketNum = `TCK-AST-${Date.now()}`;
  const ticketRes = await execute(
    `INSERT INTO tickets (ticket_number, title, description, requester_id, asset_id, status, priority)
     VALUES (?, 'Avaria no ecrã do ThinkPad', 'Ecrã pisca intermitentemente', 4, ?, 'NOVO', 'P2_ALTA')`,
    [assetTicketNum, assetId]
  );
  const ticketId = ticketRes.insertId!;
  assert.ok(ticketId > 0);

  const linkedTicket = await queryOne('SELECT asset_id FROM tickets WHERE id = ?', [ticketId]);
  assert.equal(linkedTicket.asset_id, assetId, 'O ticket deve estar associado ao equipamento');

  // 4. Alterar Utilizador (Transferência de Diogo Pires ID 4 -> Tiago Ribeiro ID 3)
  await execute(
    `UPDATE assets SET current_user_id = 3, status = 'ATRIBUIDO' WHERE id = ?`,
    [assetId]
  );
  await execute(
    `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, new_user_id, details)
     VALUES (?, 'TRANSFERIDO', 1, 4, 3, 'Transferido para Tiago Ribeiro')`,
    [assetId]
  );

  asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
  assert.equal(asset.current_user_id, 3, 'O novo detentor deve ser Tiago Ribeiro');

  // 5. Consultar Histórico Completo
  const history = await query('SELECT * FROM asset_history WHERE asset_id = ? ORDER BY id ASC', [assetId]);
  assert.equal(history.length, 3, 'Devem existir 3 registos no histórico (CRIADO, ATRIBUIDO, TRANSFERIDO)');
  assert.equal(history[0].action_type, 'CRIADO');
  assert.equal(history[1].action_type, 'ATRIBUIDO');
  assert.equal(history[2].action_type, 'TRANSFERIDO');
  assert.equal(history[2].previous_user_id, 4);
  assert.equal(history[2].new_user_id, 3);

  // 6. Retirar Equipamento de Serviço (Abate)
  await execute(
    `UPDATE assets SET current_user_id = NULL, status = 'ABATIDO' WHERE id = ?`,
    [assetId]
  );
  await execute(
    `INSERT INTO asset_history (asset_id, action_type, performed_by_user_id, previous_user_id, details)
     VALUES (?, 'ABATIDO', 1, 3, 'Equipamento abatido por avaria irreparável na motherboard')`,
    [assetId]
  );

  asset = await queryOne('SELECT * FROM assets WHERE id = ?', [assetId]);
  assert.equal(asset.status, 'ABATIDO');
  assert.equal(asset.current_user_id, null);

  const finalHistory = await query('SELECT * FROM asset_history WHERE asset_id = ? ORDER BY id ASC', [assetId]);
  assert.equal(finalHistory.length, 4, 'Devem existir 4 registos de histórico');
  assert.equal(finalHistory[3].action_type, 'ABATIDO');
});
