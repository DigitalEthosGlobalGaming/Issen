import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtworkPreloader } from '../../src/platform/artwork-preload.ts';

function harness() {
  const images = [];
  const progress = [];
  const create = () => {
    let decode;
    const decoded = new Promise((resolve, reject) => {
      decode = { resolve, reject };
    });
    const image = {
      naturalWidth: 10,
      naturalHeight: 10,
      decode: () => decoded,
      removeAttribute() {
        this.removed = true;
      },
      decoded: decode,
    };
    images.push(image);
    return image;
  };
  return {
    images,
    progress,
    loader: createArtworkPreloader(['a', 'a', 'b'], create, (p) => progress.push(p)),
  };
}
test('startup waits for load and decode, deduplicating sources', async () => {
  const { images, progress, loader } = harness();
  const run = loader.run();
  assert.equal(loader.run(), run);
  assert.equal(images.length, 2);
  images[0].onload();
  images[1].onload();
  assert.equal(progress.at(-1).loaded, 0);
  images[0].decoded.resolve();
  await Promise.resolve();
  assert.equal(progress.at(-1).loaded, 1);
  images[1].decoded.resolve();
  assert.equal(await run, true);
  assert.equal(await loader.run(), true);
  assert.equal(images.length, 2);
  loader.dispose();
});
test('load/decode failures block completion and retry only failed images', async () => {
  const { images, loader } = harness();
  const first = loader.run();
  images[0].onload();
  images[0].decoded.resolve();
  images[1].onerror();
  assert.equal(await first, false);
  const retry = loader.run();
  assert.equal(images.length, 3);
  assert.equal(images[2].src, 'b');
  images[2].onload();
  images[2].decoded.reject(new Error('bad image'));
  assert.equal(await retry, false);
  const final = loader.run();
  images[3].onload();
  images[3].decoded.resolve();
  assert.equal(await final, true);
  loader.dispose();
});
test('disposal settles outstanding load and decode without publishing late progress', async () => {
  const { images, progress, loader } = harness();
  const run = loader.run();
  images[0].onload();
  loader.dispose();
  const count = progress.length;
  images[0].decoded.resolve();
  assert.equal(await run, false);
  assert.equal(await loader.run(), false);
  assert.equal(progress.length, count);
  assert.ok(images.every((image) => image.removed));
});
