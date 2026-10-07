import test from 'node:test';
import assert from 'node:assert/strict';
import { trialSessionFixture } from './helpers/runtime-trial-session.mjs';
import { TRIALS } from '../../src/game/content/trials.ts';

test('trial completion rewards once and restores the player profile and ordinary random stream', () => {
  const f = trialSessionFixture(),
    profile = structuredClone(f.views.playerStats);
  f.start('quiet-blade');
  const trial = f.views.activeTrial;
  assert.equal(f.views.G.state, 'playing');
  assert.notEqual(f.views.ST, f.views.playerStats);
  f.views.G.kills = trial.wave.total;
  f.views.G.perfects = trial.wave.perfects;
  f.session.finishTrial();
  f.session.finishTrial();
  assert.equal(f.views.trialResult.passed, true);
  assert.equal(f.views.trialResult.newlyCompleted, true);
  assert.deepEqual(f.views.TRIAL_PROGRESS.completed, ['quiet-blade']);
  assert.equal(f.views.UNL.has(trial.reward.id), true);
  assert.equal(f.views.ST, f.views.playerStats);
  assert.equal(f.views.EQ, f.views.playerEquipment);
  assert.equal(f.views.combatRandom, f.views.R);
  assert.deepEqual(f.views.playerStats, profile);
  assert.equal(f.trace.filter((x) => x === 'issen.trials').length, 1);
});

test('failed trial retry repeats seeded entry without awarding persistent rewards', () => {
  const f = trialSessionFixture();
  f.start('quiet-blade');
  const spawns = structuredClone(f.views.G.pendingSpawns);
  f.session.finishTrial('A mistake');
  assert.equal(f.views.trialResult.passed, false);
  assert.equal(f.records.size, 0);
  f.start('quiet-blade');
  assert.deepEqual(f.views.G.pendingSpawns, spawns);
  assert.equal(f.views.G.kills, 0);
});

test('duel master trial enters the actual boss controller with twenty exchanges', () => {
  const f = trialSessionFixture(),
    trial = TRIALS.find((t) => t.duelMaster);
  f.start(trial.id);
  assert.equal(f.views.G.state, 'boss');
  assert.equal(f.views.G.boss.hp, 20);
  assert.equal(f.views.G.boss.maxHp, 20);
  f.views.G.boss.state = 'flash';
  f.duel.phase.onTapDown(f.duel.views);
  assert.equal(f.views.G.boss.chainLeft, 1);
  assert.equal(f.views.G.boss.state, 'stagger');
});
