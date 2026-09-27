import test from 'node:test';
import assert from 'node:assert/strict';
import { recordRun } from '../../src/game/progression/run-records.ts';
import { STAT0 } from '../../src/game/progression/statistics.ts';
const run = () => ({
  mode: 'normal',
  blade: false,
  zen: false,
  hard: false,
  rush: false,
  score: 100,
  maxCombo: 5,
  wave: 1,
  runTime: 12,
  reason: 'late',
  runBlade: 'steel',
});
test('run records update personal bests and blade history without lowering old records', () => {
  const stats = structuredClone(STAT0);
  assert.equal(recordRun(stats, run()).newBest, true);
  assert.equal(stats.bestScore, 100);
  assert.equal(stats.bl.steel.sc, 100);
  assert.equal(stats.w1deaths, 1);
  const result = recordRun(stats, { ...run(), score: 50, maxCombo: 3, wave: 2, mode: 'ronin' });
  assert.equal(result.newBest, true);
  assert.equal(stats.bestRonin, 50);
  assert.equal(stats.bestScore, 100);
  assert.equal(stats.bl.steel.sc, 100);
  assert.equal(stats.time, 24);
  assert.equal(stats.deaths.late, 2);
});
test('quitting does not count a death; endless records track combos without changing score bests', () => {
  const stats = structuredClone(STAT0);
  recordRun(stats, { ...run(), reason: 'quit' });
  assert.deepEqual(stats.deaths, {});
  assert.equal(stats.w1deaths, 0);
  const result = recordRun(stats, { ...run(), zen: true, score: 999, maxCombo: 15 });
  assert.equal(result.newBest, true);
  assert.equal(result.record.combo, 15);
  assert.equal(stats.bestScore, 100);
  assert.equal(stats.bl.steel.sc, 100);
  assert.equal(recordRun(stats, { ...run(), zen: true, score: 2000, maxCombo: 10 }).newBest, false);
  assert.equal(stats.rec['normal-zen'].combo, 15);
});
