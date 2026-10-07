import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { bossPhaseFixture } from './helpers/runtime-boss-phase.mjs';
import { standoffPhaseFixture } from './helpers/runtime-standoff-phase.mjs';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';
import { resultsSessionFixture } from './helpers/runtime-results-session.mjs';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
function observe(bus, name, check = () => {}) {
  const values = [];
  const off = bus.on(name, (value) => {
    assert.equal(Object.isFrozen(value), true);
    assert.ok(Object.values(value).every((v) => v === null || typeof v !== 'object'));
    check(value);
    values.push(value);
  });
  return { values, off };
}
test('run entry emits a committed seed/mode and terminal results emit once after settlement', () => {
  const runtime = runStartSession(4312, setup, undefined, false),
    G = runtime.run;
  const started = observe(runtime.views.events, 'runStarted', (event) => {
    assert.equal(event.seed, G.seed);
    assert.equal(G.state, 'playing');
  });
  runtime.flow.startRun();
  assert.deepEqual(started.values, [{ seed: 4312, mode: 'normal' }]);
  const results = resultsSessionFixture(runtime);
  const ended = observe(runtime.views.events, 'runEnded', (event) => {
    assert.equal(G.state, 'over');
    assert.ok(runtime.views.rewardLedger.settled);
    assert.equal(event.score, G.score);
  });
  G.state = 'dead';
  G.reason = 'wrong';
  G.reviveOfferResolved = true;
  results.flow.showOver();
  results.flow.showOver();
  assert.equal(ended.values.length, 1);
  assert.equal(ended.values[0].reason, 'wrong');
});
test('wave events wait for actual deferred entry and carry its once-only committed clear score', () => {
  const runtime = runStartSession(4312, setup),
    f = waveLifecycleFixture(runtime),
    G = runtime.run;
  const started = observe(runtime.views.events, 'waveStarted'),
    cleared = observe(runtime.views.events, 'waveCleared', (event) => {
      assert.equal(G.state, 'between');
      assert.equal(event.score, G.score);
    });
  let begin;
  f.views.deferUntilSceneReady = (action) => {
    begin = action;
    return true;
  };
  f.lifecycle.startWave(4, true);
  assert.equal(started.values.length, 0);
  begin();
  assert.deepEqual(started.values, [{ wave: 4, stage: 1 }]);
  G.toSpawn = 0;
  G.pendingSpawns = [];
  G.enemies = [];
  f.lifecycle.updateWave(0.1);
  f.lifecycle.updateWave(0.1);
  assert.equal(cleared.values.length, 1);
});
test('Twin parries and a block emit flat sword-tip positions, then defeat emits one committed victory', () => {
  const runtime = runStartSession(4312, setup),
    f = bossPhaseFixture(runtime),
    G = runtime.run;
  const started = observe(runtime.views.events, 'bossStarted', (e) =>
    assert.equal(e.count, G.bossCount),
  );
  G.bossCount = 3;
  f.phase.startBoss();
  const b = G.boss;
  const parries = observe(runtime.views.events, 'parry'),
    blocks = observe(runtime.views.events, 'block');
  const defeated = observe(runtime.views.events, 'bossDefeated', () => {
    assert.equal(b.state, 'dying');
    assert.equal(G.state, 'between');
    assert.equal(G.bossesSlain, 1);
  });
  b.state = 'flash';
  assert.equal(f.phase.onTapDown(f.views), true);
  assert.equal(f.phase.onTapDown(f.views), false);
  b.state = 'flash';
  f.phase.onTapDown(f.views);
  assert.deepEqual(
    parries.values.map((e) => e.second),
    [true, false],
  );
  for (const e of parries.values) assert.deepEqual([e.x, e.y, e.height], [100, 50, 150]);
  b.chainLeft = 2;
  f.phase.onSwipe(f.views, b.sdir);
  assert.equal(blocks.values.length, 1);
  assert.deepEqual(
    [blocks.values[0].x, blocks.values[0].y, blocks.values[0].height],
    [100, 50, 150],
  );
  b.hp = 1;
  b.chainLeft = 1;
  f.phase.onSwipe(f.views, b.sdir);
  f.phase.onSwipe(f.views, b.sdir);
  assert.equal(started.values.length, 1);
  assert.equal(defeated.values.length, 1);
});
test('nonfatal and fatal struck events report committed remaining lives without duplicate death', () => {
  const runtime = runStartSession(4312, setup),
    f = deathPhaseFixture(runtime),
    G = runtime.run;
  const hits = observe(runtime.views.events, 'struck', (event) => {
    assert.equal(event.lives, G.lives);
    if (event.fatal) assert.equal(G.state, 'dead');
  });
  G.lives = 2;
  G.state = 'playing';
  f.phase.playerDie(null, 'wrong');
  assert.equal(hits.values.length, 1);
  assert.equal(hits.values[0].fatal, false);
  f.phase.playerDie(null, 'late');
  f.phase.playerDie(null, 'late');
  assert.equal(hits.values.length, 2);
  assert.equal(hits.values[1].fatal, true);
  assert.deepEqual(
    hits.values.map((e) => e.reason),
    ['wrong', 'late'],
  );
});
test('standoff success, invalid swipe and timeout each emit one final outcome', () => {
  for (const outcome of ['success', 'early', 'late']) {
    const runtime = runStartSession(4312, setup),
      f = standoffPhaseFixture(runtime),
      G = runtime.run;
    const resolved = observe(runtime.views.events, 'standoffResolved');
    f.phase.startStandoff(4, false);
    if (outcome !== 'early') f.phase.update(f.views, G.so.fireAt);
    if (outcome === 'late') {
      f.phase.update(f.views, G.so.win + 0.01);
      f.phase.update(f.views, 0.1);
    } else {
      f.phase.onSwipe(f.views, G.so.e.dir);
      f.phase.onSwipe(f.views, G.so.e.dir);
    }
    assert.deepEqual(resolved.values, [
      {
        won: outcome === 'success',
        perfect: outcome === 'success',
        ...(outcome === 'success' ? {
          direction: G.so.e.dir,
          x: G.so.e.pos.x,
          y: G.so.e.pos.y - G.so.e.pos.h * 0.55,
          height: G.so.e.pos.h,
        } : {}),
      },
    ]);
  }
});
