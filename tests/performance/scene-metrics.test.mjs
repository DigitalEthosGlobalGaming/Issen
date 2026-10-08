import test from 'node:test';
import assert from 'node:assert/strict';
import { frameStats, tasksAfterPresentation } from './benchmarks/scene-metrics.mjs';
test('frame budgets retain tails and strict threshold counts', () => {
  assert.deepEqual(frameStats([8.3, 4, 16.7, 20, NaN]), {
    count: 4,
    median: 12.5,
    p95: 20,
    p99: 20,
    over8_3: 2,
    over16_7: 1,
  });
  assert.equal(frameStats([]).p95, null);
});
test('presentation window includes its overlapping task and excludes workers and later tasks', () => {
  const marker = { name: 'settled', cat: 'blink.user_timing', ts: 100000, pid: 1, tid: 2 };
  const task = (ts, dur, tid = 2) => ({ name: 'RunTask', ph: 'X', ts, dur, pid: 1, tid });
  const result = tasksAfterPresentation(
    [marker, task(95000, 20000), task(110000, 18000), task(120000, 99000, 3), task(2100000, 90000)],
    'settled',
  );
  assert.equal(result.longestMs, 20);
  assert.equal(result.count, 2);
  assert.equal(result.over16Ms.length, 2);
  assert.equal(
    tasksAfterPresentation(
      [marker, { ...task(110000, 17000), name: 'Scheduler::RunTask' }],
      'settled',
    ).longestMs,
    17,
  );
  assert.throws(() => tasksAfterPresentation([], 'missing'), /Missing/);
  assert.throws(() => tasksAfterPresentation([marker], 'settled'), /No main-thread/);
});
