import test from 'node:test';
import assert from 'node:assert/strict';
import { markScenePhase, measureScenePhase } from '../../src/platform/scene-timing.ts';
test('scene marks measure existing phases and bound retained diagnostics', () => {
  const start = markScenePhase('prepare-scene', 'test', { stage: 1 }),
    end = markScenePhase('settle-presented-scene', 'test');
  measureScenePhase('scene-load', start, end, 'test');
  assert.equal(performance.getEntriesByName('issen:scene-load:test', 'measure').length, 1);
  measureScenePhase('missing', 'missing', end, 'test');
  assert.equal(performance.getEntriesByName('issen:missing:test', 'measure').length, 0);
  for (let i = 0; i < 200; i++) markScenePhase('test', String(i));
  assert.ok(
    performance.getEntriesByType('mark').filter((entry) => entry.name.startsWith('issen:'))
      .length <= 128,
  );
});
