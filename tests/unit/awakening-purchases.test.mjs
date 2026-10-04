import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMeta } from '../../src/game/progression/meta.ts';
import { createItems } from '../../src/game/content/items.ts';
import { parseAwakeningProgress } from '../../src/game/progression/awakening-progress.ts';
import { purchaseAwakening } from '../../src/game/progression/awakening-purchases.ts';
import { SPECIAL, STEEL_THIRD } from '../../src/game/content/awakenings.ts';
test('challenge, access, prerequisite and balance are validated before one-time purchase', () => {
  const unlocked = new Set(['steel']);
  const items = createItems(() => unlocked);
  const meta = parseMeta({ embers: 1000, upgrades: { awakening: 1 }, schemaVersion: 4 });
  const progress = parseAwakeningProgress({
    blades: { steel: { [SPECIAL.steel.need[0]]: SPECIAL.steel.need[1] - 1 } },
  });
  assert.equal(purchaseAwakening(meta, unlocked, items, progress, 'steel+'), false);
  progress.blades.steel[SPECIAL.steel.need[0]] = SPECIAL.steel.need[1];
  assert.equal(purchaseAwakening(meta, unlocked, items, progress, 'steel+'), true);
  assert.equal(meta.embers, 850);
  assert.equal(purchaseAwakening(meta, unlocked, items, progress, 'steel+'), false);
  progress.blades.steel[STEEL_THIRD.need[0]] = STEEL_THIRD.need[1];
  assert.equal(purchaseAwakening(meta, unlocked, items, progress, 'steel++'), true);
  assert.equal(meta.embers, 550);
  assert.equal(purchaseAwakening(meta, unlocked, items, progress, 'steel+++'), false);
});
