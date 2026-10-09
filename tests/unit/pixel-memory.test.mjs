import test from 'node:test';
import assert from 'node:assert/strict';
import { createPixelMemory, rgbaMipBytes } from '../../src/platform/pixel-memory.ts';
import { composedLayerBytes } from '../../src/rendering/environment/worker-types.ts';
import { texturePixelBytes, rendererGpuMemory } from '../../src/rendering/pixi/gpu-memory.ts';

test('GPU accounting includes shared HDR/filter targets and stencil without allocating textures', () => {
  const rgba = {
    pixelWidth: 10,
    pixelHeight: 20,
    format: 'rgba8unorm',
    autoGenerateMipmaps: false,
  };
  const hdr = { ...rgba, format: 'rgba16float' };
  const renderer = {
    texture: { managedTextures: [rgba, hdr, hdr, null] },
    renderTarget: {
      _gpuRenderTargetHash: {
        live: {
          width: 10,
          height: 20,
          depthStencilRenderBuffer: {},
          msaa: false,
          msaaRenderBuffer: [],
        },
        retired: null,
      },
    },
  };
  assert.deepEqual(rendererGpuMemory(renderer), {
    sources: 2,
    textureBytes: 2400,
    renderbufferBytes: 800,
    bytes: 3200,
  });
  assert.equal(texturePixelBytes('rgba32float'), 16);
  assert.equal(texturePixelBytes('depth32float-stencil8'), 8);
  assert.equal(texturePixelBytes('r8unorm'), 1);
  renderer.renderTarget._gpuRenderTargetHash.live.msaa = true;
  renderer.renderTarget._gpuRenderTargetHash.live.msaaRenderBuffer = [{}];
  renderer.renderTarget._renderSurfaceToRenderTargetHash = new Map([
    [rgba, { uid: 'live', colorAttachments: [{ texture: rgba }] }],
  ]);
  assert.equal(
    rendererGpuMemory(renderer).renderbufferBytes,
    6400,
    'RGBA8 four-sample colour and DEPTH24_STENCIL8 storage',
  );
  renderer.texture.managedTextures = [];
  renderer.renderTarget._gpuRenderTargetHash = {};
  assert.equal(rendererGpuMemory(renderer).bytes, 0);
});

test('pixel accounting shares identities and follows decoding, resizing and release', () => {
  const memory = createPixelMemory();
  const image = { width: 10, height: 20, naturalWidth: 0, naturalHeight: 0 };
  const canvas = { width: 10, height: 20 };
  memory.track(image, 'decoded');
  memory.track(image, 'decoded');
  memory.track(canvas, 'canvas');
  assert.equal(memory.snapshot().decodedBytes, 0, 'CSS size is not decoded memory');
  assert.equal(memory.snapshot().canvasBytes, 800);
  image.naturalWidth = 30;
  image.naturalHeight = 40;
  canvas.width = 50;
  assert.equal(memory.snapshot().decodedBytes, 4800);
  assert.equal(memory.snapshot().decoded, 1);
  assert.equal(memory.snapshot().canvasBytes, 4000);
  image.naturalWidth = image.naturalHeight = canvas.width = canvas.height = 0;
  assert.equal(memory.snapshot().decodedBytes + memory.snapshot().canvasBytes, 0);
});

test('GPU consumers count independently, with exact odd and rectangular mip chains', () => {
  const memory = createPixelMemory();
  const a = { memorySnapshot: { sources: 1, bytes: rgbaMipBytes(3, 5, true) } };
  const b = { memorySnapshot: { sources: 1, bytes: rgbaMipBytes(8, 1, true) } };
  assert.equal(a.memorySnapshot.bytes, 72);
  assert.equal(b.memorySnapshot.bytes, 60);
  assert.equal(rgbaMipBytes(0, 0, true), 0);
  memory.trackGpu(a);
  memory.trackGpu(a);
  memory.trackGpu(b);
  assert.equal(memory.snapshot().gpuBytes, 132);
  assert.equal(memory.snapshot().gpuSources, 2);
  a.memorySnapshot = b.memorySnapshot = { sources: 0, bytes: 0 };
  assert.equal(memory.snapshot().gpuBytes, 0);
});

test('transferred planes count actual dimensions and share duplicate bitmap references', () => {
  const colour = { width: 10, height: 20 };
  const normal = { width: 10, height: 20 };
  const foreground = { width: 5, height: 20 };
  assert.equal(
    composedLayerBytes([
      { colour, normal },
      { colour: foreground, normal },
    ]),
    2000,
  );
  colour.width = normal.width = foreground.width = 0;
  assert.equal(composedLayerBytes([{ colour, normal }, { colour: foreground }]), 0);
});
