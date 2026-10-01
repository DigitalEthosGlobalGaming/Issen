import test from 'node:test';
import assert from 'node:assert/strict';
import { editionAccess, itemAccessible, trialAccessible } from '../../src/platform/editions.ts';
import {
  swiftSlashPoints,
  precisionZone,
  duelMasterTimings,
} from '../../src/game/progression/mastery.ts';
import {
  parseMeta,
  purchaseUpgrade,
  templateModifiers,
  templatePowers,
} from '../../src/game/progression/meta.ts';
import {
  createRunRewardLedger,
  accrueRunReward,
  settleRunReward,
} from '../../src/game/progression/run-rewards.ts';
import { createCombatHaptics } from '../../src/platform/haptics.ts';
import { parseSettings } from '../../src/platform/settings.ts';
import { createItems } from '../../src/game/content/items.ts';
import { parseStatistics } from '../../src/platform/saves.ts';

const normal = { mode: 'waves', diff: 'normal', arrows: true, lives: '3' };
test('edition grants remain separate from purchases; all added items and trials enforce access', () => {
  for (const [edition, owned, access] of [
    ['free', false, false],
    ['free', true, true],
    ['premium', false, true],
    ['web', false, true],
  ]) {
    assert.equal(editionAccess(edition, owned), access);
    for (const id of [
      'falling-leaves',
      'ember-ash',
      'ink-wash',
      'pilgrims-bead',
      'first-strike',
      'quiet-seal',
      'supporter-print',
    ])
      assert.equal(itemAccessible(id, access), access);
    for (const id of ['quiet-blade', 'duel-master'])
      assert.equal(trialAccessible(id, access), access);
    assert.equal(itemAccessible('steel', access), true);
    assert.equal(trialAccessible('unbroken', access), true);
  }
});
test('premium Temple purchases are guarded and ranks retain progress when access is lost', () => {
  const meta = parseMeta({ schemaVersion: 4, embers: 2000, upgrades: { focus: 2 } });
  assert.equal(purchaseUpgrade(meta, 'precision'), false);
  assert.equal(meta.embers, 2000);
  for (let rank = 1; rank <= 3; rank++) {
    assert.equal(purchaseUpgrade(meta, 'precision', true), true);
    const mods = templateModifiers(meta, normal, true);
    assert.equal(mods.precision, rank * 0.05);
    assert.equal(mods.parry, 1.1 * (1 + rank * 0.05));
    assert.ok(
      Math.abs((1 - precisionZone(0.78, 0, mods.precision)) / (1 - 0.78) - (1 + rank * 0.05)) <
        1e-9,
    );
  }
  assert.equal(purchaseUpgrade(meta, 'discernment', true), true);
  assert.equal(templatePowers(meta, normal, true).shrineRerolls, 1);
  assert.equal(templatePowers(meta, { ...normal, upgrades: false }, true).shrineRerolls, 0);
  assert.equal(templateModifiers(meta, { ...normal, diff: 'ronin' }, true).precision, undefined);
  assert.equal(templateModifiers(meta, normal, false).precision, undefined);
  assert.equal(templatePowers(meta, normal, false).shrineRerolls, 0);
  assert.equal(parseMeta(JSON.parse(JSON.stringify(meta))).upgrades.precision, 3);
});
test('Pilgrim applies before currency settlement and does not alter wave rewards or duplicate payouts', () => {
  const ledger = createRunRewardLedger(),
    meta = parseMeta(null);
  accrueRunReward(ledger, 'kill', { pilgrim: true });
  assert.equal(ledger.pending, 38);
  accrueRunReward(ledger, 'boss', { pilgrim: true, emberBonus: 0.1 });
  assert.equal(ledger.pending, 38 + 2063);
  accrueRunReward(ledger, 'wave', { pilgrim: true });
  assert.equal(ledger.pending, 2351);
  const settled = settleRunReward(meta, ledger);
  assert.equal(settled.gained, 23);
  assert.equal(meta.emberRemainder, 51);
  assert.equal(settleRunReward(meta, ledger), settled);
  accrueRunReward(ledger, 'boss', { pilgrim: true });
  assert.equal(ledger.pending, 2351);
});
test('speed scoring decreases with elapsed opening time, independently of perfect windows', () => {
  assert.equal(swiftSlashPoints(0, 1), 900);
  assert.equal(swiftSlashPoints(0.5, 1), 510);
  assert.equal(swiftSlashPoints(1, 1), 120);
  assert.equal(swiftSlashPoints(8, 1), 120);
  assert.equal(swiftSlashPoints(-1, 1), 900);
  assert.ok(precisionZone(0.78, 0.04, 0.15) < precisionZone(0.78, 0.04, 0));
});
test('Duel Master accelerates each exchange and respects its final readable floor', () => {
  for (let i = 1; i < 20; i++)
    for (const key of ['wind', 'flash', 'stag', 'idleMin', 'idleMax'])
      assert.ok(duelMasterTimings(i)[key] < duelMasterTimings(i - 1)[key]);
  assert.ok(duelMasterTimings(19).flash >= 0.23);
  assert.deepEqual(duelMasterTimings(100), duelMasterTimings(20));
});
test('combat haptics prioritize damage and parry, scale pulses and stop without queues', () => {
  let time = 0,
    enabled = true,
    strength = 'full';
  const patterns = [];
  const h = createCombatHaptics(
    () => enabled,
    () => strength,
    (p) => patterns.push(p),
    () => time,
  );
  h.play('slice');
  h.play('slice');
  h.play('parry');
  h.play('damage');
  h.play('slice');
  assert.deepEqual(patterns, [45, [16, 35, 16], [70, 25, 45]]);
  h.stop();
  assert.equal(patterns.at(-1), 0);
  strength = 'light';
  h.play('slice');
  assert.equal(patterns.at(-1), 20);
  time = 500;
  enabled = false;
  h.play('damage');
  assert.equal(patterns.length, 5);
  assert.equal(parseSettings({ version: 1, vibration: false }).vibration, false);
  assert.equal(
    parseSettings({ version: 1, vibrationStrength: 'invalid' }).vibrationStrength,
    'full',
  );
});
test('mastery unlock predicates use validated lifetime and best-run statistics', () => {
  const items = createItems(() => new Set());
  const stats = parseStatistics({ kills: 1000, duels: 50, bestRunPerfects: 100 });
  for (const id of ['falling-leaves', 'ember-ash', 'ink-wash', 'pilgrims-bead'])
    assert.equal(items.find((i) => i.id === id).ok(stats), true);
  const fresh = parseStatistics({ bestRunPerfects: '100' });
  assert.equal(items.find((i) => i.id === 'ink-wash').ok(fresh), false);
});
