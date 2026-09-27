import test from 'node:test';
import assert from 'node:assert/strict';
import { waveConfig, bossParameters } from '../../src/game/encounters/configuration.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';

test('waves introduce ordered attacks and reinforcements at their existing thresholds', () => {
  const modifiers = computeModifiers([], new Set());
  assert.equal(waveConfig(1, 'normal', modifiers).pack, 3);
  assert.equal(waveConfig(2, 'normal', modifiers).ordered, false);
  assert.equal(waveConfig(3, 'normal', modifiers).ordered, true);
  assert.equal(waveConfig(3, 'normal', modifiers).refill, false);
  assert.equal(waveConfig(4, 'normal', modifiers).total, 7);
  assert.equal(waveConfig(100, 'normal', modifiers).total, 22);
  assert.equal(waveConfig(1, 'ronin', modifiers).ordered, true);
});

test('feint probability and attack speed respect bounds and equipment', () => {
  const normal = computeModifiers([], new Set());
  const custom = computeModifiers([{ feint: 100, atk: 2, gap: 1.5 }], new Set());
  assert.equal(waveConfig(1, 'normal', custom).feint, 0);
  assert.equal(waveConfig(7, 'normal', custom).feint, 0.6);
  assert.equal(waveConfig(7, 'normal', custom).atk, waveConfig(7, 'normal', normal).atk * 2);
  assert.equal(waveConfig(7, 'normal', custom).gap, waveConfig(7, 'normal', normal).gap * 1.5);
});

test('boss windows retain difficulty floors and equipment scaling', () => {
  const modifiers = computeModifiers([{ parry: 1.5, stag: 2 }], new Set());
  const late = bossParameters(100, 'normal', modifiers);
  assert.equal(late.flash, 0.26 * 1.5);
  assert.equal(late.stag, 0.75 * 2);
  assert.equal(late.wind, 0.45);
  assert.equal(late.feint, 0.45);
  assert.ok(
    bossParameters(1, 'ronin', modifiers).wind < bossParameters(1, 'normal', modifiers).wind,
  );
});
