import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePriority } from '../server/services/slaEngine.js';

test('Matriz de Prioridade: Impacto CRITICO', () => {
  assert.equal(calculatePriority('CRITICO', 'CRITICA'), 'P1_CRITICA');
  assert.equal(calculatePriority('CRITICO', 'ALTA'), 'P1_CRITICA');
  assert.equal(calculatePriority('CRITICO', 'MEDIA'), 'P2_ALTA');
  assert.equal(calculatePriority('CRITICO', 'BAIXA'), 'P3_MEDIA');
});

test('Matriz de Prioridade: Impacto ALTO', () => {
  assert.equal(calculatePriority('ALTO', 'CRITICA'), 'P1_CRITICA');
  assert.equal(calculatePriority('ALTO', 'ALTA'), 'P2_ALTA');
  assert.equal(calculatePriority('ALTO', 'MEDIA'), 'P3_MEDIA');
  assert.equal(calculatePriority('ALTO', 'BAIXA'), 'P4_BAIXA');
});

test('Matriz de Prioridade: Impacto MEDIO', () => {
  assert.equal(calculatePriority('MEDIO', 'CRITICA'), 'P2_ALTA');
  assert.equal(calculatePriority('MEDIO', 'ALTA'), 'P3_MEDIA');
  assert.equal(calculatePriority('MEDIO', 'MEDIA'), 'P3_MEDIA');
  assert.equal(calculatePriority('MEDIO', 'BAIXA'), 'P4_BAIXA');
});

test('Matriz de Prioridade: Impacto BAIXO', () => {
  assert.equal(calculatePriority('BAIXO', 'CRITICA'), 'P3_MEDIA');
  assert.equal(calculatePriority('BAIXO', 'ALTA'), 'P3_MEDIA');
  assert.equal(calculatePriority('BAIXO', 'MEDIA'), 'P4_BAIXA');
  assert.equal(calculatePriority('BAIXO', 'BAIXA'), 'P4_BAIXA');
});
