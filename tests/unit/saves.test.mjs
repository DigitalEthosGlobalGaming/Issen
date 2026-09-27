import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStatistics, parseSetup, parseEquipment } from '../../src/platform/saves.ts';
import { createItems } from '../../src/game/content/items.ts';

test('old save records preserve progress and fill new counters', () => {
  const stats = parseStatistics(
    {
      kills: 42,
      bestScore: 100,
      bl: { steel: { k: 30 } },
      rec: { normal: { score: 100 } },
      deaths: { late: 3 },
    },
    200,
  );
  assert.equal(stats.kills, 42);
  assert.equal(stats.bestScore, 200);
  assert.deepEqual(stats.bl.steel, { k: 30, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
  assert.deepEqual(stats.rec.normal, { score: 100, combo: 0, wave: 0 });
  assert.equal(stats.deaths.late, 3);
  stats.deaths.late = 100;
  assert.deepEqual(parseStatistics(null).deaths, {});
});

test('malformed save fields cannot corrupt counters or setup', () => {
  const stats = parseStatistics({
    kills: '42',
    time: -2,
    bestScore: Infinity,
    deaths: { late: '3' },
    bl: null,
    rec: [],
  });
  assert.equal(stats.kills, 0);
  assert.equal(stats.time, 0);
  assert.equal(stats.bestScore, 0);
  assert.deepEqual(stats.deaths, {});
  assert.deepEqual(parseSetup({ mode: 'unknown', diff: null, arrows: 'false', lives: 0 }), {
    mode: 'waves',
    diff: 'normal',
    arrows: true,
    lives: '3',
  });
  assert.deepEqual(parseSetup({ mode: 'rush', diff: 'ronin', arrows: false, lives: 'zen' }), {
    mode: 'rush',
    diff: 'ronin',
    arrows: false,
    lives: 'zen',
  });
});

test('equipment must be unlocked and belong to its saved category', () => {
  const unlocks = new Set(['kuro', 'sumi', 'steel']);
  const items = createItems(() => unlocks);
  const equipment = parseEquipment(
    { blade: 'kuro', robe: 'kuro', charm: 'daruma' },
    unlocks,
    items,
  );
  assert.equal(equipment.blade, 'kuro');
  assert.equal(equipment.robe, 'sumi');
  assert.equal(equipment.charm, 'nocharm');
});

test('catalog unlock dependencies follow current progress', () => {
  const unlocks = new Set();
  const items = createItems(() => unlocks);
  const stats = parseStatistics({ duels: 1 });
  assert.equal(items.find((item) => item.id === 'kuro').ok(stats), true);
  const foxfire = items.find((item) => item.id === 'kitsunebi');
  assert.equal(foxfire.ok(stats), false);
  unlocks.add('kitsune');
  assert.equal(foxfire.ok(stats), true);
});
