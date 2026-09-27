import test from 'node:test';
import assert from 'node:assert/strict';
import { STAT0 } from '../../src/game/progression/statistics.ts';
import { modeKey, recordLabel } from '../../src/game/progression/modes.ts';
import { statisticsRows, formatPlayTime } from '../../src/ui/screens/stats.ts';

test('mode save keys preserve flag order and their display labels', () => {
  const key = modeKey({ mode: 'ronin', blade: true, zen: true, hard: false, rush: true });
  assert.equal(key, 'ronin-blade-zen-rush');
  assert.equal(recordLabel(key), 'Boss rush, Ronin, blade only, endless');
  assert.equal(
    modeKey({ mode: 'normal', blade: false, zen: false, hard: true, rush: false }),
    'normal-hard',
  );
});

test('statistics report endless combo separately from score and retain unknown death labels', () => {
  const stats = structuredClone(STAT0);
  stats.deaths['unknown-reason'] = 4;
  stats.rec['normal-zen'] = { score: 100, combo: 23, wave: 9 };
  stats.rec.ronin = { score: 450, combo: 10, wave: 3 };
  stats.furthestStage = 2.5;
  const rows = statisticsRows(stats, 8, 100);
  assert.deepEqual(rows.records, [
    ['23 連', 'Normal, endless'],
    ['450', 'Ronin'],
  ]);
  assert.equal(rows.summary.find((row) => row[1] === 'Most common end')[0], 'unknown-reason');
  assert.equal(rows.summary.find((row) => row[1] === 'Armory unlocked')[0], '8 of 100');
  assert.notEqual(rows.summary.find((row) => row[1] === 'Furthest stage')[0], 'Unknown');
  assert.equal(formatPlayTime(3599), '59m 59s');
  assert.equal(formatPlayTime(3661), '1h 1m');
});
