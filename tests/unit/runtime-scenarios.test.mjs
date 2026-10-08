import { trialSessionFixture } from './helpers/runtime-trial-session.mjs';
import { resultsSessionFixture } from './helpers/runtime-results-session.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';
import { shrinePhaseFixture } from './helpers/runtime-shrine-phase.mjs';
import { bossPhaseFixture } from './helpers/runtime-boss-phase.mjs';
import { standoffPhaseFixture } from './helpers/runtime-standoff-phase.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { createWavesPhase } from '../../src/game/phases/waves.ts';
import { parseStatistics } from '../../src/platform/saves.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState, resetRun } from '../../src/game/run-state.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { DIRS, OPP } from '../../src/shared/directions.ts';
import { DEFAULT_EQUIPMENT } from '../../src/platform/saves.ts';
import { waveConfig } from '../../src/game/encounters/configuration.ts';
import { createGrunt as spawnEnemy } from '../../src/game/combat/grunt-spawn.ts';
import { advanceGrunts } from '../../src/game/combat/grunt.ts';
import { targetSwipe } from '../../src/game/combat/targeting.ts';
import { resolveDamage } from '../../src/game/combat/damage.ts';
import { initialSpawns, updateWave } from '../../src/game/encounters/waves.ts';
import { createBoss } from '../../src/game/encounters/boss-create.ts';
import { advanceBoss as updateBoss } from '../../src/game/encounters/boss-simulation.ts';
import { parryOpening } from '../../src/game/encounters/boss-openings.ts';
import {
  createStandoff,
  updateStandoff,
  resolveStandoffSwipe,
} from '../../src/game/encounters/standoff.ts';
import { shrineOffers, applyBlessing } from '../../src/game/shrine/blessings.ts';
import { comboMultiplier, scoreGain } from '../../src/game/progression/scoring.ts';
import { dailyRun, dailyResult } from '../../src/game/progression/daily.ts';
import { TRIALS } from '../../src/game/content/trials.ts';
import { trialPassed, completeTrial } from '../../src/game/progression/trials.ts';
import { parseMeta } from '../../src/game/progression/meta.ts';
import {
  createRunRewardLedger,
  accrueRunReward,
  settleRunReward,
} from '../../src/game/progression/run-rewards.ts';

const position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const noSound = { bell() {}, feint() {}, bark() {} };
function session(seed = 123456, options = setup, equipment = DEFAULT_EQUIPMENT) {
  return runStartSession(seed, options, equipment);
}

// Fixed-seed scenarios drive production entry, encounter, input and result APIs.
// Test-owned feedback/service ports keep the scenarios headless.
function driveWave(seed, options = setup, trial, suppliedRuntime) {
  const runtime = suppliedRuntime ?? session(seed, options),
    run = runtime.run, random = { next: runtime.views.combatRandom, state: () => trial ? null : runtime.views.runRandom.state() },
    ledger = runtime.views.rewardLedger;
  const kill = enemyKillFixture({ ...runtime, random });
  kill.views.activeTrial = trial ?? null;
  const lifecycleFixture = waveLifecycleFixture({
    run,
    random,
    views: { ST: parseStatistics({}), events: runtime.views.events },
  });
  if (!trial) lifecycleFixture.lifecycle.startWave(1, true);
  else assert.equal(run.cfg.total, trial.wave.total, 'trial entry supplies the actual wave configuration');
  let cleared = 0,
    attacked = 0;
  let cut = null;
  const inputViews = {
    events: runtime.views.events,
    events: kill.views.events,
    G: run,
    W: 200,
    ST: parseStatistics({}),
    activeTrial: trial ?? null,
    combatRandom: random.next,
    waveConfiguration: () => run.cfg,
    killEnemy(enemy, direction, chained, preserveStreak, automatic) {
      cut = enemy;
      kill.rules.killEnemy(enemy, direction, chained, preserveStreak, automatic);
    },
    orderSucceeded() {},
    pop() {},
    sfx: { glint() {}, whoosh() {} },
    swingPlayer() {},
    playerDie() {
      assert.fail('valid phase inputs must hit the selected attacker');
    },
    enemyPos: position,
    earn() {},
    addScore() {
      return 0;
    },
    comboMult() {
      return 1;
    },
    knifeTrail() {},
    sparks() {},
    buzz() {},
    hud() {},
    saveStats() {},
  };
  const phase = createWavesPhase((ctx) => ctx, lifecycleFixture.lifecycle);
  const spawned = [];
  lifecycleFixture.views.spawnEnemy = (slot) => {
    spawned.push(spawnEnemy(run, slot, false, position, random.next).dir);
  };
  runtime.views.events.on('waveAttack', event => {
    if (event.kind === 'step') attacked++;
  });
  lifecycleFixture.views.earn = (event) => {
    if (event === 'wave') {
      cleared++;
      accrueRunReward(ledger, 'wave');
    }
  };
  lifecycleFixture.views.addScore = (points) => {
    const gained = scoreGain(points, run);
    run.score += gained;
    return gained;
  };
  for (let tick = 0; tick < 6000 && run.state === 'playing'; tick++) {
    advanceGrunts(run, 0.02, {
      surge: 0,
      time: tick * 0.02,
      perfectZone: () => 0.78,
      pet: 'none',
      events: runtime.views.events,
      foxSave() {},
      playerDie() {
        assert.fail('valid cuts must avoid a late strike');
      },
      position,
    });
    lifecycleFixture.lifecycle.updateWave(0.02);
    const enemy = run.attacker;
    if (!enemy || enemy.p < 0.8) continue;
    cut = null;
    phase.onSwipe(inputViews, trial?.mirrored ? OPP[enemy.dir] : enemy.dir);
    assert.equal(cut, enemy);
  }
  assert.equal(run.state, 'between', 'wave must progress within a bounded simulation');
  assert.equal(cleared, 1);
  assert.equal(run.kills, run.cfg.total);
  assert.ok(attacked >= run.kills && run.score > 0 && run.combo > 0);
  assert.ok(run.enemies.every((e) => ['dying', 'fade'].includes(e.state)));
  return { run, ledger, spawned, randomState: random.state() };
}

for (const diff of ['normal', 'ronin'])
  test(`seeded ${diff} wave clears with valid cuts and score`, () => {
    const first = driveWave(123456, { ...setup, diff }),
      second = driveWave(123456, { ...setup, diff });
    assert.deepEqual(first.spawned, second.spawned);
    assert.equal(first.randomState, second.randomState);
    assert.equal(first.run.score, second.run.score);
  });

test('daily and trial scenarios use production entry and settle disposable profiles once', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 9, 7, 12) });
  const dailyRuntime = runStartSession(0, setup, DEFAULT_EQUIPMENT, false);
  const originalDailyStats = structuredClone(dailyRuntime.views.playerStats);
  dailyRuntime.flow.startDaily();
  const daily = dailyRuntime.views.activeDaily;
  assert.equal(daily.day, '2026-10-07');
  assert.equal(dailyRuntime.run.seed, daily.seed);
  assert.notEqual(dailyRuntime.views.ST, dailyRuntime.views.playerStats);
  const result = driveWave(daily.seed, daily.setup, undefined, dailyRuntime);
  const dailyResults = resultsSessionFixture(dailyRuntime);
  const endings = [];
  dailyRuntime.views.events.on('runEnded', (event) => endings.push(event));
  dailyResults.flow.finishDaily();
  assert.equal(dailyResults.saved.get('issen.daily')[daily.day].score, result.run.score);
  assert.equal(result.run.state, 'over');
  dailyResults.flow.finishDaily();
  assert.equal(endings.length, 1);
  assert.deepEqual(dailyRuntime.views.playerStats, originalDailyStats);

  const trial = trialSessionFixture();
  const originalTrialStats = structuredClone(trial.runtime.views.playerStats);
  const originalEquipment = structuredClone(trial.runtime.views.playerEquipment);
  trial.start('quiet-blade');
  const definition = trial.views.activeTrial;
  assert.equal(definition.seed, 9909);
  assert.notEqual(trial.runtime.views.ST, trial.runtime.views.playerStats);
  const attempt = driveWave(definition.seed, setup, definition, trial.runtime);
  assert.ok(attempt.run.perfects >= definition.wave.perfects);
  const retry = trialSessionFixture();
  retry.start(definition.id);
  const repeated = driveWave(definition.seed, setup, retry.views.activeTrial, retry.runtime);
  assert.deepEqual(attempt.spawned, repeated.spawned);
  assert.equal(attempt.run.score, repeated.run.score);
  trial.session.finishTrial();
  assert.equal(trial.views.trialResult.passed, true);
  assert.equal(trial.views.trialResult.newlyCompleted, true);
  assert.deepEqual(trial.views.TRIAL_PROGRESS.completed, [definition.id]);
  assert.equal(trial.runtime.run.state, 'title');
  assert.equal(trial.runtime.views.ST, trial.runtime.views.playerStats);
  assert.equal(trial.runtime.views.EQ, trial.runtime.views.playerEquipment);
  assert.deepEqual(trial.runtime.views.playerStats, originalTrialStats);
  assert.deepEqual(trial.runtime.views.playerEquipment, originalEquipment);
  const written = trial.trace.filter((key) => key === 'issen.trials').length;
  trial.session.finishTrial();
  assert.equal(trial.trace.filter((key) => key === 'issen.trials').length, written);
});

test('wrong cuts lose life and combo while feints expose the true direction', () => {
  const runtime = session();
  const { run, random } = runtime;
  run.cfg = { ...waveConfig(6, 'normal', run.m), feint: 1 };
  run.toSpawn = 1;
  const enemy = spawnEnemy(run, 0, false, position, random.next);
  enemy.state = 'attack';
  enemy.t = 0;
  enemy.T = 1;
  run.attacker = enemy;
  assert.notEqual(enemy.fake, enemy.dir);
  const death = deathPhaseFixture(runtime);
  const wave = waveLifecycleFixture({ run, random, views: { ST: death.views.ST, events: death.views.events } });
  const input = createWavesPhase((views) => views, wave.lifecycle);
  const lives = run.lives;
  run.combo = 5;
  input.onSwipe({
    events: runtime.views.events, G: run, W: 200, activeTrial: null, waveConfiguration: () => run.cfg,
    playerDie: death.phase.playerDie, swingPlayer() {}, sfx: { whoosh() {} },
  }, OPP[enemy.dir]);
  assert.equal(run.lives, lives - 1);
  assert.equal(run.combo, 0);
  assert.equal(run.hits, 1);
  assert.equal(run.state, 'playing');
  // Continue with a fresh attacker: the damaged one now completes its strike.
  const nextEnemy = spawnEnemy(run, 1, false, position, random.next);
  nextEnemy.state = 'attack'; nextEnemy.t = 0; nextEnemy.T = 1;
  run.attacker = nextEnemy;
  advanceGrunts(run, nextEnemy.feintAt + 0.01, {
    surge: 0,
    time: 1,
    perfectZone: () => 0.78,
    pet: 'none',
    events: runtime.views.events,
    foxSave() {},
    playerDie() {
      assert.fail('feint should not expire before its attack');
    },
    position,
  });
  assert.equal(nextEnemy.switched, true);
  let target;
  input.onSwipe({
    events: runtime.views.events, G: run, W: 200, activeTrial: null, waveConfiguration: () => run.cfg,
    killEnemy: (cut) => { target = cut; }, orderSucceeded() {},
  }, nextEnemy.dir);
  assert.equal(target, nextEnemy);

});

for (const [type, count] of [
  ['base', 3],
  ['twin', 4],
  ['spear', 5],
  ['mirror', 6],
])
  test(`seeded ${type} boss/rush duel opens parry and block windows and can end`, () => {
    const runtime = session(9123, { ...setup, mode: 'rush' }),
      { run, random } = runtime;
    const duel = bossPhaseFixture(runtime);
    run.bossCount = count - 1;
    duel.phase.startBoss();
    duel.views.playerDie = () => assert.fail('valid boss input must prevent strikes');
    assert.equal(run.rush, true);
    const boss = run.boss,
      states = new Set(),
      allowed = new Set([
        'enter',
        'idle',
        'windup',
        'flash',
        'feint',
        'stagger',
        'recover',
        'hurt',
        'strike',
        'dying',
      ]);
    let parries = 0,
      blocks = 0;
    for (let tick = 0; tick < 10000 && run.boss; tick++) {
      states.add(boss.state);
      assert.ok(allowed.has(boss.state));
      duel.phase.updateBoss(0.02);
      if (!run.boss) break;
      states.add(boss.state);
      if (boss.state === 'flash') {
        assert.ok(boss.t < boss.bp.flash);
        assert.equal(duel.phase.onTapDown(duel.views), true);
        parries++;
        states.add(boss.state);
      }
      if (boss.state === 'stagger') {
        assert.ok(boss.t < boss.window);
        if (boss.chainLeft > 1) blocks++;
        duel.phase.onSwipe(duel.views, boss.sdir);
      }
    }
    assert.equal(run.boss, null, 'duel must finish within a bounded simulation');
    assert.equal(boss.hp, 0);
    assert.ok(parries > 0);
    for (const state of ['enter', 'idle', 'windup', 'flash', 'hurt', 'dying'])
      assert.ok(states.has(state), `${type}: ${state}`);
    if (type === 'twin') assert.ok(parries > boss.maxHp);
    if (type === 'mirror') assert.equal(states.has('feint'), false);
    assert.ok(blocks > 0);
    // A missed opening closes and reports damage instead of stalling indefinitely.
    const missed = createBoss(count, run.mode, run.m, position);
    missed.state = 'stagger';
    missed.t = missed.window;
    let recovered = 0;
    run.boss = missed;
    run.state = 'boss';
    duel.views.breakCombo = () => {
      recovered++;
    };
    duel.phase.updateBoss(0.02);
    assert.equal(missed.state, 'recover');
    assert.equal(recovered, 1);

    // A second natural fight deliberately misses alternate parries and every cut.
    // Together the winning and recovery paths must visit every reachable table state.
    const recoveryRuntime = session(9123, { ...setup, mode: 'rush' });
    const recovery = bossPhaseFixture(recoveryRuntime);
    const damage = deathPhaseFixture(recoveryRuntime);
    recoveryRuntime.run.bossCount = count - 1;
    recoveryRuntime.run.lives = recoveryRuntime.run.maxLives = 100;
    recoveryRuntime.run.runWards = 0;
    recovery.phase.startBoss();
    recovery.views.playerDie = damage.phase.playerDie;
    const recoveringBoss = recoveryRuntime.run.boss;
    const required = [...allowed].filter((state) => type !== 'mirror' || state !== 'feint');
    let openings = 0;
    for (let tick = 0; tick < 20000 && !required.every((state) => states.has(state)); tick++) {
      assert.equal(recoveryRuntime.run.state, 'boss');
      states.add(recoveringBoss.state);
      assert.ok(allowed.has(recoveringBoss.state));
      recovery.phase.updateBoss(0.02);
      states.add(recoveringBoss.state);
      if (recoveringBoss.state === 'flash' && recoveringBoss.t === 0 && openings++ % 2 === 0)
        recovery.phase.onTapDown(recovery.views);
    }
    for (const state of required) assert.ok(states.has(state), `${type}: bounded winning/recovery path must reach ${state}`);
    assert.ok(recoveryRuntime.run.lives < recoveryRuntime.run.maxLives, 'missed parries route through actual damage');
  });

test('standoff, shrine, death and result settlement complete without double rewards', async () => {
  const runtime = session(),
    { run, random } = runtime;
  const standoff = standoffPhaseFixture(runtime);
  standoff.phase.startStandoff(2, false);
  const enemy = run.so.e;
  let nextWave = 0;
  standoff.views.startWave = () => {
    nextWave++;
  };
  for (let tick = 0; tick < 1000 && run.so && !run.so.fired; tick++)
    standoff.phase.update(standoff.views, 0.01);
  assert.ok(run.so.fired);
  standoff.phase.onSwipe(standoff.views, enemy.dir);
  assert.equal(enemy.state, 'dying');
  standoff.phase.update(standoff.views, 1.5);
  assert.equal(nextWave, 1);
  assert.equal(run.so, null);
  run.bossCount = 2;
  const shrine = shrinePhaseFixture(runtime);
  shrine.phase.openShrine();
  const offers = shrine.offers;
  assert.ok(offers.length > 0);
  assert.equal(new Set(offers.map((o) => o.id)).size, offers.length);
  shrine.phase.pick(offers[0]);
  assert.ok(run.bless.has(offers[0].id));
  run.bless.clear();
  run.lives = 1;
  run.runWards = 0;
  const death = deathPhaseFixture(runtime);
  const results = resultsSessionFixture(runtime);
  run.reviveOfferResolved = true;
  death.views.showOver = results.flow.showOver;
  run.state = 'playing';
  death.phase.playerDie(null, 'wrong');
  assert.equal(run.state, 'dead');
  assert.equal(run.lives, 0);
  death.phase.updateDeath(2);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(run.state, 'over');
  const balance = runtime.views.META.embers;
  assert.ok(runtime.views.rewardLedger.settled);
  results.flow.showOver();
  assert.equal(runtime.views.META.embers, balance);
  assert.equal(results.sequences.length, 1);
});
