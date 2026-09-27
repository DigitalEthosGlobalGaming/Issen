import test from 'node:test';
import assert from 'node:assert/strict';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';

test('equipment combines multiplicative, additive, min and max modifiers', () => {
  const first = { atk: 0.8, score: 1.5, pz: -0.02, comboStep: 4, bossDmg: 2 };
  const second = { atk: 1.25, score: 2, pz: -0.03, comboStep: 3, bossDmg: 3 };
  const result = computeModifiers([first, undefined, second], new Set());
  assert.equal(result.atk, 1);
  assert.equal(result.score, 3);
  assert.equal(result.pz, -0.05);
  assert.equal(result.comboStep, 3);
  assert.equal(result.bossDmg, 3);
  assert.equal(first.score, 1.5);
  assert.equal(second.score, 2);
});

test('blessings compose with equipment and each run has fresh modifiers', () => {
  const result = computeModifiers([{ score: 2 }], new Set(['fortune', 'eye', 'silence']));
  assert.equal(result.score, 4.25);
  assert.equal(result.pz, -0.06);
  assert.equal(result.noRing, 1);
  assert.equal(result.noArc, 1);
  result.atk = 999;
  assert.equal(computeModifiers([], new Set()).atk, 1);
});
