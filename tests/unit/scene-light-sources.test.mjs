import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFig } from '../../src/shared/figure-model.ts';
import { bindSceneLightSources } from '../../src/presentation/scene-light-sources.ts';
import { createLightSources } from '../../src/presentation/light-sources.ts';
import {
  resolveFigurePose,
  figureBladeTip,
  bladeTip,
} from '../../src/rendering/figures/figure-pose.ts';
import { foxfirePose } from '../../src/presentation/foxfire-pose.ts';

const base = { ambient: [0, 0, 0], directional: [0, 0, 0], direction: [0, 0, 1], points: [] };
function setup() {
  const enemy = {
    state: 'idle',
    glint: 1,
    pos: { x: 100, y: 180, h: 60, alpha: 0.8, fog: 0 },
    d: makeFig(7),
    pose: { gx: 0.1, gy: -0.5, ang: 0.3 },
    lean: 0.03,
  };
  const boss = {
    state: 'flash',
    glint: 0,
    pos: { x: 180, y: 180, h: 80, alpha: 1, fog: 0 },
    d: makeFig(8),
    pose: { gx: 0.1, gy: -0.5, ang: 0.3 },
    lean: 0,
    def: { spear: 1 },
    bp: { flash: 0.4 },
    t: 0.2,
  };
  const lantern = { k: 'lantern', x: 80, y: 70, s: 10, ph: 0.3, t: 0.5, life: 2 };
  const ember = { x: 120, y: 80, t: 0.4, life: 2, ph: 0.1 };
  const views = {
    G: { enemies: [enemy], boss, m: { foxfire: true }, foxUsed: false, state: 'boss' },
    fx: { px: [lantern], embers: [ember] },
    player: { x: 40, y: 250, h: 70 },
    scale: 1,
    sceneLoading: false,
    cinematic: false,
    reducedMotion: false,
    reducedFlashes: false,
  };
  const callbacks = new Map();
  const dispose = bindSceneLightSources(
    {
      register(name, source) {
        callbacks.set(name, source);
        return () => callbacks.delete(name);
      },
    },
    () => views,
  );
  const frame = { time: 2, width: 400, height: 400 };
  return { views, callbacks, frame, dispose, enemy, boss, lantern, ember };
}

test('all five sources share visual poses and lifetimes without mutating input or RNG', () => {
  const { views, callbacks, frame, enemy, boss, lantern, ember } = setup();
  const before = JSON.stringify(views);
  const oldRandom = Math.random;
  Math.random = () => {
    throw new Error('lighting consumed RNG');
  };
  try {
    assert.deepEqual(
      [...callbacks.keys()],
      ['sword-glints', 'lanterns', 'embers', 'foxfire', 'boss-auras'],
    );
    const sample = (name) => callbacks.get(name)(frame);
    for (const name of callbacks.keys()) {
      assert.equal(sample(name).length, 1);
      assert.deepEqual(sample(name), sample(name));
    }
    const figure = resolveFigurePose(
      {
        ...enemy.pos,
        fog: 0,
        d: enemy.d,
        pose: enemy.pose,
        lean: enemy.lean,
        varied: true,
        waiting: true,
        glint: enemy.glint,
      },
      frame.time,
    );
    const tip = figureBladeTip(figure),
      glint = sample('sword-glints')[0].light;
    assert.equal(glint.x, tip[0]);
    assert.equal(glint.y, tip[1]);
    assert.equal(
      sample('lanterns')[0].light.x,
      lantern.x + Math.sin(frame.time * 2 + lantern.ph) * 4,
    );
    assert.equal(
      sample('embers')[0].light.intensity,
      (1 - ember.t / ember.life) * (0.6 + 0.4 * Math.sin(frame.time * 20 + ember.ph)) * 0.25,
    );
    const fox = foxfirePose(views.player, frame.time);
    assert.equal(sample('foxfire')[0].light.x, fox.x);
    assert.equal(sample('foxfire')[0].light.y, fox.y);
    assert.equal(sample('boss-auras')[0].light.y, boss.pos.y - boss.pos.h * 0.62);
    assert.equal(JSON.stringify(views), before);
  } finally {
    Math.random = oldRandom;
  }
});

test('sources retire hidden/dead visuals, respect accessibility and preserve identities through list reorder', () => {
  const { views, callbacks, frame, dispose, enemy, boss, lantern, ember } = setup();
  const sample = (name) => callbacks.get(name)(frame);
  const extra = { ...lantern, x: 90 };
  views.fx.px.push(extra);
  const ids = new Map(sample('lanterns').map((q) => [q.light.x, q.id]));
  views.fx.px.reverse();
  assert.deepEqual(new Map(sample('lanterns').map((q) => [q.light.x, q.id])), ids);
  views.reducedFlashes = true;
  assert.deepEqual(sample('sword-glints'), []);
  assert.deepEqual(sample('boss-auras'), []);
  assert.equal(sample('embers')[0].light.intensity, (1 - ember.t / ember.life) * 0.6 * 0.25);
  views.G.foxUsed = true;
  assert.equal(sample('foxfire')[0].light.intensity, 0.12);
  views.G.state = 'title';
  assert.equal(sample('foxfire')[0].light.intensity, 0.5);
  views.reducedFlashes = false;
  enemy.state = 'dying';
  boss.state = 'dying';
  assert.deepEqual(sample('sword-glints'), []);
  assert.deepEqual(sample('boss-auras'), []);
  lantern.t = lantern.life;
  extra.t = -1;
  ember.t = ember.life;
  assert.deepEqual(sample('lanterns'), []);
  assert.deepEqual(sample('embers'), []);
  views.sceneLoading = true;
  assert.deepEqual(sample('foxfire'), []);
  dispose();
  dispose();
  assert.equal(callbacks.size, 0);
});

test('persistent sources enter the same viewport budget and physical transform as rig/event lights', () => {
  const { views } = setup();
  const sources = createLightSources();
  const dispose = bindSceneLightSources(sources, () => views);
  const frame = { width: 800, height: 800, time: 2 };
  const original = sources.lighting(frame, base).points;
  assert.equal(original.length, 5);
  const moved = sources.lighting(
    { ...frame, transform: { a: 2, b: 0, c: 0, d: 2, tx: 10, ty: 20 } },
    base,
  ).points;
  assert.equal(moved.length, 5);
  for (let i = 0; i < 5; i++) {
    assert.equal(moved[i].x, original[i].x * 2 + 10);
    assert.equal(moved[i].y, original[i].y * 2 + 20);
    assert.equal(moved[i].radius, original[i].radius * 2);
  }
  dispose();
  assert.deepEqual(sources.lighting(frame, base).points, []);
});

test('shared blade tip follows nonuniform figure scale and rotation', () => {
  const pose = { gx: 0.1, gy: -0.5, ang: 0.3 };
  const [x, y] = bladeTip(pose, 0.03, 0.98);
  const figure = {
    x: 100,
    y: 200,
    h: 60,
    sy: 0.8,
    rot: Math.PI / 2,
    pose,
    lean: 0.03,
    spear: true,
  };
  const world = figureBladeTip(figure);
  assert.ok(Math.abs(world[0] - (100 - y * 60 * 0.8)) < 1e-10);
  assert.ok(Math.abs(world[1] - (200 + x * 60)) < 1e-10);
});
