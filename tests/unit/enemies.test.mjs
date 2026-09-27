import test from 'node:test';
import assert from 'node:assert/strict';
import { updateEnemies } from '../../src/game/combat/enemy-update.ts';
import { enemyPosition } from '../../src/rendering/figures/enemy-position.ts';
import { createLayout } from '../../src/rendering/layout.ts';
import { EPOSE, makeFig } from '../../src/rendering/figures/model.ts';
import { spawnEnemy, selectAttacker, orderedEnemies } from '../../src/game/combat/enemy-spawn.ts';
import { targetSwipe } from '../../src/game/combat/targeting.ts';
const layout = createLayout(390, 844);
const position = (e) => enemyPosition(e, layout, 390, 844);
test('unordered swipes prefer attacker, otherwise the nearest matching blade', () => {
  const far = enemy(),
    near = enemy();
  far.pos.x = 10;
  near.pos.x = 190;
  const options = { ordered: false, centerX: 195, mirrorAvailable: false };
  assert.equal(targetSwipe([far, near], far, 'right', options).target, far);
  assert.equal(targetSwipe([far, near], null, 'right', options).target, near);
  assert.deepEqual(targetSwipe([], null, 'right', options), { kind: 'ignore' });
});
test('ordered swipes ignore entering leader and distinguish feints from wrong cuts', () => {
  const first = enemy(),
    later = enemy();
  first.order = 1;
  later.order = 2;
  first.fake = 'left';
  const options = { ordered: true, centerX: 195, mirrorAvailable: false };
  first.state = 'enter';
  assert.deepEqual(targetSwipe([later, first], later, 'right', options), { kind: 'ignore' });
  first.state = 'attack';
  assert.equal(targetSwipe([later, first], first, 'left', options).reason, 'feint');
  first.switched = true;
  assert.equal(targetSwipe([later, first], first, 'left', options).reason, 'wrong');
  const saved = targetSwipe([later, first], first, 'left', { ...options, mirrorAvailable: true });
  assert.deepEqual(saved, { kind: 'cut', target: first, mirror: true });
  assert.equal(
    targetSwipe([first], first, 'right', { ...options, mirrorAvailable: true }).mirror,
    false,
  );
});
test('spawning preserves wave counters and excludes the real direction from feints', () => {
  const state = { cfg: { feint: 1 }, toSpawn: 5, nextOrder: 1, wave: 6, enemies: [] };
  const first = spawnEnemy(state, 0, false, position, () => 0.5);
  assert.notEqual(first.fake, first.dir);
  assert.equal(first.state, 'enter');
  assert.equal(first.order, 1);
  assert.equal(state.toSpawn, 4);
  const attract = spawnEnemy(state, 1, true, position, () => 0.5);
  assert.equal(attract.fake, null);
  assert.equal(attract.look, null);
  assert.equal(attract.state, 'idle');
  assert.equal(state.toSpawn, 4);
  assert.equal(state.nextOrder, 3);
  assert.notEqual(first.pose, attract.pose);
  assert.ok(Object.values(first.pos).every(Number.isFinite));
});
test('ordered selection waits for the first living enemy and never reorders source state', () => {
  const first = enemy(),
    second = enemy(),
    dead = enemy();
  first.order = 1;
  first.state = 'enter';
  second.order = 2;
  second.state = 'idle';
  dead.order = 0;
  dead.state = 'dying';
  const list = [second, dead, first];
  assert.equal(selectAttacker(list, true), null);
  assert.equal(
    selectAttacker(list, false, () => 0),
    second,
  );
  first.state = 'idle';
  assert.equal(selectAttacker(list, true), first);
  assert.deepEqual(orderedEnemies(list), [first, second]);
  assert.deepEqual(list, [second, dead, first]);
  first.state = 'fade';
  second.state = 'strike';
  assert.equal(selectAttacker(list, true), null);
});
function enemy() {
  return {
    slot: 0,
    dir: 'right',
    fake: null,
    feintAt: 0.4,
    switched: false,
    order: 1,
    state: 'attack',
    t: 0,
    life: 0,
    p: 0,
    T: 1,
    k: 0,
    d: makeFig(4),
    pose: { ...EPOSE.guard },
    snap: 0,
    lean: 0,
    look: null,
    glint: 0,
    pos: { x: 0, y: 0, h: 1, fog: 0, alpha: 1 },
  };
}
function fixture() {
  const e = enemy(),
    events = [];
  const state = {
    enemies: [e],
    freezeT: 0,
    state: 'playing',
    attacker: e,
    combo: 0,
    bless: new Set(),
    slowT: 0,
    petT: 0,
    foxUsed: false,
    so: null,
    m: { hazard: 0.5, suzu: 0, foxfire: 0 },
  };
  const env = {
    surge: 0,
    time: 1,
    perfectZone: () => 0.78,
    pet: 'nopet',
    sounds: {
      bell: () => events.push('bell'),
      feint: () => events.push('feint'),
      bark: () => events.push('bark'),
    },
    foxSave: () => events.push('save'),
    playerDie: () => {
      events.push('death');
      state.state = 'dead';
    },
    position,
  };
  return { e, state, env, events };
}
test('freeze stops attack progression while storm surge accelerates it', () => {
  const { e, state, env } = fixture();
  state.freezeT = 1;
  updateEnemies(state, 0.1, env);
  assert.equal(e.t, 0);
  assert.equal(e.life, 0.1);
  state.freezeT = 0;
  env.surge = 1;
  updateEnemies(state, 0.1, env);
  assert.equal(e.t, 0.12);
  assert.equal(e.p, 0.12);
});
test('feint warning, direction switch and pet cue fire once; still mind activates once', () => {
  const { e, state, env, events } = fixture();
  e.fake = 'left';
  state.m.suzu = 1;
  env.pet = 'shiba';
  state.bless.add('still');
  updateEnemies(state, 0.3, env);
  assert.deepEqual(events, ['bell']);
  updateEnemies(state, 0.15, env);
  assert.deepEqual(events, ['bell', 'feint', 'bark']);
  assert.equal(e.switched, true);
  assert.equal(state.petT, 0.6);
  updateEnemies(state, 0.35, env);
  assert.equal(state.slowT, 0.45);
  state.slowT = 0;
  updateEnemies(state, 0.01, env);
  assert.equal(state.slowT, 0);
});
test('foxfire prevents the first late strike and death state changes are observed synchronously', () => {
  const { e, state, env, events } = fixture();
  state.m.foxfire = 1;
  updateEnemies(state, 1, env);
  assert.deepEqual(events, ['save']);
  assert.equal(state.foxUsed, true);
  updateEnemies(state, 0.1, env);
  assert.deepEqual(events, ['save', 'death']);
  updateEnemies(state, 0.1, env);
  assert.deepEqual(events, ['save', 'death']);
});
test('entry, fade and death lifetimes preserve transitions and valid projection', () => {
  const { e, state, env } = fixture();
  e.state = 'enter';
  updateEnemies(state, 0.9, env);
  assert.equal(e.state, 'idle');
  assert.equal(e.t, 0);
  assert.ok(Object.values(e.pos).every(Number.isFinite));
  e.state = 'strike';
  e.zen = true;
  updateEnemies(state, 0.41, env);
  assert.equal(e.state, 'fade');
  updateEnemies(state, 0.51, env);
  assert.equal(state.enemies.length, 0);
  e.state = 'dying';
  e.t = 0;
  state.enemies = [e];
  updateEnemies(state, 1.13, env);
  assert.equal(state.enemies.length, 0);
});

test('rapid deaths expire with their visual effects under small slow-motion steps and pause', () => {
  const { state, env } = fixture();
  state.enemies = ['split', 'kneel', 'disarm', 'stagger'].map((deathType) => ({
    ...enemy(),
    state: 'dying',
    deathType,
  }));
  for (let i = 0; i < 89; i++) updateEnemies(state, 0.01, env);
  assert.equal(state.enemies.length, 4);
  const times = state.enemies.map((e) => e.t);
  updateEnemies(state, 0, env);
  assert.deepEqual(
    state.enemies.map((e) => e.t),
    times,
  );
  updateEnemies(state, 0.011, env);
  assert.deepEqual(
    state.enemies.map((e) => e.deathType),
    ['kneel', 'disarm', 'stagger'],
  );
  updateEnemies(state, 0.2, env);
  assert.equal(state.enemies.length, 0);
});
