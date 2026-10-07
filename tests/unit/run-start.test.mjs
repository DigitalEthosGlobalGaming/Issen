import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { dailyRun } from '../../src/game/progression/daily.ts';
import { TRIALS } from '../../src/game/content/trials.ts';

const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
test('actual normal entry uses the seed port once and reproduces its gameplay stream', () => {
  const first = runStartSession(123456, setup),
    second = runStartSession(123456, setup);
  assert.equal(first.run.seed, 123456);
  assert.equal(first.run.state, 'playing');
  assert.equal(first.views.ST, first.views.playerStats);
  assert.equal(first.views.EQ, first.views.playerEquipment);
  assert.equal(first.views.ST.runs, 1);
  assert.equal(first.views.hitStop, 0);
  assert.equal(first.views.timeScale, 1);
  assert.equal(first.trace.filter((x) => x === 'seed').length, 1);
  assert.equal(first.random.next(), second.random.next());
});

test('actual daily entry keeps profile progress isolated and uses the fixed daily seed', () => {
  const session = runStartSession(1, setup, undefined, false),
    daily = dailyRun('2026-10-08');
  session.views.activeDaily = daily;
  session.views.ST = structuredClone(session.views.playerStats);
  session.views.EQ = { ...daily.equipment };
  session.flow.startRun();
  assert.equal(session.run.seed, daily.seed);
  assert.equal(session.views.playerStats.runs, 0);
  assert.equal(session.views.ST.runs, 1);
  assert.notEqual(session.views.ST, session.views.playerStats);
  assert.deepEqual(session.views.EQ, daily.equipment);
  assert.equal(session.trace.includes('seed'), false);
});

test('actual trial entry switches to disposable profile state and preserves seeded retries', () => {
  const first = runStartSession(1, setup, undefined, false),
    second = runStartSession(2, setup, undefined, false);
  first.flow.startTrial(TRIALS[0].id);
  second.flow.startTrial(TRIALS[0].id);
  assert.equal(first.views.activeTrial.id, TRIALS[0].id);
  assert.notEqual(first.views.ST, first.views.playerStats);
  assert.equal(first.views.playerStats.runs, 0);
  assert.equal(first.views.ST.runs, 1);
  assert.equal(first.run.upgradesEnabled, false);
  assert.equal(first.run.hard, true);
  assert.deepEqual(first.trace, ['effects', 'trial']);
  assert.equal(first.views.combatRandom(), second.views.combatRandom());
  const before = first.views.ST.runs;
  first.flow.startTrial(TRIALS[0].id);
  assert.equal(first.views.ST.runs, before);
});

test('actual rush entry dispatches one duel and advances stage/wave through the next-step API', () => {
  const session = runStartSession(44, { ...setup, mode: 'rush' });
  assert.equal(session.run.rush, true);
  assert.equal(session.run.state, 'boss');
  assert.equal(session.run.bossCount, 1);
  assert.equal(session.run.wave, 1);
  session.flow.nextStep();
  assert.equal(session.run.bossCount, 2);
  assert.equal(session.run.wave, 2);
  assert.equal(session.run.stage, 1);
  assert.equal(session.trace.filter((x) => x === 'boss').length, 2);
});
