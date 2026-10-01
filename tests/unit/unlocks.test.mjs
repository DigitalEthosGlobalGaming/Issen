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
  const awakening = { access: true, progress: { version: 1, blades: stats.bl, robes: {} } };
  const receive = (id, notice) => {
    assert.equal(unlocked.has(id), true);
    events.push({ id, notice });
  };
  unlockEligibleItems(stats, unlocked, items, receive, awakening);
  assert.equal(events.length, 0);
  stats.bl.steel.k = 200;
  unlockEligibleItems(stats, unlocked, items, receive, awakening);
  unlockEligibleItems(stats, unlocked, items, receive, awakening);
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

test('dependent unlocks settle even when a prerequisite appears later in the catalog', () => {
  const stats = structuredClone(STAT0);
  const unlocked = new Set();
  const first = { id: 'first', type: 'crest', k: '一', n: 'First', f: '', ok: () => true };
  const second = { ...first, id: 'second', ok: () => unlocked.has('first') };
  const events = [];
  unlockEligibleItems(stats, unlocked, [second, first], (id) => events.push(id));
  assert.deepEqual(events, ['first', 'second']);
  unlockEligibleItems(stats, unlocked, [second, first], (id) => events.push(id));
  assert.deepEqual(events, ['first', 'second']);
});

test('callback revocation cannot repeatedly grant the same item', () => {
  const stats = structuredClone(STAT0);
  const unlocked = new Set();
  const item = { id: 'revoked', type: 'crest', k: '一', n: 'Revoked', f: '', ok: () => true };
  const events = [];
  unlockEligibleItems(stats, unlocked, [item], (id) => {
    events.push(id);
    unlocked.delete(id);
  });
  assert.deepEqual(events, ['revoked']);
  assert.equal(unlocked.has('revoked'), false);
});

test('every secret predicate grants exactly once after its recorded trigger', () => {
  const cases = [
    [
      'koken',
      (s) => {
        s.konami = 1;
      },
    ],
    [
      'pan',
      (s) => {
        s.deaths.early = 5;
      },
    ],
    [
      'scarecrow',
      (s) => {
        s.scarecrow = 1;
      },
    ],
    [
      'tanuki',
      (s) => {
        s.feinted = 3;
      },
    ],
    [
      'kagami',
      (s) => {
        s.mirrorClean = 1;
      },
    ],
    [
      'omikuji',
      (s) => {
        s.omikuji = 1;
      },
    ],
    [
      'mystic-rock',
      (s) => {
        s.cinematicVisits = 1;
      },
    ],
    [
      'fireworks',
      (s) => {
        s.midnight = 1;
      },
    ],
    [
      'confetti',
      (s) => {
        s.applause = 1;
      },
    ],
    [
      'duck',
      (s) => {
        s.fidget = 1;
      },
    ],
  ];
  const unlocked = new Set();
  const items = createItems(() => unlocked).filter((item) => item.hidden);
  assert.deepEqual(
    items.map((item) => item.id),
    cases.map(([id]) => id),
  );
  const stats = structuredClone(STAT0);
  const notices = [];
  unlockEligibleItems(stats, unlocked, items, (id) => notices.push(id));
  assert.deepEqual(notices, []);
  for (const [id, trigger] of cases) {
    trigger(stats);
    unlockEligibleItems(stats, unlocked, items, (granted) => notices.push(granted));
    assert.equal(notices.at(-1), id);
    assert.equal(notices.filter((granted) => granted === id).length, 1);
  }
  assert.deepEqual(
    notices,
    cases.map(([id]) => id),
  );
});
