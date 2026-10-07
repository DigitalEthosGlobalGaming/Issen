import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../src/game/events.ts';
import { bindEncounterProgression } from '../../src/game/progression/encounter-listeners.ts';
import { parseStatistics } from '../../src/platform/saves.ts';
test('encounter profile reactions resolve the current statistics object and dispose all subscriptions', () => {
  const bus = createEventBus(),
    original = parseStatistics({});
  let ST = original;
  const challenges = [],
    blade = { d: 0 };
  const off = bindEncounterProgression(bus, () => ({
    ST,
    bst: () => blade,
    challenge: (metric) => challenges.push(metric),
  }));
  bus.emit('parry', { boss: 'base', perfect: true });
  assert.equal(original.parries, 1);
  ST = parseStatistics({});
  bus.emit('bossDefeated', {
    boss: 'mirror',
    count: 6,
    clean: true,
    mirror: true,
    mode: 'ronin',
    rush: true,
    blade: true,
    bossesSlain: 4,
  });
  assert.equal(ST.duels, 1);
  assert.equal(ST.roninDuels, 1);
  assert.equal(ST.cleanDuels, 1);
  assert.equal(ST.bladeDuels, 1);
  assert.equal(ST.rushBest, 4);
  assert.equal(ST.rushBlade, 1);
  assert.equal(ST.mirrorClean, 1);
  assert.equal(original.duels, 0);
  assert.equal(blade.d, 1);
  assert.deepEqual(challenges, ['d']);
  off();
  const before = structuredClone(ST);
  bus.emit('parry', {});
  bus.emit('bossDefeated', {});
  bus.emit('standoffResolved', { won: true });
  assert.deepEqual(ST, before);
});
test('standoff defeat records no kill while success credits its own profile boundary', () => {
  const bus = createEventBus(),
    ST = parseStatistics({}),
    challenges = [];
  bindEncounterProgression(bus, () => ({
    ST,
    bst: () => null,
    challenge: (metric) => challenges.push(metric),
  }));
  bus.emit('standoffResolved', { won: false, perfect: false });
  assert.equal(ST.kills, 0);
  bus.emit('standoffResolved', { won: true, perfect: true });
  assert.equal(ST.kills, 1);
  assert.equal(ST.standoffs, 1);
  assert.deepEqual(challenges, ['k']);
});
