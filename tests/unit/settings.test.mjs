import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSettings,
  parseSettings,
  assignBinding,
  preferenceEnabled,
  sensitivityScale,
} from '../../src/platform/settings.ts';
import { createHaptics } from '../../src/platform/haptics.ts';
import { preferredDensity } from '../../src/rendering/effects/quality.ts';

test('legacy mute migrates and invalid settings retain safe defaults', () => {
  for (const raw of [null, [], 'bad', { version: 2, muted: false }])
    assert.equal(parseSettings(raw, true).muted, true);
  const parsed = parseSettings(
    {
      version: 1,
      effectsVolume: -5,
      ambienceVolume: 9,
      reducedMotion: 'maybe',
      quality: 'extreme',
      vibration: 'false',
      muted: false,
    },
    true,
  );
  assert.equal(parsed.muted, false);
  assert.equal(parsed.effectsVolume, 0);
  assert.equal(parsed.ambienceVolume, 1);
  assert.equal(parsed.reducedMotion, 'system');
  assert.equal(parsed.quality, 'auto');
  assert.equal(parsed.vibration, true);
  assert.equal(parseSettings({ version: 1, effectsVolume: NaN }).effectsVolume, 1);
});
test('conflicting and incomplete saved bindings fall back; complete remaps survive reload', () => {
  const settings = defaultSettings();
  assert.match(assignBinding(settings, 'up', 'd'), /already used/);
  assert.match(assignBinding(settings, 'up', 'Escape'), /reserved/);
  assert.match(assignBinding(settings, 'up', 'Enter'), /reserved/);
  assert.match(assignBinding(settings, 'up', 'Tab'), /reserved/);
  assert.equal(assignBinding(settings, 'up', 'I'), null);
  assert.deepEqual(parseSettings(settings).bindings.up, ['i']);
  const conflict = structuredClone(settings);
  conflict.bindings.down = ['i'];
  assert.deepEqual(parseSettings(conflict).bindings, defaultSettings().bindings);
  assert.deepEqual(
    parseSettings({ version: 1, bindings: { up: ['i'] } }).bindings,
    defaultSettings().bindings,
  );
  const other = defaultSettings();
  settings.bindings.left[0] = 'z';
  assert.deepEqual(other.bindings.left, ['ArrowLeft', 'a']);
});
test('presentation and sensitivity preferences do not require changing combat settings', () => {
  assert.equal(preferenceEnabled('system', true), true);
  assert.equal(preferenceEnabled('off', true), false);
  assert.equal(preferenceEnabled('on', false), true);
  assert.equal(sensitivityScale('normal'), 1);
  assert.ok(sensitivityScale('high') < 1 && sensitivityScale('low') > 1);
  assert.equal(preferredDensity('low', 1), 0.3);
  assert.equal(preferredDensity('high', 0.3), 1);
  assert.equal(preferredDensity('auto', 0.6), 0.6);
  assert.equal(preferredDensity('high', 1, true), 0.3);
});
test('disabled vibration never calls the optional browser capability', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const calls = [];
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { vibrate: (pattern) => calls.push(pattern) },
  });
  try {
    let enabled = false;
    const buzz = createHaptics(() => enabled);
    buzz(12);
    enabled = true;
    buzz([10, 20, 10]);
    enabled = false;
    buzz(30);
    assert.deepEqual(calls, [[10, 20, 10]]);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous);
    else delete globalThis.navigator;
  }
});

test('scene renderer defaults to ink and preserves explicit saved preferences', () => {
  assert.equal(defaultSettings().renderer, 'ink');
  assert.equal(parseSettings({ version: 1 }).renderer, 'ink');
  assert.equal(parseSettings({ version: 1, renderer: 'unknown' }).renderer, 'ink');
  assert.equal(parseSettings({ ...defaultSettings(), renderer: 'ink' }).renderer, 'ink');
});

test('single artwork preference migrates the former character setting only as a fallback', () => {
  assert.equal('characterRenderer' in defaultSettings(), false);
  for (const renderer of ['classic', 'ink']) {
    for (const characterRenderer of ['classic', 'ink']) {
      const loaded = parseSettings({ version: 1, renderer, characterRenderer });
      assert.equal(loaded.renderer, renderer, 'valid Artwork setting takes precedence');
      assert.equal('characterRenderer' in loaded, false);
      assert.deepEqual(loaded.bindings, defaultSettings().bindings);
    }
  }
  for (const renderer of [undefined, null, 'invalid', true]) {
    assert.equal(parseSettings({ version: 1, renderer, characterRenderer: 'ink' }).renderer, 'ink');
    assert.equal(
      parseSettings({ version: 1, renderer, characterRenderer: 'classic' }).renderer,
      'classic',
    );
    assert.equal(
      parseSettings({ version: 1, renderer, characterRenderer: 'invalid' }).renderer,
      'ink',
    );
  }
  const migrated = parseSettings({ version: 1, characterRenderer: 'ink' });
  assert.equal(parseSettings(JSON.parse(JSON.stringify(migrated))).renderer, 'ink');
});
