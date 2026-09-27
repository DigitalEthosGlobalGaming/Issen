import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDamage } from '../../src/game/combat/damage.ts';
const make = () => ({
  zen: false,
  hard: false,
  bless: new Set(),
  wardUsed: false,
  runWards: 0,
  lives: 3,
  m: { feintSafe: 0 },
});
test('wards precede life loss and last life becomes death', () => {
  const run = make();
  run.bless.add('ward');
  run.runWards = 1;
  assert.equal(resolveDamage(run, 'wrong').label, 'Warded');
  assert.equal(run.wardUsed, true);
  assert.equal(run.runWards, 1);
  assert.equal(run.lives, 3);
  resolveDamage(run, 'wrong');
  assert.equal(run.runWards, 0);
  assert.equal(run.lives, 3);
  assert.equal(resolveDamage(run, 'wrong').label, 'Life lost');
  assert.equal(run.lives, 2);
  assert.equal(run.scars, 1);
  assert.equal(resolveDamage(run, 'wrong').label, 'Last life');
  assert.equal(run.lives, 1);
  assert.deepEqual(resolveDamage(run, 'wrong'), { kind: 'death' });
  assert.equal(run.lives, 0);
  assert.equal(run.scars, 2);
});
test('endless ward preserves combo but does not consume run wards', () => {
  const run = make();
  run.zen = true;
  run.bless.add('ward');
  run.runWards = 2;
  assert.equal(resolveDamage(run, 'late').keepCombo, true);
  assert.equal(resolveDamage(run, 'late').keepCombo, false);
  assert.equal(run.runWards, 2);
  assert.equal(run.lives, 3);
});
test('feint protection precedes wards; no-lives mode ignores spare lives', () => {
  const run = make();
  run.m.feintSafe = 1;
  run.bless.add('ward');
  assert.equal(resolveDamage(run, 'feint').label, 'Tricked!');
  assert.equal(run.wardUsed, false);
  run.bless.clear();
  run.hard = true;
  assert.deepEqual(resolveDamage(run, 'late'), { kind: 'death' });
  assert.equal(run.lives, 3);
  run.runWards = 1;
  assert.equal(resolveDamage(run, 'late').label, 'Warded');
  assert.equal(run.runWards, 0);
});
