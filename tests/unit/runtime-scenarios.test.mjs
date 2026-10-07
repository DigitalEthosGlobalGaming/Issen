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
import { spawnEnemy } from '../../src/game/combat/enemy-spawn.ts';
import { updateEnemies } from '../../src/game/combat/enemy-update.ts';
import { targetSwipe } from '../../src/game/combat/targeting.ts';
import { resolveDamage } from '../../src/game/combat/damage.ts';
import { initialSpawns, updateWave } from '../../src/game/encounters/waves.ts';
import { createBoss } from '../../src/game/encounters/boss-create.ts';
import { updateBoss } from '../../src/game/encounters/boss-update.ts';
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

// Run entry now uses the production session API. Encounter drivers still use
// wave entry/update/input now use their real APIs; kill ports remain temporary
// until the remaining phase/rule APIs replace their adapters.
// Their event handlers represent external inputs/state boundaries still inline in
// game.ts. Replace those handlers with extracted phase/kill APIs as they appear;
// assertions concern outcomes and invariants, never a per-tick snapshot.
function driveWave(seed, options = setup, trial) {
  const { run, random } = session(seed, options),
    ledger = createRunRewardLedger();
  const lifecycleFixture = waveLifecycleFixture({
    run,
    random,
    views: { ST: parseStatistics({}) },
  });
  if (trial)
    lifecycleFixture.views.waveCfg = (wave) => ({
      ...waveConfig(wave, run.mode, run.m),
      total: trial.wave.total,
      feint: trial.wave.feint,
      atk: trial.wave.attack,
      refill: true,
    });
  lifecycleFixture.lifecycle.startWave(1, true);
  let cleared = 0,
    attacked = 0;
  let cut = null;
  const inputViews = {
    G: run,
    W: 200,
    ST: parseStatistics({}),
    activeTrial: trial ?? null,
    combatRandom: random.next,
    waveConfiguration: () => run.cfg,
    // Temporary kill port until the production kill-rule API is extracted.
    killEnemy(enemy) {
      cut = enemy;
      enemy.state = 'dying';
      enemy.t = 0;
      run.attacker = null;
      run.gapT = run.cfg.gap;
      run.kills++;
      run.perfects++;
      run.combo++;
      run.maxCombo = Math.max(run.maxCombo, run.combo);
      run.score += scoreGain(Math.round(300 * comboMultiplier(run.combo, run.m)), run);
      accrueRunReward(ledger, 'kill');
      if (run.cfg.refill && run.toSpawn > 0) run.pendingSpawns.push({ slot: enemy.slot, t: 0.45 });
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
  const phase = createWavesPhase((ctx) => ctx);
  const spawned = [];
  lifecycleFixture.views.spawnEnemy = (slot) => {
    spawned.push(spawnEnemy(run, slot, false, position, random.next).dir);
  };
  lifecycleFixture.views.sfx.step = () => {
    attacked++;
  };
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
    updateEnemies(run, 0.02, {
      surge: 0,
      time: tick * 0.02,
      perfectZone: () => 0.78,
      pet: 'none',
      sounds: noSound,
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

test('daily and trial scenarios preserve seeded encounters and objectives', () => {
  const daily = dailyRun('2026-10-07'),
    result = driveWave(daily.seed, daily.setup);
  assert.equal(dailyResult({}, daily.day, result.run).record.score, result.run.score);
  const trial = TRIALS.find((t) => t.id === 'quiet-blade');
  const attempt = driveWave(trial.seed, { ...setup, diff: 'ronin', lives: '0' }, trial);
  assert.equal(trialPassed(trial, { ...attempt.run, failed: false }), true);
  const progress = { completed: [] };
  assert.equal(completeTrial(progress, trial.id), true);
  assert.equal(completeTrial(progress, trial.id), false);
});

test('wrong cuts lose life and combo while feints expose the true direction', () => {
  const { run, random } = session();
  run.cfg = { ...waveConfig(6, 'normal', run.m), feint: 1 };
  run.toSpawn = 1;
  const enemy = spawnEnemy(run, 0, false, position, random.next);
  enemy.state = 'attack';
  enemy.t = 0;
  enemy.T = 1;
  run.attacker = enemy;
  assert.notEqual(enemy.fake, enemy.dir);
  const wrong = targetSwipe([enemy], enemy, OPP[enemy.dir], {
    ordered: true,
    centerX: 100,
    mirrorAvailable: false,
  });
  assert.equal(wrong.kind, 'miss');
  const lives = run.lives,
    outcome = resolveDamage(run, 'wrong');
  assert.equal(outcome.kind, 'hurt');
  assert.equal(outcome.keepCombo, false);
  assert.equal(run.lives, lives - 1);
  updateEnemies(run, enemy.feintAt + 0.01, {
    surge: 0,
    time: 1,
    perfectZone: () => 0.78,
    pet: 'none',
    sounds: noSound,
    foxSave() {},
    playerDie() {
      assert.fail('feint should not expire before its attack');
    },
    position,
  });
  assert.equal(enemy.switched, true);
  assert.equal(
    targetSwipe([enemy], enemy, enemy.dir, { ordered: true, centerX: 100, mirrorAvailable: false })
      .kind,
    'cut',
  );
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
  });

test('standoff, shrine, death and result settlement complete without double rewards', () => {
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
  assert.equal(resolveDamage(run, 'wrong').kind, 'death');
  assert.equal(run.lives, 0);
  const ledger = createRunRewardLedger(),
    meta = parseMeta(null);
  accrueRunReward(ledger, 'kill');
  accrueRunReward(ledger, 'wave');
  accrueRunReward(ledger, 'boss');
  const result = settleRunReward(meta, ledger),
    balance = meta.embers;
  assert.ok(result.gained > 0);
  assert.deepEqual(settleRunReward(meta, ledger), result);
  assert.equal(meta.embers, balance);
});
