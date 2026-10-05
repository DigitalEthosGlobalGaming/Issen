import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { options, allScenarios } from './config.mjs';
import { stats, comparison } from './report.mjs';
import { instrumentRuntime } from './build-plugin.mjs';
import { checkState, checkPresentation } from './scenarios.mjs';
import { androidPreflight } from './targets.mjs';

test('Android requires explicit authorised device and verifies emulator identity', () => {
  const execute = (_file, args) =>
    args[0] === 'devices'
      ? 'List of devices attached\nemulator-5554   device product:test\nphone\tunauthorized\n'
      : args.includes('ro.kernel.qemu')
        ? '1'
        : 'fixture';
  assert.throws(() => androidPreflight({ target: 'emulator' }, execute), /explicit/);
  assert.throws(
    () => androidPreflight({ target: 'emulator', device: 'phone' }, execute),
    /authorised/,
  );
  assert.throws(
    () => androidPreflight({ target: 'android-device', device: 'emulator-5554' }, execute),
    /match/,
  );
  assert.equal(
    androidPreflight({ target: 'emulator', device: 'emulator-5554' }, execute).metadata.emulator,
    true,
  );
});

test('CLI rejects misspelled scenarios and unsafe measurement configuration', () => {
  for (const args of [
    ['--scenario=combta'],
    ['--repeats=0'],
    ['--duration=-2'],
    ['--dpr=NaN'],
    ['--target=phone'],
    ['--port=1'],
    ['--viewport=x'],
    ['--typo'],
  ])
    assert.throws(() => options(args));
  assert.deepEqual(options([]).scenarios, allScenarios);
  assert.deepEqual(options(['--scenario=combat,combat']).scenarios, ['combat']);
});
test('statistics distinguish absent callbacks from zero-time work', () => {
  assert.equal(stats([]).median, null);
  assert.equal(stats([0, 0]).median, 0);
  assert.equal(stats([4, 1, 3, 2]).median, 2.5);
  assert.equal(stats([4, 1, 3, 2]).p95, 4);
});
test('baseline comparison refuses changed conditions and failed baselines', () => {
  const a = { manifest: { target: 'web', dpr: 2 }, samples: [], status: 'passed' };
  assert.deepEqual(comparison(a, a), []);
  assert.throws(() => comparison(a, { ...a, manifest: { ...a.manifest, dpr: 1 } }), /dpr/);
  assert.throws(() => comparison(a, { ...a, status: 'failed' }), /completed/);
});
test('test-only runtime transform fails loudly if application anchors drift', () => {
  const source = readFileSync(new URL('../../src/game.ts', import.meta.url), 'utf8').replaceAll(
    '\r\n',
    '\n',
  );
  const transformed = instrumentRuntime(source);
  assert.match(transformed.code, /schemaVersion = 1/);
  assert.match(transformed.code, /__profile.openPanel|openPanel, closePanel/);
  assert.ok(transformed.map.mappings.length > 0);
  assert.throws(
    () => instrumentRuntime(source.replace('if (pageActive()) frameLoop.start();', '')),
    /anchor changed/,
  );
  const config = readFileSync(new URL('../../vite.config.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(config, /performancePlugin|tests\/performance/);
});
test('scenario invariants detect stress drift, dead runs and inactive simulation', () => {
  assert.throws(
    () => checkState('stress-100', { enemies: 100 }, { enemies: 99, kills: 0 }),
    /Stress/,
  );
  assert.throws(() => checkState('combat', {}, { state: 'dead' }), /unexpectedly/);
  assert.throws(() => checkState('inactive-combat', { time: 1 }, { time: 2 }), /advanced/);
  checkState('stress-100', { enemies: 100 }, { enemies: 100, kills: 0 });
  assert.throws(
    () => checkState('scene-transitions', { transitions: 2 }, { transitions: 2 }),
    /did not change scenery/,
  );
  checkState('scene-transitions', { transitions: 2 }, { transitions: 3 });
  assert.throws(
    () => checkState('cinematic-transitions', {}, { renderedScenes: [0, 1] }),
    /did not render/,
  );
  checkState(
    'cinematic-transitions',
    {},
    { renderedScenes: Array.from({ length: 10 }, (_, i) => i) },
  );
});

test('presentation guards accept settled snapshots but require animated scenes and previews', () => {
  const initial = { time: 1 };
  const sample = { renders: [], updates: [], previews: [], state: initial };
  checkPresentation('stats', initial, sample);
  assert.throws(() => checkPresentation('title', initial, sample), /Animated/);
  assert.throws(() => checkPresentation('armoury', initial, sample), /preview stopped/);
  checkPresentation('inspection', initial, { ...sample, previews: [1] });
  assert.throws(
    () => checkPresentation('stats', initial, { ...sample, state: { time: 2 } }),
    /continued simulation/,
  );
});
