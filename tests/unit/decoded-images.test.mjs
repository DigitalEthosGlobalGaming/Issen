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

test('future image sets admit their union with live pins and retain shared warm decodes', async () => {
  const closed = [],
    calls = [];
  const loader = createDecodedImageLoader({
    budget: 1200,
    expectedBytes: () => 400,
    decode: async (url) => {
      calls.push(url);
      return resource(url, closed);
    },
    yield: turn,
  });
  const live = loader.pin('live');
  await loader.load('live');
  const a = loader.prefetch(['a', 'b', 'a']);
  const peer = loader.prefetch(['a', 'b']);
  assert.ok(a && peer);
  assert.equal(loader.prefetch(['extra']), undefined, 'future pins reserve the entire set');
  assert.equal(await a.ready, true);
  assert.equal(await peer.ready, true);
  assert.deepEqual(calls, ['live', 'a', 'b']);
  assert.equal(loader.snapshot().pinnedBytes, 1200);
  a.release();
  assert.equal(loader.snapshot().pinnedBytes, 1200, 'peer keeps future sources pinned');
  peer.release();
  assert.equal(loader.snapshot().pinnedBytes, 400);
  assert.deepEqual(closed, [], 'completed future decodes stay in the LRU');
  const warmed = loader.load('a');
  await warmed;
  assert.equal(calls.length, 3);
  live();
  loader.dispose();
});

test('busy, hidden and over-budget frames cancel queued future work, with no late result leak', async () => {
  for (const policy of [{ busy: true }, { hidden: true }, { overFrameBudget: true }]) {
    const calls = [],
      closed = [];
    let finish, signal;
    const loader = createDecodedImageLoader({
      budget: 800,
      expectedBytes: () => 400,
      decode: (url, incoming) => {
        calls.push(url);
        signal = incoming;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
      yield: turn,
    });
    const preload = loader.prefetch(['a', 'b']);
    assert.ok(preload);
    loader.policy(policy);
    assert.equal(await preload.ready, false);
    assert.equal(preload.active(), false);
    assert.equal(signal.aborted, true);
    finish(resource('a', closed));
    await turn();
    assert.deepEqual(calls, ['a']);
    assert.deepEqual(closed, ['a']);
    assert.equal(loader.snapshot().queued, 0);
    assert.equal(loader.snapshot().bytes, 0);
    assert.equal(loader.prefetch(['b']), undefined);
    loader.dispose();
  }
});

test('required loads promote shared pending work and cancel other future pins before admission', async () => {
  let finish;
  const closed = [],
    calls = [];
  const loader = createDecodedImageLoader({
    budget: 800,
    expectedBytes: () => 400,
    decode: (url, signal) => {
      calls.push(url);
      if (url === 'shared')
        return new Promise((resolve) => {
          finish = () => {
            assert.equal(signal.aborted, false);
            resolve(resource(url, closed));
          };
        });
      return Promise.resolve(resource(url, closed));
    },
    yield: turn,
  });
  const preload = loader.prefetch(['shared', 'obsolete']);
  const required = loader.load('shared', 'now');
  finish();
  await required;
  assert.equal(await preload.ready, false);
  assert.deepEqual(calls, ['shared']);
  const live = loader.pin('required');
  await loader.load('required');
  assert.equal(loader.snapshot().pinnedBytes, 400);
  assert.ok(loader.snapshot().peakBytes <= 800);
  live();
  loader.dispose();
});

test('unmeasured future sets are denied and cancellation does not remove a replacement request', async () => {
  let finish;
  const closed = [],
    calls = [];
  const loader = createDecodedImageLoader({
    budget: 800,
    expectedBytes: (url) => (url === 'unknown' ? undefined : 400),
    decode: (url) => {
      calls.push(url);
      return calls.length === 1
        ? new Promise((resolve) => {
            finish = resolve;
          })
        : Promise.resolve(resource(url, closed));
    },
    yield: turn,
  });
  assert.equal(loader.prefetch(['unknown']), undefined);
  const preload = loader.prefetch(['a']);
  preload.release();
  const replacement = loader.load('a');
  finish(resource('old-a', closed));
  assert.equal(await preload.ready, false);
  await replacement;
  assert.deepEqual(calls, ['a', 'a']);
  assert.deepEqual(closed, ['old-a']);
  assert.equal(loader.snapshot().decoded, 1);
  loader.dispose();
});
