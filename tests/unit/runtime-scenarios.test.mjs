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
  const random = restorableRng(seed),
    run = createRunState();
  resetRun(run, options, equipment, random.next);
  run.state = 'playing';
  run.seed = seed;
  run.wave = 1;
  return { run, random };
}

// Before extraction, these scenario drivers use current exported simulations.
// Their event handlers represent external inputs/state boundaries still inline in
// game.ts. Replace those handlers with extracted phase/kill APIs as they appear;
// assertions concern outcomes and invariants, never a per-tick snapshot.
function driveWave(seed, options = setup, trial) {
  const { run, random } = session(seed, options),
    ledger = createRunRewardLedger();
  run.cfg = waveConfig(1, run.mode, run.m);
  if (trial)
    run.cfg = {
      ...run.cfg,
      total: trial.wave.total,
      feint: trial.wave.feint,
      atk: trial.wave.attack,
      refill: true,
    };
  run.toSpawn = run.cfg.total;
  run.pendingSpawns = initialSpawns(run.cfg.pack, false, random.next);
  let cleared = 0,
    attacked = 0;
  const spawned = [];
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
    updateWave(
      run,
      0.02,
      {
        spawn(slot) {
          spawned.push(spawnEnemy(run, slot, false, position, random.next).dir);
        },
        attack() {
          attacked++;
        },
        cleared(bonus) {
          cleared++;
          run.score += scoreGain(bonus, run);
          accrueRunReward(ledger, 'wave');
        },
      },
      random.next,
    );
    const enemy = run.attacker;
    if (!enemy || enemy.p < 0.8) continue;
    const outcome = targetSwipe(run.enemies, enemy, enemy.dir, {
      ordered: run.cfg.ordered,
      centerX: 100,
      mirrorAvailable: false,
    });
    assert.equal(outcome.kind, 'cut');
    assert.equal(outcome.target, enemy);
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
    const { run, random } = session(9123, { ...setup, mode: 'rush' });
    run.state = 'boss';
    run.bossCount = count;
    run.boss = createBoss(count, run.mode, run.m, position);
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
      updateBoss(run, 0.02, {
        random: random.next,
        sounds: { glint() {}, feint() {} },
        flash() {},
        playerDie() {
          assert.fail('parry should happen before flash window closes');
        },
        recovered() {},
        position,
      });
      if (!run.boss) break;
      states.add(boss.state);
      if (boss.state === 'flash') {
        assert.ok(boss.t < boss.bp.flash);
        parryOpening(
          boss,
          { count, mode: run.mode, chainModifier: 0, counter: false },
          random.next,
        );
        parries++;
        states.add(boss.state);
      }
      if (boss.state === 'stagger') {
        assert.ok(boss.t < boss.window);
        while (boss.chainLeft > 1) {
          boss.chainLeft--;
          blocks++;
        }
        boss.hp--;
        boss.state = boss.hp === 0 ? 'dying' : 'hurt';
        boss.t = 0;
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
    updateBoss({ boss: missed, state: 'boss' }, 0.02, {
      random: random.next,
      sounds: { glint() {}, feint() {} },
      flash() {},
      playerDie() {},
      recovered() {
        recovered++;
      },
      position,
    });
    assert.equal(missed.state, 'recover');
    assert.equal(recovered, 1);
  });

test('standoff, shrine, death and result settlement complete without double rewards', () => {
  const { run, random } = session();
  run.cfg = waveConfig(1, run.mode, run.m);
  run.toSpawn = 1;
  const enemy = spawnEnemy(run, 2, false, position, random.next);
  run.state = 'standoff';
  run.so = createStandoff(enemy, 2, run.mode, 1, 1, random.next);
  let nextWave = 0;
  for (let tick = 0; tick < 1000 && run.so && !run.so.fired; tick++)
    updateStandoff(
      run,
      0.01,
      {
        nextWave() {
          nextWave++;
        },
        step() {},
        draw() {},
        late() {
          assert.fail('draw window must be observable');
        },
      },
      random.next,
    );
  assert.ok(run.so.fired);
  assert.equal(resolveStandoffSwipe(run.so, enemy.dir), 'cut');
  updateStandoff(
    run,
    1.5,
    {
      nextWave() {
        nextWave++;
      },
      step() {},
      draw() {},
      late() {},
    },
    random.next,
  );
  assert.equal(nextWave, 1);
  assert.equal(run.so, null);
  run.state = 'shrine';
  run.bossCount = 2;
  const before = JSON.stringify({ ...run, bless: [...run.bless] }),
    offers = shrineOffers(run, random.next);
  assert.ok(offers.length > 0);
  assert.equal(new Set(offers.map((o) => o.id)).size, offers.length);
  assert.equal(
    JSON.stringify({ ...run, bless: [...run.bless] }),
    before,
    'offer generation cannot mutate run',
  );
  run.bless.add(offers[0].id);
  applyBlessing(run, offers[0].id, random.next);
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
