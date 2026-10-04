import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareImport } from '../../src/platform/save-transfer.ts';
import {
  parseDailyLogin,
  recordDailyLogin,
  mergeDailyLogin,
  localLoginDay,
} from '../../src/game/progression/daily-login.ts';

test('seven local dates earn the crest once, repeated visits do not advance it', () => {
  let progress = parseDailyLogin(null);
  for (let day = 1; day <= 7; day++) {
    const date = `2026-10-0${day}`;
    progress = recordDailyLogin(progress, date);
    assert.equal(progress.streak, day);
    assert.equal(progress.earned, day === 7);
    assert.deepEqual(recordDailyLogin(progress, date), progress);
  }
  assert.deepEqual(recordDailyLogin(progress, '2026-10-10'), {
    lastDay: '2026-10-10',
    streak: 1,
    earned: true,
  });
});
test('missed days reset, backward dates do not count, calendar boundaries remain consecutive', () => {
  let progress = { lastDay: '2026-03-31', streak: 3, earned: false };
  assert.equal(recordDailyLogin(progress, '2026-04-01').streak, 4);
  assert.equal(recordDailyLogin(progress, '2026-04-02').streak, 1);
  assert.deepEqual(recordDailyLogin(progress, '2026-03-30'), progress);
  assert.deepEqual(recordDailyLogin(progress, '2026-02-30'), progress);
  assert.equal(localLoginDay(new Date(2026, 9, 4, 23, 59)), '2026-10-04');
});
test('save validation and merge keep the latest streak and permanent ownership', () => {
  assert.deepEqual(parseDailyLogin({ lastDay: 'bad', streak: 7 }), {
    lastDay: '',
    streak: 0,
    earned: false,
  });
  assert.deepEqual(
    mergeDailyLogin(
      { lastDay: '2026-10-03', streak: 7, earned: true },
      { lastDay: '2026-10-05', streak: 1 },
    ),
    { lastDay: '2026-10-05', streak: 1, earned: true },
  );
});

test('save transfer restores earned crest and keeps the more recent streak', () => {
  const result = prepareImport(
    JSON.stringify({ meta: {}, dailyLogin: { lastDay: '2026-10-01', streak: 7, earned: true } }),
    { dailyLogin: { lastDay: '2026-10-04', streak: 2 } },
  );
  assert.equal(result.data.dailyLogin.streak, 2);
  assert.equal(result.data.dailyLogin.earned, true);
  assert.ok(result.data.unlocks.includes('seven-dawns'));
});
