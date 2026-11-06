import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { initDatabase } from '../server/db/index.js';
import { runMigrations } from '../server/db/migrations.js';
import { runSeeds } from '../server/db/seed.js';
import { backupService } from '../server/services/backupService.js';

test('Módulo de Backup: Dump MySQL/MariaDB, Armazenamento em BACKUP_DIR, Proteção de Permissões, Checksum SHA-256 e Rotação', async (t) => {
  // 1. Inicializar base de dados
  await initDatabase();
  await runMigrations();
  await runSeeds();

  // Criar diretório temporário isolado para testes
  const testBackupDir = path.resolve(process.cwd(), 'backups-test-' + Date.now());
  process.env.BACKUP_DIR = testBackupDir;

  t.after(() => {
    // Limpeza após o teste
    if (fs.existsSync(testBackupDir)) {
      fs.rmSync(testBackupDir, { recursive: true, force: true });
    }
    delete process.env.BACKUP_DIR;
  });

  await t.test('1. Deve criar a pasta BACKUP_DIR com permissões restritas', () => {
    const dir = backupService.getSecureBackupDir();
    assert.equal(dir, testBackupDir);
    assert.ok(fs.existsSync(dir), 'A pasta de backup deve existir');
    
    // Verificar permissões no sistema POSIX
    const stat = fs.statSync(dir);
    if (process.platform !== 'win32') {
      const mode = stat.mode & 0o777;
      assert.equal(mode, 0o700, 'A pasta deve ter permissões 0700 (drwx------)');
    }
  });

  let backupResult: any;

  await t.test('2. Deve executar dump para ficheiro .sql com sintaxe MySQL/MariaDB', async () => {
    backupResult = await backupService.executeMysqlDump(testBackupDir);

    assert.ok(backupResult.filename.startsWith('sw_servicedesk_backup_'));
    assert.ok(backupResult.filename.endsWith('.sql'));
    assert.ok(fs.existsSync(backupResult.filepath), 'O ficheiro .sql deve ter sido criado no disco');
    assert.ok(backupResult.sizeBytes > 0, 'O dump não pode ser vazio');
    assert.ok(backupResult.recordsCount > 0, 'Deve ter registado registos das tabelas');

    // Inspecionar conteúdo do ficheiro SQL
    const content = fs.readFileSync(backupResult.filepath, 'utf8');
    assert.ok(content.includes('SET FOREIGN_KEY_CHECKS=0;'), 'Deve desativar chaves estrangeiras temporariamente');
    assert.ok(content.includes('SET FOREIGN_KEY_CHECKS=1;'), 'Deve reativar chaves estrangeiras');
    assert.ok(content.includes('INSERT INTO `users`'), 'Deve conter dados da tabela users');
    assert.ok(content.includes('INSERT INTO `tickets`'), 'Deve conter dados da tabela tickets');
  });

  await t.test('3. Ficheiro deve estar protegido com permissões restritas (0600) e ter checksum SHA-256', () => {
    assert.ok(fs.existsSync(backupResult.checksumFile), 'O ficheiro .sha256 deve ter sido criado');
    
    if (process.platform !== 'win32') {
      const stat = fs.statSync(backupResult.filepath);
      const mode = stat.mode & 0o777;
      assert.equal(mode, 0o600, 'O ficheiro .sql deve ter permissões 0600 (-rw-------)');
    }

    // Validar integridade
    const integrity = backupService.verifyBackupIntegrity(backupResult.filename);
    assert.equal(integrity.isValid, true, 'O checksum SHA-256 deve ser válido e corresponder ao ficheiro');
    assert.equal(integrity.calculatedHash, backupResult.checksum);
  });

  await t.test('4. Deve detetar adulteração de integridade se o ficheiro for corrompido', () => {
    // Criar um ficheiro falso adulterado
    const tamperedFile = path.join(testBackupDir, 'tampered_backup.sql');
    fs.writeFileSync(tamperedFile, '-- Fake content');
    fs.writeFileSync(`${tamperedFile}.sha256`, '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef  tampered_backup.sql\n');

    const integrity = backupService.verifyBackupIntegrity('tampered_backup.sql');
    assert.equal(integrity.isValid, false, 'Deve detetar que o hash calculado não bate com o esperado');
  });

  await t.test('5. Rotação de Backups: deve expurgar ficheiros que excedam o limite máximo', async () => {
    // Criar 5 ficheiros simulados
    for (let i = 1; i <= 5; i++) {
      const mockName = `sw_servicedesk_backup_mock_${i}.sql`;
      const mockPath = path.join(testBackupDir, mockName);
      fs.writeFileSync(mockPath, `-- Mock ${i}`, { mode: 0o600 });
      fs.writeFileSync(`${mockPath}.sha256`, `fakehash${i}  ${mockName}\n`);
    }

    // Executar rotação mantendo apenas no máximo 3 ficheiros
    const rotation = await backupService.rotateBackups(testBackupDir, 30, 3);
    
    assert.ok(rotation.purgedFiles.length >= 3, 'Deve ter purgado ficheiros que excedem o limite de 3');
    assert.equal(rotation.retainedCount, 3, 'Devem restar exatamente 3 ficheiros');
  });

  await t.test('6. Listagem de backups deve reportar tamanho e integridade', () => {
    const list = backupService.listBackups();
    assert.ok(list.length > 0);
    assert.ok(list[0].filename);
    assert.ok(list[0].sizeBytes > 0);
    assert.ok(list[0].createdAt);
  });
});
