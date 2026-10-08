import test from 'node:test';
import assert from 'node:assert/strict';
import { createDecodedImageLoader, decodedImageBudget } from '../../src/platform/decoded-images.ts';
const turn = () => new Promise((resolve) => setImmediate(resolve));
const resource = (name, closed, width = 10) => ({
  width,
  height: 10,
  close() {
    closed.push(name);
  },
});

test('queued requests share a promise, bump priority and bypass blocked idle work', async () => {
  const calls = [],
    closed = [];
  const loader = createDecodedImageLoader({
    budget: 4000,
    decode: async (url) => {
      calls.push(url);
      return resource(url, closed);
    },
    yield: turn,
  });
  loader.policy({ busy: true });
  const a = loader.load('a', 'idle'),
    b = loader.load('b', 'idle');
  assert.equal(loader.load('a', 'soon'), a, 'soon work also waits for a quiet frame');
  assert.deepEqual(calls, []);
  const c = loader.load('c', 'now');
  assert.equal(loader.load('b', 'now'), b);
  await Promise.all([b, c]);
  assert.deepEqual(calls, ['c', 'b']);
  await turn();
  assert.equal(loader.snapshot().queued, 1);
  loader.policy({ busy: false, hidden: true });
  await turn();
  assert.deepEqual(calls, ['c', 'b']);
  loader.policy({ hidden: false, overFrameBudget: true });
  await turn();
  assert.equal(loader.snapshot().queued, 1);
  loader.policy({ overFrameBudget: false });
  await a;
  assert.deepEqual(calls, ['c', 'b', 'a']);
  assert.equal(loader.load('b'), b);
  loader.dispose();
});

test('LRU closes unpinned images, repeated pin leases protect live owners and unpin retains warm sources', async () => {
  const closed = [];
  const loader = createDecodedImageLoader({
    budget: 800,
    decode: async (url) => resource(url, closed),
    yield: turn,
  });
  const releaseA = loader.pin('a'),
    releasePeer = loader.pin('a');
  await loader.load('a');
  await loader.load('b');
  await loader.load('c');
  assert.deepEqual(closed, ['b']);
  assert.equal(loader.snapshot().bytes, 800);
  assert.equal(
    loader.snapshot().pinnedBytes,
    400,
    'shared pin leases count the decoded image once',
  );
  releaseA();
  releaseA();
  assert.equal(loader.snapshot().pinned, 1);
  assert.equal(loader.snapshot().pinnedBytes, 400);
  releasePeer();
  assert.equal(
    loader.snapshot().pinnedBytes,
    0,
    'warm unpinned images are not mandatory residency',
  );
  assert.deepEqual(closed, ['b'], 'unpin does not eagerly evict');
  await loader.load('d');
  assert.deepEqual(closed, ['b', 'a']);
  assert.ok(loader.snapshot().peakBytes <= loader.snapshot().budget);
  loader.dispose();
  loader.dispose();
  assert.deepEqual(closed.sort(), ['a', 'b', 'c', 'd']);
});

test('pinned budget pressure and oversized images fail without closing live sources or exceeding budget', async () => {
  const closed = [];
  const loader = createDecodedImageLoader({
    budget: 400,
    decode: async (url) => resource(url, closed, url === 'huge' ? 20 : 10),
    yield: turn,
  });
  const release = loader.pin('a');
  await loader.load('a');
  await assert.rejects(loader.load('b'), /budget exhausted/);
  await assert.rejects(loader.load('huge'), /budget exhausted/);
  assert.deepEqual(closed, ['b', 'huge']);
  assert.equal(loader.snapshot().bytes, 400);
  assert.equal(loader.snapshot().pinned, 1);
  release();
  loader.dispose();
});

test('dispose aborts pending work and closes a late decoded result exactly once; errors can be retried', async () => {
  let finish, signal;
  const closed = [];
  const loader = createDecodedImageLoader({
    budget: 400,
    decode: (url, incoming) => {
      signal = incoming;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
    yield: turn,
  });
  const pending = loader.load('late');
  const rejected = assert.rejects(pending, /disposed/);
  loader.dispose();
  await rejected;
  assert.equal(signal.aborted, true);
  finish(resource('late', closed));
  await turn();
  assert.deepEqual(closed, ['late']);
  assert.equal(loader.snapshot().bytes, 0);
  await assert.rejects(loader.load('new'), /disposed/);
  let attempts = 0;
  const retry = createDecodedImageLoader({
    budget: 400,
    decode: async () => {
      if (!attempts++) throw Error('decode failed');
      return resource('retry', closed);
    },
    yield: turn,
  });
  await assert.rejects(retry.load('retry'), /decode failed/);
  await retry.load('retry');
  assert.equal(attempts, 2);
  retry.dispose();
});

test('known dimensions reserve space before decode and reject pressure without allocating another bitmap', async () => {
  const closed = [],
    calls = [];
  const loader = createDecodedImageLoader({
    budget: 400,
    expectedBytes: () => 400,
    decode: async (url) => {
      calls.push(url);
      return resource(url, closed);
    },
    yield: turn,
  });
  const release = loader.pin('a');
  await loader.load('a');
  await assert.rejects(loader.load('b'), /budget exhausted/);
  assert.deepEqual(calls, ['a']);
  assert.deepEqual(closed, []);
  release();
  await loader.load('b');
  assert.deepEqual(closed, ['a']);
  assert.equal(loader.snapshot().peakBytes, 400);
  loader.dispose();
});

test('device defaults use 256/384 MiB mobile and 512 MiB desktop', () => {
  assert.equal(decodedImageBudget({ deviceMemory: 2 }), 256 * 1024 * 1024);
  assert.equal(decodedImageBudget({ lowQuality: true }), 256 * 1024 * 1024);
  assert.equal(decodedImageBudget({ mobile: true }), 384 * 1024 * 1024);
  assert.equal(decodedImageBudget(), 512 * 1024 * 1024);
});
