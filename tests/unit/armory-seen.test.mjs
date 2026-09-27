import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseArmorySeen,
  isNewArmoryItem,
  markArmoryItemViewed,
} from '../../src/game/progression/armory-seen.ts';

const blade = { id: 'steel' };

test('legacy owned equipment starts seen but new profile saves remain explicit', () => {
  const owned = new Set(['steel', 'steel+']);
  assert.deepEqual(parseArmorySeen(null, owned), owned);
  assert.deepEqual(parseArmorySeen([], owned), new Set());
  assert.deepEqual(parseArmorySeen(['steel', 4, 'steel+'], owned), owned);
});

test('new base and awakened forms mark the relevant tile until viewed', () => {
  const owned = new Set(['steel']);
  const seen = parseArmorySeen([], owned);
  assert.equal(isNewArmoryItem(blade, owned, seen), true);
  assert.equal(markArmoryItemViewed('steel', owned, seen), true);
  assert.equal(isNewArmoryItem(blade, owned, seen), false);
  owned.add('steel+');
  assert.equal(isNewArmoryItem(blade, owned, seen), true);
  assert.equal(markArmoryItemViewed('steel', owned, seen), true);
  assert.equal(isNewArmoryItem(blade, owned, seen), false);
  assert.equal(markArmoryItemViewed('steel', owned, seen), false);
});
