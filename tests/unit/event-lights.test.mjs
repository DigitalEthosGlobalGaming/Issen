import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../src/game/events.ts';
import { createLightSources } from '../../src/presentation/light-sources.ts';
import { bindEventLights } from '../../src/presentation/event-lights.ts';

const base = { ambient: [0, 0, 0], directional: [0, 0, 0], direction: [0, 0, 1], points: [] };
function setup() {
  const events = createEventBus(),
    sources = createLightSources();
  const views = { time: 3, reducedFlashes: false };
  const dispose = bindEventLights(events, sources, () => views);
  const frame = () => ({ width: 400, height: 400, time: views.time });
  const lights = () => sources.lighting(frame(), base).points;
  return { events, sources, views, dispose, frame, lights };
}
const cue = () => ({ x: 80, y: 110, height: 100, perfect: true });

test('combat flashes decay only on effects time; repeated sampling preserves events and sources', () => {
  const { events, views, lights } = setup();
  const payload = cue();
  const original = JSON.stringify(payload);
  const random = Math.random;
  Math.random = () => {
    throw new Error('light consumed random');
  };
  try {
    events.emit('kill', payload);
    const first = lights();
    assert.equal(first.length, 1);
    assert.equal(first[0].y, payload.y - payload.height * 0.55);
    assert.deepEqual(lights(), first);
    views.time += 0.09;
    const half = lights();
    assert.ok(Math.abs(half[0].intensity - first[0].intensity * 0.25) < 1e-8);
    assert.deepEqual(lights(), half);
    views.time += 0.1;
    assert.deepEqual(lights(), []);
    assert.equal(JSON.stringify(payload), original);
    assert.deepEqual(base.points, []);
  } finally {
    Math.random = random;
  }
});

test('all combat event sources use camera, zoom and DPR; reduced flashes and lifecycle reset are immediate', () => {
  const { events, sources, views, frame, lights, dispose } = setup();
  for (const name of ['kill', 'parry', 'block']) events.emit(name, cue());
  assert.equal(lights().length, 3);
  const logical = lights();
  const scaled = sources.lighting(
    { ...frame(), width: 800, height: 800, transform: { a: 4, b: 0, c: 0, d: 4, tx: 10, ty: -20 } },
    base,
  ).points;
  assert.equal(scaled.length, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(scaled[i].x, logical[i].x * 4 + 10);
    assert.equal(scaled[i].y, logical[i].y * 4 - 20);
    assert.equal(scaled[i].radius, logical[i].radius * 4);
    assert.equal(scaled[i].z, logical[i].z * 4);
  }
  views.reducedFlashes = true;
  assert.deepEqual(lights(), []);
  events.emit('parry', cue());
  views.reducedFlashes = false;
  assert.equal(lights().length, 3);
  events.emit('runStartCue', { kind: 'effects' });
  assert.deepEqual(lights(), []);
  events.emit('block', cue());
  assert.equal(lights().length, 1);
  events.emit('runStarted', { seed: 1, mode: 'normal' });
  assert.deepEqual(lights(), []);
  events.emit('kill', cue());
  dispose();
  dispose();
  events.emit('kill', cue());
  assert.deepEqual(lights(), []);
});

test('event storm shares the deterministic global16 budget without per-source truncation', () => {
  const { events, lights } = setup();
  events.emit('parry', cue());
  for (let i = 0; i < 1000; i++) events.emit('kill', cue());
  const first = lights();
  assert.equal(first.length, 16);
  assert.ok(first.some((light) => light.radius === 65));
  assert.deepEqual(lights(), first);
});
