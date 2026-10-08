import test from 'node:test';
import assert from 'node:assert/strict';
import { lightFootprint, selectSceneLights } from '../../src/rendering/light-budget.ts';
import { createLightSources } from '../../src/presentation/light-sources.ts';

const light = (overrides = {}) => ({
  x: 50,
  y: 50,
  z: 20,
  radius: 10,
  intensity: 1,
  color: [1, 1, 1],
  ...overrides,
});
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test('budget uses clipped circular area, including partial edges and corner misses', () => {
  close(lightFootprint(light(), 100, 100), Math.PI * 100);
  close(lightFootprint(light({ x: 0 }), 100, 100), Math.PI * 50);
  close(lightFootprint(light({ x: 0, y: 0 }), 100, 100), Math.PI * 25);
  close(lightFootprint(light({ radius: 1000 }), 100, 100), 10000);
  assert.equal(lightFootprint(light({ x: -9, y: -9 }), 100, 100), 0);
  assert.equal(lightFootprint(light({ radius: 0 }), 100, 100), 0);
});
test('16-light selection ranks intensity times visible area with stable IDs across input order', () => {
  const candidates = Array.from({ length: 20 }, (_, index) => ({
    id: String(index).padStart(2, '0'),
    light: light({ z: index + 1 }),
  }));
  const selected = selectSceneLights(candidates, 100, 100);
  assert.equal(selected.length, 16);
  assert.deepEqual(
    selected,
    candidates.slice(0, 16).map((entry) => entry.light),
  );
  assert.deepEqual(selectSceneLights([...candidates].reverse(), 100, 100), selected);
  const strong = light({ intensity: 2 }),
    large = light({ radius: 20 }),
    offscreen = light({ x: -50, intensity: 1000 });
  assert.deepEqual(
    selectSceneLights(
      [
        { id: 'a', light: strong },
        { id: 'b', light: large },
        { id: 'c', light: offscreen },
      ],
      100,
      100,
    ),
    [large, strong],
  );
  assert.deepEqual(
    selectSceneLights(
      [
        { id: 'nan', light: light({ intensity: NaN }) },
        { id: 'black', light: light({ color: [0, 0, 0] }) },
      ],
      100,
      100,
    ),
    [],
  );
});
test('registry samples explicit effects clock and applies source mutations on the next frame', () => {
  const registry = createLightSources(),
    frame = { width: 100, height: 100, time: 3 };
  const base = {
    ambient: [0.5, 0.5, 0.5],
    directional: [0, 0, 0],
    direction: [0, 0, 1],
    points: [light()],
  };
  let added = false,
    calls = [];
  const remove = registry.register('first', (current) => {
    assert.equal(current, frame);
    calls.push('first');
    if (!added) {
      added = true;
      registry.register('next', () => {
        calls.push('next');
        return [{ id: 'n', light: light() }];
      });
    }
    return [{ id: 'f', light: light() }];
  });
  assert.equal(registry.lighting(frame, base).points.length, 2);
  assert.deepEqual(calls, ['first']);
  assert.equal(registry.lighting(frame, base).points.length, 3);
  remove();
  remove();
  calls = [];
  assert.equal(registry.lighting(frame, base).points.length, 2);
  assert.deepEqual(calls, ['next']);
  assert.equal(base.points.length, 1);
  assert.throws(() => registry.register('next', () => []), /Duplicate/);
  registry.dispose();
  assert.equal(registry.lighting(frame, base).points.length, 1);
});
