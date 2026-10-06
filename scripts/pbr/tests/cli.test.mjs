import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { main, convertBatch, inputFiles } from '../cli.mjs';
import { loadPreset, listPresets, validatePreset } from '../preset.mjs';

const silent = { log() {}, error() {}, async cleanupArchive() {} };
async function fixture(t) {
  const dir = await mkdtemp(path.resolve('tmp/pbr-cli-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'input'),
    output = path.join(dir, 'output');
  await mkdir(input);
  await writeFile(path.join(input, 'one.png'), 'source-one');
  return { dir, input, output };
}
function fakeConverter(calls, fail) {
  return async () => ({
    async convert(source, destination, preset) {
      calls.push({ source, preset });
      if (fail?.(source)) throw new Error('conversion failed');
      const zip = Buffer.alloc(30);
      zip.set([0x50, 0x4b, 0x03, 0x04]);
      await writeFile(destination, zip);
      return { mode: preset.mode, engine: preset.engine, applied: preset.settings, skipped: [] };
    },
    async close() {
      calls.push('closed');
    },
  });
}

test('built-in presets load from JSON independently of the current directory', async () => {
  assert.deepEqual(await listPresets(), [
    'bone',
    'cloth',
    'default',
    'leather',
    'metal',
    'painted-metal',
    'polished-wood',
    'rusted-metal',
    'stone',
    'wood',
  ]);
  for (const name of await listPresets()) assert.equal((await loadPreset(name)).name, name);
  const cloth = await loadPreset('cloth');
  assert.equal(cloth.settings.normalIntensity, 0.6);
  assert.ok(cloth.settings.roughnessBase > (await loadPreset('metal')).settings.roughnessBase);
});
test('malformed presets fail before browser launch', async () => {
  const valid = await loadPreset('cloth');
  for (const [raw, pattern] of [
    [{ ...valid, settings: { typo: 1 } }, /Unknown PBR setting/],
    [{ ...valid, settings: { metallicOffset: 1 } }, /from -0.5 to 0.5/],
    [{ ...valid, settings: { normalIntensity: 0.65 } }, /increments/],
    [{ ...valid, settings: { normalIntensity: '0.6' } }, /must be a number/],
    [{ ...valid, mode: 'wrong' }, /mode must/],
    [{ ...valid, name: '../cloth' }, /name must/],
    [{ ...valid, engine: 'wrong' }, /engine must/],
  ])
    assert.throws(() => validatePreset(raw), pattern);
  await assert.rejects(
    main(['--input', 'anything', '--output', 'anything', '--mode', 'wrong'], silent),
    /mode must/,
  );
});
test('custom preset JSON and a single image are accepted; unsupported inputs fail', async (t) => {
  const { dir, input } = await fixture(t);
  const custom = path.join(dir, 'custom.pbr.json');
  await writeFile(custom, JSON.stringify({ ...(await loadPreset('cloth')), name: 'custom' }));
  assert.equal((await loadPreset(custom)).name, 'custom');
  assert.deepEqual(await inputFiles(path.join(input, 'one.png')), [path.join(input, 'one.png')]);
  await writeFile(path.join(input, 'notes.txt'), 'ignore');
  assert.equal((await inputFiles(input)).length, 1);
  await assert.rejects(inputFiles(path.join(input, 'notes.txt')), /must be PNG/);
});
test('completed exports skip, changed presets/sources regenerate, and force regenerates', async (t) => {
  const { input, output } = await fixture(t),
    calls = [];
  const dependencies = { ...silent, createConverter: fakeConverter(calls) };
  const options = { input, output, preset: await loadPreset('cloth') };
  assert.equal((await convertBatch(options, dependencies)).converted, 1);
  const before = calls.length;
  assert.equal((await convertBatch(options, dependencies)).skipped, 1);
  assert.equal(calls.length, before, 'skipping must not launch a browser');
  options.preset.settings.normalIntensity = 0.7;
  assert.equal((await convertBatch(options, dependencies)).converted, 1);
  await writeFile(path.join(input, 'one.png'), 'changed-source');
  assert.equal((await convertBatch(options, dependencies)).converted, 1);
  assert.equal((await convertBatch({ ...options, force: true }, dependencies)).converted, 1);
  const manifest = JSON.parse(
    await readFile(path.join(output, 'one.png_cloth_pbr_pack.zip.json'), 'utf8'),
  );
  assert.equal(manifest.source, 'one.png');
  assert.equal(manifest.preset.settings.normalIntensity, 0.7);
  assert.equal(
    (await readdir(output)).some((name) => name.endsWith('.partial')),
    false,
  );
});
test('failure preserves an earlier export, continues the batch and cleans partial downloads', async (t) => {
  const { input, output } = await fixture(t),
    calls = [];
  const preset = await loadPreset('cloth');
  await convertBatch(
    { input, output, preset },
    { ...silent, createConverter: fakeConverter(calls) },
  );
  const zip = path.join(output, 'one.png_cloth_pbr_pack.zip');
  const old = await readFile(zip);
  await writeFile(path.join(input, 'two.webp'), 'source-two');
  const result = await convertBatch(
    { input, output, preset, force: true },
    {
      ...silent,
      createConverter: fakeConverter(calls, (source) => source.endsWith('one.png')),
    },
  );
  assert.equal(result.failed, 1);
  assert.equal(result.converted, 1);
  assert.deepEqual(await readFile(zip), old);
  assert.equal(
    (await readdir(output)).some((name) => name.endsWith('.partial')),
    false,
  );
  assert.equal(calls.at(-1), 'closed');
});

test('CLI applies mode/engine overrides and reports conversion failure with exit code 1', async (t) => {
  const { input, output } = await fixture(t),
    calls = [];
  const args = [
    '--input',
    input,
    '--output',
    output,
    '--preset',
    'cloth',
    '--mode',
    'texture',
    '--engine',
    'directx',
  ];
  assert.equal(await main(args, { ...silent, createConverter: fakeConverter(calls) }), 0);
  assert.equal(calls[0].preset.mode, 'texture');
  assert.equal(calls[0].preset.engine, 'directx');
  assert.equal(
    await main([...args, '--force'], {
      ...silent,
      createConverter: fakeConverter([], () => true),
    }),
    1,
  );
});

test('cleanup runs on new and cached exports and a failed cleanup preserves the published pack', async (t) => {
  const { input, output } = await fixture(t),
    calls = [],
    cleaned = [];
  const options = { input, output, preset: await loadPreset('cloth') };
  const dependencies = {
    ...silent,
    createConverter: fakeConverter(calls),
    async cleanupArchive(file) {
      cleaned.push(file);
    },
  };
  assert.equal((await convertBatch(options, dependencies)).converted, 1);
  assert.match(cleaned[0], /\.partial$/);
  const destination = path.join(output, 'one.png_cloth_pbr_pack.zip');
  const prior = await readFile(destination);
  assert.equal((await convertBatch(options, dependencies)).skipped, 1);
  assert.equal(cleaned[1], destination);
  const result = await convertBatch(
    { ...options, force: true },
    {
      ...dependencies,
      async cleanupArchive() {
        throw Error('invalid material archive');
      },
    },
  );
  assert.equal(result.failed, 1);
  assert.deepEqual(await readFile(destination), prior);
  assert.equal(
    (await readdir(output)).some((name) => name.endsWith('.partial')),
    false,
  );
});
