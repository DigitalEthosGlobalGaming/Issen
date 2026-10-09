import test from 'node:test';
import assert from 'node:assert/strict';
import { pendingTextureBytes } from '../../src/rendering/pixi/gpu-memory.ts';

test('pending GPU reservations deduplicate formats/mips and become residency per renderer', () => {
  const colour = {
    pixelWidth: 8,
    pixelHeight: 8,
    format: 'rgba8unorm',
    autoGenerateMipmaps: true,
    _gpuData: {},
  };
  const hdr = { pixelWidth: 4, pixelHeight: 4, format: 'rgba16float', _gpuData: {} };
  assert.equal(pendingTextureBytes([colour, colour, hdr], 1), 340 + 128);
  colour._gpuData[1] = {};
  assert.equal(pendingTextureBytes([colour, hdr], 1), 128);
  assert.equal(pendingTextureBytes([colour, hdr], 2), 468);
  hdr._gpuData[1] = {};
  assert.equal(pendingTextureBytes([colour, hdr], 1), 0);
  delete colour._gpuData[1];
  assert.equal(pendingTextureBytes([colour, hdr], 1), 340);
});
