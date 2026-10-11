import test from 'node:test';
import assert from 'node:assert/strict';
import { createTextureAdmission } from '../../src/rendering/pixi/texture-admission.ts';

const source = () => ({
  pixelWidth: 20,
  pixelHeight: 30,
  autoGenerateMipmaps: false,
  format: 'rgba8unorm',
  _gpuData: {},
});

test('unchanged pending storage avoids repeated full scans, with periodic reconciliation', () => {
  const admission = createTextureAdmission(),
    texture = source();
  assert.equal(admission.required([texture], 1, 0, 0), true);
  for (let time = 16; time < 1000; time += 16)
    assert.equal(admission.required([texture], 1, 0, time), false);
  assert.equal(admission.required([texture], 1, 0, 1000), true);
  assert.equal(admission.required([], 1, 0, 2000), true);
});

test('new sources, resized storage, formats, mipmaps and restored contexts require immediate checks', () => {
  const admission = createTextureAdmission(),
    texture = source();
  assert.equal(admission.required([texture], 1, 0, 0), true);
  texture.pixelWidth++;
  assert.equal(admission.required([texture], 1, 0, 1), true);
  texture.autoGenerateMipmaps = true;
  assert.equal(admission.required([texture], 1, 0, 2), true);
  texture.format = 'rgba16float';
  assert.equal(admission.required([texture], 1, 0, 3), true);
  assert.equal(admission.required([texture], 1, 1, 4), true);
  assert.equal(admission.required([texture, source()], 1, 1, 5), true);
});

test('residency clears pending admission so an unloaded source is checked again', () => {
  const admission = createTextureAdmission(),
    texture = source();
  assert.equal(admission.required([texture], 1, 0, 0), true);
  texture._gpuData[1] = {};
  assert.equal(admission.required([texture], 1, 0, 1), false);
  delete texture._gpuData[1];
  assert.equal(admission.required([texture], 1, 0, 2), true);
});
