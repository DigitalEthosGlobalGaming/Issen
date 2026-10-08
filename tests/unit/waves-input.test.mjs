import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { bindWaveInputFeedback } from '../../src/presentation/wave-input-feedback.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createWavesPhase } from '../../src/game/phases/waves.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { createGrunt as spawnEnemy } from '../../src/game/combat/grunt-spawn.ts';
import { scoreGain, comboMultiplier } from '../../src/game/progression/scoring.ts';

const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
function fixture(enabled = true) {
  const session = runStartSession(7654, setup),
    G = session.run,
    trace = [];
  const enemy = spawnEnemy(G, 0, false, position, session.random.next);
  enemy.state = 'attack';
  enemy.dir = 'up';
  enemy.p = 0.5;
  G.attacker = enemy;
  G.cfg.ordered = false;
  const views = {
    events: session.views.events,
    L: { player: { x: 100, y: 200, h: 150 } },
    G,
    W: 200,
    ST: session.views.ST,
    activeTrial: null,
    combatRandom: session.random.next,
    waveConfiguration: () => G.cfg,
    // The real kill API moves later; this port observes targeting without adding rules.
    killEnemy(target, direction, mirror) {
      trace.push(['kill', target, direction, mirror]);
    },
    orderSucceeded() {
      trace.push('order');
    },
    pop() {},
    sfx: {
      glint() {
        trace.push('glint');
      },
      whoosh() {
        trace.push('whoosh');
      },
    },
    swingPlayer(dir) {
      trace.push(['swing', dir]);
    },
    playerDie(killer, reason) {
      trace.push(['die', killer, reason]);
    },
    enemyPos: position,
    earn(event) {
      trace.push(['earn', event]);
    },
    addScore(points) {
      const gained = scoreGain(points, G);
      G.score += gained;
      return gained;
    },
    comboMult: () => comboMultiplier(G.combo, G.m),
    knifeTrail() {
      trace.push('knife');
    },
    sparks() {},
    buzz() {},
    hud() {},
    saveStats() {},
  };
  const disposeFeedback = enabled ? bindWaveInputFeedback(session.views.events, () => views) : () => {};
  return {
    disposeFeedback,
    session,
    views,
    enemy,
    trace,
    phase: createWavesPhase((ctx) => ctx, waveLifecycleFixture(session).lifecycle),
  };
}

test('actual wave phase routes correct and wrong swipes while preserving the cut direction', () => {
  const f = fixture(),
    before = f.session.random.state();
  f.phase.onSwipe(f.views, 'up');
  assert.deepEqual(f.trace[0], ['kill', f.enemy, 'up', false]);
  assert.equal(f.session.random.state(), before, 'target routing consumes no gameplay RNG');
  f.trace.length = 0;
  f.phase.onSwipe(f.views, 'left');
  assert.deepEqual(f.trace, [['swing', 'left'], 'whoosh', ['die', f.enemy, 'wrong']]);
});

test('actual mirrored trial routing resolves the inverse direction before the kill port', () => {
  const f = fixture();
  f.views.activeTrial = { mirrored: true };
  f.phase.onSwipe(f.views, 'down');
  assert.deepEqual(f.trace[0], ['kill', f.enemy, 'down', false]);
  f.trace.length = 0;
  f.phase.onSwipe(f.views, 'up');
  assert.equal(f.trace.at(-1)[0], 'die');
});

test('actual knife input spends one charge, clears the attacker and preserves combo', () => {
  const f = fixture();
  f.views.G.knives = 1;
  f.views.G.combo = 7;
  f.phase.onTap(f.views);
  f.phase.onTap(f.views);
  assert.equal(f.views.G.knives, 0);
  assert.equal(f.enemy.state, 'dying');
  assert.equal(f.views.G.attacker, null);
  assert.equal(f.views.G.combo, 7);
  assert.equal(f.views.G.kills, 1);
  assert.equal(f.views.ST.kills, 1);
  assert.ok(f.views.G.score > 0);
  assert.equal(f.trace.filter((x) => x === 'knife').length, 1);
  assert.equal(f.trace.filter((x) => Array.isArray(x) && x[0] === 'earn').length, 1);
});

test('wave finger-down stays available for swipes and a zero-charge tap has no feedback', () => {
  const f = fixture();
  f.views.G.knives = 0;
  assert.equal(f.phase.onTapDown(f.views), false);
  f.phase.onTap(f.views);
  assert.deepEqual(f.trace, []);
  assert.equal(f.enemy.state, 'attack');
});


test('actual knife kills preserve run/profile/RNG when cosmetic reactions are absent and snapshots survive replacement', () => {
  function drive(enabled) {
    const f = fixture(enabled), snapshots = [];
    f.session.views.events.on('knifeHit', event => snapshots.push(event));
    f.views.G.knives = 1; f.views.G.combo = 7;
    const oldRandom = f.session.random.state();
    f.phase.onTap(f.views);
    f.phase.onTap(f.views);
    assert.equal(snapshots.length, 1);
    const event = snapshots[0];
    assert.ok(Object.isFrozen(event));
    assert.deepEqual(event, { x0: 100, y0: 117.5, x: 100, y: 200, height: 150 });
    assert.notEqual(f.session.random.state(), oldRandom);
    const count = f.trace.filter(value => value === 'knife' || value === 'whoosh').length;
    assert.equal(count, enabled ? 2 : 0);
    f.disposeFeedback();
    f.views.L = { player: { x: 900, y: 800, h: 12 } };
    f.enemy.pos.x = 999;
    assert.equal(event.x, 100);
    f.session.views.events.emit('swipeCue', { kind: 'mirror' });
    assert.equal(f.trace.filter(value => value === 'knife' || value === 'whoosh').length, count);
    return { run: structuredClone(f.views.G), stats: structuredClone(f.views.ST), random: f.session.random.state() };
  }
  assert.deepEqual(drive(true), drive(false));
});
