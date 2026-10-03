import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyRun, dailyResult } from '../../src/game/progression/daily.ts';
import { DEFAULT_EQUIPMENT } from '../../src/platform/saves.ts';

test('daily date uses UTC and repeats seed, setup and all gear independently', () => {
  const first = dailyRun(new Date('2026-10-03T23:00:00-10:00'));
  assert.deepEqual(first, dailyRun('2026-10-04'));
  assert.notEqual(first.seed, dailyRun('2026-10-03').seed);
  first.equipment.blade = 'changed';
  assert.notEqual(dailyRun('2026-10-04').equipment.blade, 'changed');
  assert.deepEqual(dailyRun('2026-10-04').setup, {
    mode: 'waves',
    diff: 'normal',
    arrows: true,
    lives: '3',
    upgrades: false,
  });
  for (const key of ['pet', 'crest', 'fx', 'film', 'seal', 'bladeSp', 'bladeThird', 'robeSp'])
    assert.equal(first.equipment[key], DEFAULT_EQUIPMENT[key]);
  for (const bad of ['2026-02-30', 'bad', '2026-13-01']) assert.throws(() => dailyRun(bad));
});
test('daily personal records retain maxima, sanitize corrupt data and stay bounded', () => {
  const result = dailyResult({ '2026-10-03': { score: 100, combo: -1, wave: 2 } }, '2026-10-03', {
    score: 80,
    maxCombo: 3,
    wave: 1,
  });
  assert.deepEqual(result.record, { score: 100, combo: 3, wave: 2 });
  assert.equal(result.newBest, false);
  const prior = Object.fromEntries(
    Array.from({ length: 40 }, (_, i) => [
      new Date(Date.UTC(2026, 8, i + 1)).toISOString().slice(0, 10),
      { score: 1 },
    ]),
  );
  const best = dailyResult(prior, '2026-10-03', { score: 20, maxCombo: 4, wave: 2 });
  assert.equal(best.newBest, true);
  assert.equal(Object.keys(best.records).length, 32);
});
