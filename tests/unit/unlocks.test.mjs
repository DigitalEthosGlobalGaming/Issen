import test from 'node:test';
import assert from 'node:assert/strict';
import { unlockEligibleItems } from '../../src/game/progression/unlocks.ts';
import { STAT0 } from '../../src/game/progression/statistics.ts';
import { createItems } from '../../src/game/content/items.ts';

test('awakening thresholds grant once and publish the updated set before notification', () => {
  const stats = structuredClone(STAT0);
  stats.bl.steel = { k: 199, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 };
  const unlocked = new Set(['steel']);
  const items = createItems(() => unlocked).filter((item) => item.id === 'steel');
  const events = [];
  const receive = (id, notice) => {
    assert.equal(unlocked.has(id), true);
    events.push({ id, notice });
  };
  unlockEligibleItems(stats, unlocked, items, receive);
  assert.equal(events.length, 0);
  stats.bl.steel.k = 200;
  unlockEligibleItems(stats, unlocked, items, receive);
  unlockEligibleItems(stats, unlocked, items, receive);
  assert.deepEqual(events, [
    { id: 'steel+', notice: { k: '真', n: 'Tamahagane awakened', type: 'blade' } },
  ]);
});

test('catalog order allows a later item to depend on a newly unlocked item', () => {
  const stats = structuredClone(STAT0);
  const unlocked = new Set();
  const first = { id: 'first', type: 'crest', k: '一', n: 'First', f: '', ok: () => true };
  const second = { ...first, id: 'second', ok: () => unlocked.has('first') };
  const events = [];
  unlockEligibleItems(stats, unlocked, [first, second], (id) => events.push(id));
  assert.deepEqual(events, ['first', 'second']);
  assert.deepEqual([...unlocked], events);
});
