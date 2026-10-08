import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createCompressedAssetStore,
  createAssetPrefetch,
} from '../../src/platform/compressed-assets.ts';
import { buildRuntimeManifest } from '../../scripts/assets/runtime-manifest.mjs';
import { runtimeAssets } from '../../src/platform/runtime-assets.ts';
const turn = () => new Promise((resolve) => setImmediate(resolve));

test('compressed cache reads avoid network, preserve independent bodies and prune only obsolete asset keys', async () => {
  const entries = new Map(),
    calls = [];
  const storage = {
    async open() {
      return {
        async match(url) {
          return entries.get(url)?.clone();
        },
        async put(url, response) {
          entries.set(url, response);
        },
        async keys() {
          return [...entries.keys()].map((url) => new Request(url));
        },
        async delete(request) {
          return entries.delete(request.url);
        },
      };
    },
  };
  const store = createCompressedAssetStore({
    storage,
    fetch: async (url, init) => {
      calls.push([url, init.priority]);
      return new Response('unaltered bytes');
    },
  });
  const first = await store.read('https://game.test/a', undefined, 'low');
  const second = await store.read('https://game.test/a');
  assert.equal(await first.text(), 'unaltered bytes');
  assert.equal(await second.text(), 'unaltered bytes');
  assert.deepEqual(calls, [['https://game.test/a', 'low']]);
  await store.read('https://game.test/old');
  await store.retainOnly(['https://game.test/a']);
  assert.deepEqual([...entries.keys()], ['https://game.test/a']);
  assert.equal(store.snapshot().hits, 1);
});

test('unavailable CacheStorage falls back to HTTP, failed responses reject and aborted reads do not fetch', async () => {
  let calls = 0;
  const store = createCompressedAssetStore({
    storage: {
      async open() {
        throw Error('quota');
      },
    },
    fetch: async () => {
      calls++;
      return new Response('ok');
    },
  });
  await store.read('a');
  await store.read('b');
  assert.equal(calls, 2);
  assert.equal(store.snapshot().failures, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(store.read('c', controller.signal), { name: 'AbortError' });
  assert.equal(calls, 2);
  const bad = createCompressedAssetStore({
    cache: false,
    fetch: async () => new Response('', { status: 404 }),
  });
  await assert.rejects(bad.read('missing'), /HTTP 404/);
});

test('prefetch prioritizes/deduplicates URLs, bounds concurrency, yields and pauses newly queued work', async () => {
  const calls = [],
    finish = new Map();
  const prefetch = createAssetPrefetch({
    urls: ['a', 'b', 'a', 'c'],
    yield: turn,
    read: (url, signal, priority) => {
      calls.push([url, priority]);
      return new Promise((resolve) => finish.set(url, resolve));
    },
  });
  assert.deepEqual(calls, []);
  prefetch.prioritize(['c', 'c']);
  prefetch.pause(false);
  assert.deepEqual(calls, [
    ['c', 'low'],
    ['a', 'low'],
  ]);
  assert.equal(prefetch.snapshot().active, 2);
  prefetch.pause(true);
  finish.get('c')();
  finish.get('a')();
  await turn();
  await turn();
  assert.equal(calls.length, 2);
  assert.equal(prefetch.snapshot().queued, 1);
  prefetch.pause(false);
  finish.get('b')();
  await turn();
  await turn();
  assert.equal(prefetch.snapshot().completed, 3);
  prefetch.dispose();
});

test('prefetch disposal aborts pending transport and never dispatches remaining URLs', async () => {
  let signal, finish;
  const calls = [];
  const prefetch = createAssetPrefetch({
    urls: ['a', 'b'],
    concurrency: 1,
    yield: turn,
    read: (url, incoming) => {
      calls.push(url);
      signal = incoming;
      return new Promise((resolve) => (finish = resolve));
    },
  });
  prefetch.pause(false);
  prefetch.dispose();
  assert.equal(signal.aborted, true);
  finish();
  await turn();
  await turn();
  assert.deepEqual(calls, ['a']);
  assert.throws(
    () => createAssetPrefetch({ urls: [], read: async () => {}, concurrency: 0 }),
    /concurrency/,
  );
});

test('generated runtime manifest is current and excludes unused diffuse/startup-only source inputs', async () => {
  assert.equal(
    await buildRuntimeManifest(),
    await readFile('src/platform/runtime-assets.ts', 'utf8'),
  );
  const inventory = JSON.parse(await readFile('scripts/assets/runtime-inventory.json', 'utf8'));
  const urls = new Set(runtimeAssets.map((asset) => asset.url));
  assert.equal(urls.size, runtimeAssets.length);
  for (const row of inventory.assets.filter(
    (row) =>
      row.roles.includes('unused-decoded-diffuse') || inventory.startupOnly.includes(row.path),
  ))
    assert.equal(urls.has(new URL('../../' + row.path, import.meta.url).href), false);
  assert.ok(runtimeAssets.some((asset) => asset.stages.includes(0)));
  assert.ok(runtimeAssets.every((asset) => asset.width > 0 && asset.height > 0));
});
