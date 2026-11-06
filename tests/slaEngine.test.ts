import test from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessMinutes, calculateSlaDueDates, evaluateSlaStatus } from '../server/services/slaEngine.js';

test('addBusinessMinutes: Adição dentro do mesmo dia útil', () => {
  // Segunda-feira às 10:00 + 120 minutos -> 12:00
  const start = new Date('2026-11-09T10:00:00Z'); // 2026-11-09 é Segunda-feira
  const due = addBusinessMinutes(start, 120);
  assert.equal(due.getHours(), 12);
  assert.equal(due.getMinutes(), 0);
  assert.equal(due.getDate(), 9);
});

test('addBusinessMinutes: Transbordo para o dia seguinte', () => {
  // Segunda-feira às 17:00 + 120 minutos -> Terça-feira às 10:00 (1h resta hoje até às 18h, 1h amanhã a partir das 09h)
  const start = new Date('2026-11-09T17:00:00Z');
  const due = addBusinessMinutes(start, 120);
  assert.equal(due.getDate(), 10);
  assert.equal(due.getHours(), 10);
  assert.equal(due.getMinutes(), 0);
});

test('addBusinessMinutes: Transbordo de Sexta-feira para Segunda-feira (salto de fim de semana)', () => {
  // Sexta-feira às 17:30 + 60 minutos -> Segunda-feira às 09:30
  // 2026-11-13 é Sexta-feira
  const start = new Date('2026-11-13T17:30:00Z');
  const due = addBusinessMinutes(start, 60);
  assert.equal(due.getDate(), 16); // Segunda-feira dia 16
  assert.equal(due.getHours(), 9);
  assert.equal(due.getMinutes(), 30);
});

test('calculateSlaDueDates: 24x7 contínuo para P1 Crítica', () => {
  const start = new Date('2026-11-06T10:00:00Z');
  const { firstResponseDueAt, resolutionDueAt } = calculateSlaDueDates(
    { first_response_minutes: 15, resolution_minutes: 120, business_hours_only: false },
    start
  );
  assert.equal(firstResponseDueAt.getTime() - start.getTime(), 15 * 60 * 1000);
  assert.equal(resolutionDueAt.getTime() - start.getTime(), 120 * 60 * 1000);
});

test('evaluateSlaStatus: Dentro do prazo, Em risco e Violado', () => {
  const created = new Date('2026-11-06T09:00:00Z');
  const due = new Date('2026-11-06T13:00:00Z'); // 4 horas de janela

  // Passou 1 hora (25%) -> DENTRO_PRAZO
  const time1 = new Date('2026-11-06T10:00:00Z');
  assert.equal(evaluateSlaStatus(due, null, created, time1), 'DENTRO_PRAZO');

  // Passou 3.5 horas (87.5%) -> EM_RISCO
  const time2 = new Date('2026-11-06T12:30:00Z');
  assert.equal(evaluateSlaStatus(due, null, created, time2), 'EM_RISCO');

  // Passou 4.5 horas -> VIOLADO
  const time3 = new Date('2026-11-06T13:30:00Z');
  assert.equal(evaluateSlaStatus(due, null, created, time3), 'VIOLADO');

  // Resolvido às 12:00 (antes das 13:00) -> CUMPRIDO
  const resolvedOnTime = new Date('2026-11-06T12:00:00Z');
  assert.equal(evaluateSlaStatus(due, resolvedOnTime, created, time3), 'CUMPRIDO');

  // Resolvido às 14:00 (depois das 13:00) -> VIOLADO
  const resolvedLate = new Date('2026-11-06T14:00:00Z');
  assert.equal(evaluateSlaStatus(due, resolvedLate, created, time3), 'VIOLADO');
});
