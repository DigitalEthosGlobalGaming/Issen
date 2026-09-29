import test from 'node:test';
import assert from 'node:assert/strict';
import { restorableRng } from '../../src/shared/random.ts';
import { directionMatches } from '../../src/shared/directions.ts';
import { targetSwipe } from '../../src/game/combat/targeting.ts';
import { resolveStandoffSwipe, createStandoff } from '../../src/game/encounters/standoff.ts';
import { unlockEligibleItems } from '../../src/game/progression/unlocks.ts';
import { parseEquipment } from '../../src/platform/saves.ts';
import { parseRunCheckpoint } from '../../src/platform/run-checkpoint.ts';
import { createWeatherState } from '../../src/rendering/scene/weather-state.ts';
import { updateWeather } from '../../src/rendering/scene/weather-update.ts';
import { createItems } from '../../src/game/content/items.ts';
import { STAT0 } from '../../src/game/progression/statistics.ts';

test('restored seeded stream continues with the exact same rolls', () => {
  const first = restorableRng(123456);
  const prefix = [first.next(), first.next()];
  const state = first.state();
  const continuation = [first.next(), first.next(), first.next()];
  const second = restorableRng(123456);
  assert.deepEqual([second.next(), second.next()], prefix);
  second.restore(state);
  assert.deepEqual([second.next(), second.next(), second.next()], continuation);
});

test('visual weather rolls do not alter seeded hazard timing', () => {
  const first = createWeatherState(() => 0.5);
  const second = createWeatherState(() => 0.5);
  first.surgeT = second.surgeT = 0;
  const a = restorableRng(77),
    b = restorableRng(77);
  const env = {
    weather: 'storm',
    phase: 'playing',
    width: 100,
    height: 100,
    scale: 1,
    wind: 0,
    time: 0,
    hazard: 1,
    layout: { eH: 10, groundY: 80 },
    flash() {},
    sounds: { thunder() {}, gust() {} },
    gustLeaves() {},
    onShake() {},
  };
  updateWeather(first, [], 0.1, { ...env, random: () => 0.1, hazardRandom: a.next });
  updateWeather(second, [{ x: 0, y: 200, z: 1, l: 0, ph: 0, rot: 0, vr: 0, fl: 0 }], 0.1, {
    ...env,
    random: () => 0.9,
    hazardRandom: b.next,
  });
  assert.equal(first.surgeT, second.surgeT);
  assert.equal(a.state(), b.state());
});

test('third Steel awakening requires first awakening and 3000 eligible cuts', () => {
  const stats = structuredClone(STAT0);
  const unlocked = new Set(['steel']);
  const items = createItems(() => unlocked).filter((item) => item.id === 'steel');
  const progress = {
    version: 1,
    blades: { steel: { k: 2999, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 } },
    robes: {},
  };
  const grants = [];
  const check = (access) =>
    unlockEligibleItems(stats, unlocked, items, (id) => grants.push(id), { access, progress });
  check(0);
  assert.deepEqual(grants, []);
  check(1);
  assert.deepEqual(grants, ['steel+']);
  progress.blades.steel.k = 3000;
  check(1);
  check(1);
  assert.deepEqual(grants, ['steel+', 'steel++']);
});

test('axis cuts work for ordered and free targets but not on the wrong axis', () => {
  for (const [actual, expected, matches] of [
    ['left', 'right', true],
    ['right', 'left', true],
    ['up', 'down', true],
    ['down', 'up', true],
    ['left', 'up', false],
    ['down', 'right', false],
  ])
    assert.equal(directionMatches(actual, expected, true), matches);
  assert.equal(directionMatches('left', 'right'), false);
  const enemy = { state: 'idle', dir: 'right', order: 1, pos: { x: 0 } };
  for (const ordered of [false, true]) {
    const options = { ordered, centerX: 0, mirrorAvailable: false, axisOnly: true };
    assert.equal(targetSwipe([enemy], null, 'left', options).kind, 'cut');
    assert.equal(targetSwipe([enemy], null, 'up', options).kind, 'miss');
  }
  const so = createStandoff({ dir: 'up', glint: 0 }, 1, 'normal', 1, 1, () => 0);
  so.fired = true;
  assert.equal(resolveStandoffSwipe(so, 'down', true), 'cut');
});

test('third-form save selection is gated by ownership and keeps old saves', () => {
  const unlocks = new Set(['steel', 'steel+', 'steel++']);
  const items = createItems(() => unlocks);
  assert.equal(parseEquipment({ blade: 'steel', bladeSp: true }, unlocks, items).bladeSp, true);
  const third = parseEquipment({ blade: 'steel', bladeSp: true, bladeThird: true }, unlocks, items);
  assert.equal(third.bladeThird, true);
  assert.equal(third.bladeSp, false);
  assert.equal(
    parseEquipment({ blade: 'steel', bladeThird: true }, new Set(['steel']), items).bladeThird,
    false,
  );
});

test('checkpoint parser rejects malformed or inconsistent records', () => {
  assert.equal(parseRunCheckpoint(null), null);
  assert.equal(parseRunCheckpoint({ version: 1, status: 'active' }), null);
});
