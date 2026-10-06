import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPackedAssetStore,
  packedSpritePlacement,
} from '../../src/rendering/packed-assets.ts';

const metadata = {
  page: 0,
  frame: [2, 2, 10, 12],
  logicalSize: [20, 24],
  trim: [3, 4],
  pivot: [10, 23],
  planes: ['colour', 'normal', 'surface'],
  empty: false,
};
const manifest = {
  version: 1,
  pages: [{ size: [32, 32], maps: { colour: 'colour', normal: 'normal', surface: 'surface' } }],
  sprites: { rock: metadata, tree: { ...metadata, frame: [16, 2, 10, 12] } },
  dependencies: { a: ['rock'], b: ['tree', 'rock'], preview: ['rock'] },
};
function fixture(fail = false, catalog = manifest, options = {}) {
  const images = [];
  const doc = {
    createElement() {
      const image = {
        naturalWidth: 32,
        naturalHeight: 32,
        src: '',
        decode: async () => {
          if (fail) throw Error('decode failed');
        },
        removeAttribute: () => {
          image.src = '';
        },
      };
      images.push(image);
      return image;
    },
  };
  return { store: createPackedAssetStore(doc, catalog, (url) => url, options), images };
}
test('scene selections can mix source families and retain canonical pages across A-B-A', async () => {
  const catalog = {
    ...manifest,
    pages: [
      ...manifest.pages,
      {
        size: [32, 32],
        maps: { colour: 'bamboo-colour', normal: 'bamboo-normal', surface: 'bamboo-surface' },
      },
    ],
    sprites: {
      'stone.shared': metadata,
      'woodland.tree': manifest.sprites.tree,
      'bamboo.tree': { ...metadata, page: 1 },
    },
    dependencies: {
      a: ['stone.shared', 'woodland.tree'],
      b: ['stone.shared', 'bamboo.tree'],
      mixed: ['woodland.tree', 'bamboo.tree'],
      preview: ['stone.shared'],
    },
  };
  const { store, images } = fixture(false, catalog);
  const preview = store.acquireGroup('preview');
  const a = store.acquireGroup('a');
  await Promise.all([preview.ready, a.ready]);
  const b = store.acquireGroup('b');
  await b.ready;
  assert.strictEqual(a.sprite('stone.shared').colour, b.sprite('stone.shared').colour);
  a.release();
  const mixed = store.acquireGroup('mixed');
  await mixed.ready;
  assert.ok(mixed.sprite('woodland.tree'));
  assert.ok(mixed.sprite('bamboo.tree'));
  const again = store.acquireGroup('a');
  await again.ready;
  b.release();
  mixed.release();
  assert.equal(images.length, 6);
  assert.equal(store.snapshot().pages, 1);
  again.release();
  assert.ok(preview.sprite('stone.shared'));
  preview.release();
  assert.equal(store.snapshot().pages, 0);
});
test('scenes and independent previews share pages until their last lease releases', async () => {
  const { store, images } = fixture();
  const a = store.acquireGroup('a');
  await a.ready;
  const preview = store.acquireGroup('preview');
  const b = store.acquireGroup('b');
  await Promise.all([preview.ready, b.ready]);
  assert.equal(images.length, 3);
  assert.equal(store.snapshot().references, 3);
  assert.equal(a.sprite('tree'), null);
  assert.equal(b.sprite('rock').material.emissive, undefined);
  a.release();
  b.release();
  assert.equal(store.snapshot().pages, 1);
  assert.ok(preview.sprite('rock'));
  preview.release();
  preview.release();
  assert.equal(store.snapshot().pages, 0);
  assert.ok(images.every((image) => image.src === ''));
  const again = store.acquireGroup('a');
  await again.ready;
  assert.equal(images.length, 6);
  store.dispose();
  assert.equal(again.sprite('rock'), null);
});
test('failed decoding releases pages and unknown IDs do not acquire anything', async () => {
  const { store } = fixture(true);
  assert.throws(() => store.acquire(['rock', 'unknown']), /Unknown packed sprite/);
  assert.equal(store.snapshot().pages, 0);
  const lease = store.acquireGroup('a');
  await assert.rejects(lease.ready, /decode failed/);
  assert.equal(store.snapshot().pages, 0);
});
test('releasing during preparation settles without leaving references', async () => {
  const { store } = fixture();
  const lease = store.acquireGroup('a');
  lease.release();
  await assert.rejects(lease.ready, /released/);
  assert.equal(store.snapshot().references, 0);
});
test('trim offsets preserve original logical scale and placement', () => {
  assert.deepEqual(packedSpritePlacement(metadata, -100, -240, 200, 240), {
    x: -70,
    y: -200,
    width: 100,
    height: 120,
  });
});

test('shared decoded bitmaps close only after the final owner releases', async () => {
  const bitmaps = [];
  const { store, images } = fixture(false, manifest, {
    bitmap: async () => {
      const bitmap = {
        width: 32,
        height: 32,
        closes: 0,
        close() {
          this.closes++;
        },
      };
      bitmaps.push(bitmap);
      return bitmap;
    },
  });
  const a = store.acquireGroup('a'),
    preview = store.acquireGroup('preview');
  await Promise.all([a.ready, preview.ready]);
  assert.equal(bitmaps.length, 3);
  assert.ok(images.every((image) => image.src === ''));
  assert.strictEqual(a.sprite('rock').colour, bitmaps[0]);
  a.release();
  assert.ok(bitmaps.every((bitmap) => bitmap.closes === 0));
  preview.release();
  assert.ok(bitmaps.every((bitmap) => bitmap.closes === 1));
});

test('late bitmap preparation closes its result after the lease is cancelled', async () => {
  const finish = [];
  const bitmaps = [];
  const { store } = fixture(false, manifest, {
    bitmap: () =>
      new Promise((resolve) => {
        const bitmap = {
          width: 32,
          height: 32,
          closes: 0,
          close() {
            this.closes++;
          },
        };
        bitmaps.push(bitmap);
        finish.push(() => resolve(bitmap));
      }),
  });
  const lease = store.acquireGroup('a');
  await Promise.resolve();
  assert.equal(finish.length, 3);
  lease.release();
  for (const resolve of finish) resolve();
  await assert.rejects(lease.ready, /released/);
  assert.ok(bitmaps.every((bitmap) => bitmap.closes === 1));
  assert.equal(store.snapshot().pages, 0);
});
