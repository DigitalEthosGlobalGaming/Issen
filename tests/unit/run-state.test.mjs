import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState, resetRun } from '../../src/game/run-state.ts';
import { DEFAULT_EQUIPMENT } from '../../src/platform/saves.ts';

test('run state owns independent collections and validates saved hints', () => {
  const first = createRunState({ swipe: 1, bogus: 'yes' });
  const second = createRunState(null);
  first.bless.add('echo');
  first.m.atk = 2;
  first.hints.extra = 1;
  assert.equal(second.bless.size, 0);
  assert.equal(second.m.atk, 1);
  assert.deepEqual(second.hints, {});
  assert.deepEqual(first.hints, { swipe: 1, extra: 1 });
  assert.notEqual(first.enemies, second.enemies);
  assert.notEqual(first.pendingSpawns, second.pendingSpawns);
});

test('reset clears run progress and preserves scene and hint ownership', () => {
  const run = createRunState({ swipe: 1 });
  run.stage = 5;
  run.score = 1000;
  run.bless.add('echo');
  run.darumaUsed = true;
  run.scars = 3;
  const hints = run.hints;
  const oldBlessings = run.bless;
  resetRun(
    run,
    { diff: 'ronin', mode: 'rush', arrows: false, lives: 'zen' },
    { ...DEFAULT_EQUIPMENT, charm: 'omikuji' },
    () => 0,
  );
  assert.equal(run.mode, 'ronin');
  assert.equal(run.rush, true);
  assert.equal(run.blade, true);
  assert.equal(run.zen, true);
  assert.equal(run.hard, false);
  assert.equal(run.lives, 0);
  assert.equal(run.score, 0);
  assert.equal(run.scars, 0);
  assert.equal(run.darumaUsed, false);
  assert.equal(run.fortune.n, 'Great blessing');
  assert.equal(run.stage, 5);
  assert.equal(run.hints, hints);
  assert.notEqual(run.bless, oldBlessings);
  assert.equal(run.bless.size, 0);
  resetRun(run, { diff: 'normal', mode: 'waves', arrows: true, lives: '3' }, DEFAULT_EQUIPMENT);
  assert.equal(run.lives, 3);
  assert.equal(run.fortune, null);
  assert.equal(run.rush, false);
  assert.equal(run.zen, false);
});
