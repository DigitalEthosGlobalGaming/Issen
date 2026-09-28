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

test('waves 7–12 ease the third stage and ramp into late pressure in both modes', () => {
  const neutral = computeModifiers([], new Set());
  for (const [mode, expected] of [
    [
      'normal',
      [
        [11, 0.16, 1.65],
        [12, 0.18, 1.55],
        [13, 0.2, 1.5],
        [13, 0.2, 1.45],
        [16, 0.3, 1.32],
        [19, 0.4, 1.1],
        [22, 0.5, 0.87],
      ],
    ],
    [
      'ronin',
      [
        [15, 0.3, 1.14],
        [16, 0.28, 1.12],
        [16, 0.3, 1.08],
        [16, 0.3, 1.04],
        [18, 0.36, 0.98],
        [20, 0.43, 0.85],
        [22, 0.5, 0.72],
      ],
    ],
  ]) {
    for (let wave = 6; wave <= 12; wave++) {
      const actual = waveConfig(wave, mode, neutral);
      const [total, feint, atk] = expected[wave - 6];
      assert.equal(actual.total, total, `${mode} wave ${wave} count`);
      assert.ok(Math.abs(actual.feint - feint) < 0.0001, `${mode} wave ${wave} feints`);
      assert.ok(Math.abs(actual.atk - atk) < 0.001, `${mode} wave ${wave} attack`);
    }
  }
  const custom = computeModifiers([{ feint: 0.1, atk: 1.2, gap: 1.5 }], new Set(['calm']));
  const base = waveConfig(8, 'normal', neutral);
  const changed = waveConfig(8, 'normal', custom);
  assert.ok(Math.abs(changed.feint - 0.15) < 0.0001);
  assert.ok(Math.abs(changed.atk - base.atk * 1.2) < 0.0001);
  assert.ok(Math.abs(changed.gap - base.gap * 1.5) < 0.0001);
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
