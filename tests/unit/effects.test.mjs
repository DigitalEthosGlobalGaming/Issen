import test from 'node:test';
import assert from 'node:assert/strict';
import { createEffects } from '../../src/rendering/effects/state.ts';
import { updateEffects } from '../../src/rendering/effects/update.ts';
import { createEffectSpawner } from '../../src/rendering/effects/spawn.ts';
import { createItems } from '../../src/game/content/items.ts';
import { rng } from '../../src/shared/random.ts';
import { SHADOW_DURATION, BOSS_SHADOW_DURATION } from '../../src/rendering/figures/death.ts';
const env = { scale: 1, wind: 0, time: 1, random: () => 0.5, onSwordStuck() {} };

test('death ground marks expire in unscaled time even while combat is stopped', () => {
  for (const life of [SHADOW_DURATION, BOSS_SHADOW_DURATION]) {
    const fx = createEffects();
    fx.stains.push({ x: 100, y: 200, rx: 30, t: 0, life });
    updateEffects(fx, 0, life / 2, env);
    assert.equal(fx.stains.length, 1);
    assert.equal(fx.stains[0].t, life / 2);
    updateEffects(fx, 0, life / 2, env);
    assert.equal(fx.stains.length, 0);
  }
});

test('every catalog kill effect spawns finite particles and expires independently', () => {
  const items = createItems(() => new Set()).filter((item) => item.type === 'fx');
  assert.ok(items.length > 15);
  const live = createEffects();
  const sounds = Object.fromEntries(
    ['zap', 'shatter', 'poof', 'crackle', 'popper', 'squeak'].map((key) => [key, () => {}]),
  );
  const finite = (value) => {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    else if (value && typeof value === 'object') Object.values(value).forEach(finite);
  };
  for (const item of items) {
    const preview = createEffects();
    createEffectSpawner(preview, { scale: 0.8, random: rng(42), flash() {}, sounds }).killFx(
      item.id,
      120,
      200,
      0.5,
      0.7,
    );
    assert.ok(
      Object.values(preview).some((list) => list.length),
      item.id,
    );
    finite(preview);
    for (let i = 0; i < 200; i++) {
      updateEffects(preview, 0.025, 0.025, env);
      finite(preview);
    }
    assert.ok(
      Object.values(preview).every((list) => list.length === 0),
      item.id,
    );
    assert.deepEqual(live, createEffects());
  }
});

test('effect instances are independent and stamps use unscaled time', () => {
  const live = createEffects(),
    preview = createEffects();
  for (const key of Object.keys(live)) assert.notEqual(live[key], preview[key]);
  preview.slashes.push({ x1: 0, y1: 0, x2: 1, y2: 1, w: 1, dark: false, t: 0, life: 0.3 });
  preview.stamps.push({ x: 0, y: 0, text: '斬', size: 10, seal: false, t: 0, life: 0.3 });
  updateEffects(preview, 0.1, 0.4, env);
  assert.equal(preview.slashes[0].t, 0.1);
  assert.equal(preview.stamps.length, 0);
  assert.deepEqual(live, createEffects());
});

test('sword impact clamps to ground and emits sound exactly once', () => {
  const fx = createEffects();
  let impacts = 0;
  fx.swords.push({
    x: 0,
    y: 90,
    vx: 2,
    vy: 100,
    ang: 0,
    vr: 1,
    len: 20,
    ground: 100,
    stuck: false,
    t: 0,
    life: 2,
  });
  const input = { ...env, onSwordStuck: () => impacts++ };
  updateEffects(fx, 0.1, 0.1, input);
  assert.equal(fx.swords[0].stuck, true);
  assert.equal(fx.swords[0].y, 94);
  assert.equal(fx.swords[0].ang, Math.PI / 2);
  const x = fx.swords[0].x;
  updateEffects(fx, 0.1, 0.1, input);
  assert.equal(fx.swords[0].x, x);
  assert.equal(impacts, 1);
});

test('delayed particles wait before moving; rotating koi retain speed', () => {
  const fx = createEffects();
  fx.px.push({ k: 'fw', x: 0, y: 0, vx: 10, vy: 0, s: 2, t: -0.2, life: 1 });
  fx.px.push({ k: 'koi', x: 0, y: 0, vx: 3, vy: 4, vr: 2, s: 2, t: 0, life: 1 });
  updateEffects(fx, 0.1, 0.1, env);
  assert.equal(fx.px[0].x, 0);
  assert.ok(Math.abs(Math.hypot(fx.px[1].vx, fx.px[1].vy) - 5) < 1e-12);
  updateEffects(fx, 0.1, 0.1, env);
  assert.equal(fx.px[0].x, 1);
  updateEffects(fx, 2, 2, env);
  assert.equal(fx.px.length, 0);
});
