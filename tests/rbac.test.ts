import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRolePermission } from '../server/middleware/rbac.js';

test('RBAC: Admin tem permissão universal em todas as áreas', () => {
  assert.equal(checkRolePermission('admin', ['user']), true);
  assert.equal(checkRolePermission('admin', ['agent']), true);
  assert.equal(checkRolePermission('admin', ['supervisor']), true);
  assert.equal(checkRolePermission('admin', ['admin']), true);
});

test('RBAC: Supervisor tem acesso a ações de gestão e operacionais mas não de admin direto', () => {
  assert.equal(checkRolePermission('supervisor', ['supervisor', 'admin']), true);
  assert.equal(checkRolePermission('supervisor', ['agent']), false);
  assert.equal(checkRolePermission('supervisor', ['admin']), false);
});

test('RBAC: Agent tem acesso a suporte mas não a aprovação de supervisor nem admin', () => {
  assert.equal(checkRolePermission('agent', ['agent', 'supervisor', 'admin']), true);
  assert.equal(checkRolePermission('agent', ['supervisor', 'admin']), false);
  assert.equal(checkRolePermission('agent', ['admin']), false);
});

test('RBAC: User final só tem acesso a rotas abertas a utilizador', () => {
  assert.equal(checkRolePermission('user', ['user']), true);
  assert.equal(checkRolePermission('user', ['agent']), false);
  assert.equal(checkRolePermission('user', ['supervisor']), false);
  assert.equal(checkRolePermission('user', ['admin']), false);
});
