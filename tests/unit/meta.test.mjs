import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMeta,
  purchaseUpgrade,
  templateModifiers,
  rewardCurrency,
  unlockBossMilestone,
  pendingModeReveals,
  markModeRevealsSeen,
  sanitizeSetup,
  EMPTY_UPGRADES,
  TEMPLATE_UPGRADES,
  templatePowers,
} from '../../src/game/progression/meta.ts';

const normal = { mode: 'waves', diff: 'normal', arrows: true, lives: '3' };

test('fresh and legacy profiles migrate without inferring progress from present metadata', () => {
  assert.equal(parseMeta(null).tutorial, 'new');
  for (const key of ['runs', 'duels', 'bestWave']) {
    const meta = parseMeta(undefined, { [key]: 1 });
    assert.equal(meta.bossMilestone, 3);
    assert.equal(meta.revealSeen, 3);
    assert.equal(meta.tutorial, 'skipped');
  }
  assert.equal(parseMeta({}, { runs: 100 }).bossMilestone, 0);
  assert.equal(parseMeta(undefined, { runs: -1 }).bossMilestone, 0);
});

test('metadata rejects fractional, negative and nonfinite fields and caps valid integers', () => {
  const meta = parseMeta({
    embers: Infinity,
    earned: -1,
    upgrades: { focus: 1.2, vitality: 99, offerings: '1' },
    bossMilestone: 2,
    revealSeen: 3,
  });
  assert.equal(meta.embers, 0);
  assert.equal(meta.earned, 0);
  assert.deepEqual(meta.upgrades, { ...EMPTY_UPGRADES, vitality: 2 });
  assert.equal(meta.revealSeen, 2);
  assert.equal(parseMeta({ embers: 2_000_000_000 }).embers, 1_000_000_000);
});

test('earning, purchasing and reloading preserves balance and permanent ranks', () => {
  const meta = parseMeta(null);
  for (let i = 0; i < 3; i++) rewardCurrency(meta, 'boss');
  assert.equal(purchaseUpgrade(meta, 'focus'), true);
  assert.equal(meta.embers, 0);
  assert.equal(purchaseUpgrade(meta, 'focus'), false);
  assert.equal(purchaseUpgrade(meta, '__proto__'), false);
  const loaded = parseMeta(JSON.parse(JSON.stringify(meta)));
  assert.equal(loaded.upgrades.focus, 1);
  assert.equal(loaded.earned, 75);
  assert.deepEqual(templateModifiers(loaded, normal), { lives: 0, parry: 1.05, shrineN: 0 });
});

test('rank costs are charged once and challenge settings exclude permanent power', () => {
  const meta = parseMeta({ embers: 1000 });
  for (const id of ['vitality', 'focus', 'focus', 'focus', 'offerings'])
    assert.equal(purchaseUpgrade(meta, id), true);
  assert.equal(meta.embers, 300);
  assert.equal(purchaseUpgrade(meta, 'focus'), false);
  assert.equal(meta.embers, 300);
  assert.deepEqual(templateModifiers(meta, normal), { lives: 1, parry: 1.15, shrineN: 4 });
  for (const variant of [
    { mode: 'rush' },
    { diff: 'ronin' },
    { arrows: false },
    { lives: 'zen' },
    { lives: '0' },
    { upgrades: false },
  ]) {
    assert.deepEqual(templateModifiers(meta, { ...normal, ...variant }), {
      lives: 0,
      parry: 1,
      shrineN: 0,
    });
  }
});

test('expanded ranks migrate once and existing awakenings retain access', () => {
  const migrated = parseMeta({ upgrades: { vitality: 1 } }, {}, new Set(['steel+']));
  assert.equal(migrated.schemaVersion, 4);
  assert.equal(migrated.upgrades.vitality, 2);
  assert.equal(migrated.upgrades.awakening, 2);
  assert.deepEqual(parseMeta(JSON.parse(JSON.stringify(migrated))), migrated);
  assert.equal(parseMeta({ schemaVersion: 2, upgrades: { vitality: 1 } }).upgrades.vitality, 1);
  assert.equal(parseMeta(null, {}, new Set(['steel'])).upgrades.awakening, 0);
  const reset = { ...migrated, upgrades: { ...migrated.upgrades, awakening: 0 } };
  assert.equal(parseMeta(reset, {}, new Set(['steel+'])).upgrades.awakening, 0);
});

test('awakening purchases split weapons and outfits and preserve old combined access once', () => {
  const meta = parseMeta({ schemaVersion: 3, embers: 500 });
  assert.equal(purchaseUpgrade(meta, 'awakening'), true);
  assert.equal(meta.upgrades.awakening, 1);
  assert.equal(meta.embers, 300);
  assert.equal(parseMeta(meta).upgrades.awakening, 1);
  assert.equal(purchaseUpgrade(meta, 'awakening'), true);
  assert.equal(meta.upgrades.awakening, 2);
  assert.equal(meta.embers, 0);
  assert.equal(purchaseUpgrade(meta, 'awakening'), false);
  assert.equal(parseMeta({ schemaVersion: 2, upgrades: { awakening: 1 } }).upgrades.awakening, 2);
  assert.equal(
    parseMeta({ schemaVersion: 2, upgrades: { awakening: 0 } }, {}, new Set(['sumi+'])).upgrades
      .awakening,
    0,
  );
});

test('seven upgrade catalog includes unified knives and enforces maximum ranks', () => {
  const meta = parseMeta({ embers: 10000 });
  assert.equal(TEMPLATE_UPGRADES.length, 7);
  assert.equal(purchaseUpgrade(meta, 'pouch'), false);
  assert.equal(meta.embers, 10000);
  for (const upgrade of TEMPLATE_UPGRADES) {
    for (let rank = 0; rank < upgrade.maxRank; rank++) {
      const before = meta.embers;
      assert.equal(purchaseUpgrade(meta, upgrade.id), true);
      assert.equal(meta.embers, before - upgrade.costs[rank]);
    }
    assert.equal(purchaseUpgrade(meta, upgrade.id), false);
  }
  assert.deepEqual(templatePowers(meta, normal), { knives: 3, composure: 2, recoveryEvery: 3 });
  assert.equal(templateModifiers(meta, normal).lives, 3);
  assert.deepEqual(templatePowers(meta, { ...normal, upgrades: false }), {
    knives: 0,
    composure: 0,
    recoveryEvery: 0,
  });
  assert.equal(meta.upgrades.vitality, 3);
});

test('orphaned pouch ranks grant no knife and recovery rank one needs six waves', () => {
  const meta = parseMeta({ schemaVersion: 2, upgrades: { pouch: 2, recovery: 1 } });
  assert.deepEqual(templatePowers(meta, normal), { knives: 0, composure: 0, recoveryEvery: 6 });
});

test('eligible rewards exclude tutorial, Zen and testing and saturate safely', () => {
  const meta = parseMeta(null);
  assert.equal(rewardCurrency(meta, 'kill'), 1);
  assert.equal(rewardCurrency(meta, 'wave'), 5);
  assert.equal(rewardCurrency(meta, 'boss'), 25);
  for (const context of [{ zen: true }, { tutorial: true }, { testing: true }])
    assert.equal(rewardCurrency(meta, 'boss', context), 0);
  assert.equal(meta.embers, 31);
  assert.equal(meta.earned, 31);
  meta.embers = 999_999_999;
  assert.equal(rewardCurrency(meta, 'boss'), 1);
  assert.equal(meta.embers, 1_000_000_000);
});

test('boss positions unlock modes once and reveal state survives reload', () => {
  let meta = parseMeta(null);
  const locked = { mode: 'rush', diff: 'ronin', arrows: false, lives: '3' };
  assert.deepEqual(sanitizeSetup(locked, meta), normal);
  assert.equal(unlockBossMilestone(meta, 1, { ...normal, mode: 'rush' }), false);
  assert.equal(unlockBossMilestone(meta, 1, normal), true);
  assert.equal(unlockBossMilestone(meta, 1, normal), false);
  assert.deepEqual(
    pendingModeReveals(meta).map((m) => m.id),
    ['rush'],
  );
  markModeRevealsSeen(meta);
  unlockBossMilestone(meta, 2, normal);
  unlockBossMilestone(meta, 3, normal);
  meta = parseMeta(JSON.parse(JSON.stringify(meta)));
  assert.deepEqual(
    pendingModeReveals(meta).map((m) => m.id),
    ['ronin', 'blade'],
  );
  assert.deepEqual(sanitizeSetup(locked, meta), locked);
  markModeRevealsSeen(meta);
  assert.deepEqual(pendingModeReveals(meta), []);
});

test('journey milestones count harder settings but exclude Zen and Boss Rush', () => {
  for (const variant of [{ diff: 'ronin' }, { arrows: false }, { lives: '0' }]) {
    const meta = parseMeta(null);
    assert.equal(unlockBossMilestone(meta, 2, { ...normal, ...variant }), true);
    assert.equal(meta.bossMilestone, 2);
  }
  for (const variant of [{ mode: 'rush' }, { lives: 'zen' }]) {
    const meta = parseMeta(null);
    assert.equal(unlockBossMilestone(meta, 3, { ...normal, ...variant }), false);
    assert.equal(meta.bossMilestone, 0);
  }
});
