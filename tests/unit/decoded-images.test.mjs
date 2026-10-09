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

test('memory observers cannot start a second decode of the same active entry', async () => {
  let loader,
    reentered = false;
  const started = [],
    finish = new Map(),
    closed = [];
  loader = createDecodedImageLoader({
    budget: 800,
    concurrency: 2,
    expectedBytes: () => 400,
    yield: turn,
    onMemoryChange: () => {
      if (!reentered) {
        reentered = true;
        loader.policy({ busy: true });
      }
    },
    decode: (url) => {
      started.push(url);
      return new Promise((resolve) => finish.set(url, resolve));
    },
  });
  const a = loader.load('a'),
    b = loader.load('b');
  assert.deepEqual(started, ['a', 'b']);
  assert.equal(loader.snapshot().reservedBytes, 800);
  finish.get('a')(resource('a', closed));
  finish.get('b')(resource('b', closed));
  await Promise.all([a, b]);
  loader.dispose();
  assert.deepEqual(closed.sort(), ['a', 'b']);
});

test('two decode slots reserve their aggregate bytes and wait for pinned headroom', async () => {
  const closed = [],
    started = [],
    finish = new Map();
  const loader = createDecodedImageLoader({
    budget: 800,
    concurrency: 2,
    expectedBytes: () => 400,
    yield: turn,
    decode: (url) => {
      started.push(url);
      return new Promise((resolve) => finish.set(url, resolve));
    },
  });
  const release = loader.pin('first');
  const first = loader.load('first'),
    second = loader.load('second'),
    third = loader.load('third');
  assert.equal(loader.load('first'), first);
  assert.deepEqual(started, ['first', 'second']);
  assert.equal(loader.snapshot().reservedBytes, 800);
  finish.get('first')(resource('first', closed));
  await first;
  await turn();
  assert.deepEqual(started, ['first', 'second']);
  assert.equal(loader.snapshot().bytes, 800);
  finish.get('second')(resource('second', closed));
  await second;
  await turn();
  assert.deepEqual(started, ['first', 'second', 'third']);
  assert.deepEqual(closed, ['second']);
  assert.equal(loader.snapshot().reservedBytes, 400);
  finish.get('third')(resource('third', closed));
  await third;
  assert.equal(loader.snapshot().peakBytes, 800);
  assert.equal(loader.snapshot().reservedBytes, 0);
  release();
  loader.dispose();
});

test('parallel completion and failure release only their own reservations', async () => {
  const closed = [],
    finish = new Map(),
    fail = new Map();
  const loader = createDecodedImageLoader({
    budget: 1200,
    concurrency: 2,
    expectedBytes: () => 400,
    yield: turn,
    decode: (url) =>
      new Promise((resolve, reject) => {
        finish.set(url, resolve);
        fail.set(url, reject);
      }),
  });
  const first = loader.load('first'),
    second = loader.load('second');
  const rejected = assert.rejects(first, /decode failed/);
  fail.get('first')(Error('decode failed'));
  await rejected;
  assert.equal(loader.snapshot().reservedBytes, 400);
  assert.equal(loader.snapshot().bytes, 400);
  finish.get('second')(resource('second', closed));
  await second;
  assert.equal(loader.snapshot().reservedBytes, 0);
  const late = loader.load('late'),
    invalid = loader.load('invalid');
  await turn();
  const lateRejected = assert.rejects(late, /disposed/);
  const invalidRejected = assert.rejects(invalid, /disposed/);
  loader.dispose();
  finish.get('late')(resource('late', closed));
  finish.get('invalid')(resource('invalid', closed));
  await Promise.all([lateRejected, invalidRejected]);
  await turn();
  assert.deepEqual(closed.sort(), ['invalid', 'late', 'second']);
  assert.equal(loader.snapshot().bytes, 0);
});

test('bounded concurrency validates sizes and chooses queued required work ahead of idle', async () => {
  assert.throws(
    () =>
      createDecodedImageLoader({
        budget: 800,
        concurrency: 2,
        decode: async () => resource('x', []),
      }),
    RangeError,
  );
  const started = [],
    finish = new Map(),
    closed = [];
  const loader = createDecodedImageLoader({
    budget: 1600,
    concurrency: 2,
    expectedBytes: (url) => (url === 'unknown' ? undefined : 400),
    yield: turn,
    decode: (url) => {
      started.push(url);
      return new Promise((resolve) => finish.set(url, resolve));
    },
  });
  const a = loader.load('a'),
    b = loader.load('b'),
    idle = loader.load('idle', 'idle'),
    now = loader.load('now');
  finish.get('a')(resource('a', closed));
  await a;
  await turn();
  assert.deepEqual(started, ['a', 'b', 'now']);
  finish.get('b')(resource('b', closed));
  finish.get('now')(resource('now', closed));
  await Promise.all([b, now]);
  await turn();
  finish.get('idle')(resource('idle', closed));
  await idle;
  await assert.rejects(loader.load('unknown'), /Unknown decoded image size/);
  loader.dispose();
});

test('decode reservations notify before allocation and clear on success, trim and failure', async () => {
  const changes = [],
    closed = [];
  let finish;
  const loader = createDecodedImageLoader({
    budget: 800,
    expectedBytes: () => 400,
    yield: turn,
    onMemoryChange: () => changes.push(loader.snapshot()),
    decode: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = loader.load('first');
  assert.equal(changes.at(-1).reservedBytes, 400);
  assert.equal(changes.at(-1).decoded, 0);
  finish(resource('first', closed));
  await pending;
  assert.equal(changes.at(-1).reservedBytes, 0);
  assert.equal(changes.at(-1).bytes, 400);
  loader.trim();
  assert.equal(changes.at(-1).bytes, 0);
  await turn();
  const failed = loader.load('wrong-size');
  finish(resource('wrong-size', closed, 20));
  await assert.rejects(failed, /dimensions changed/);
  assert.equal(changes.at(-1).reservedBytes, 0);
  assert.equal(changes.at(-1).bytes, 0);
  loader.dispose();
});

test('explicit headroom trimming evicts unused images in LRU order and preserves pins', async () => {
  const closed = [];
  const loader = createDecodedImageLoader({
    budget: 1200,
    decode: async (url) => resource(url, closed),
    yield: turn,
  });
  await loader.load('older');
  const release = loader.pin('live');
  await loader.load('live');
  await loader.load('recent');
  assert.equal(loader.trim(800), 400);
  assert.deepEqual(closed, ['older']);
  assert.equal(loader.trim(), 400);
  assert.deepEqual(closed, ['older', 'recent']);
  assert.equal(loader.snapshot().bytes, 400);
  assert.equal(loader.snapshot().pinnedBytes, 400);
  release();
  assert.equal(loader.trim(), 400);
  assert.equal(loader.snapshot().bytes, 0);
  assert.throws(() => loader.trim(-1), RangeError);
  loader.dispose();
});

test('speculation does not refresh the LRU age of previously used images', async () => {
  const closed = [];
  const loader = createDecodedImageLoader({
    budget: 800,
    expectedBytes: () => 400,
    decode: async (url) => resource(url, closed),
    yield: turn,
  });
  await loader.load('older');
  await loader.load('recent');
  const future = loader.prefetch(['older']);
  assert.ok(future);
  assert.equal(await future.ready, true);
  future.release();
  await loader.load('incoming');
  assert.deepEqual(closed, ['older'], 'prediction must not displace the recent consumer');
  loader.dispose();
});

test('first required use of prefetched images preserves cold request completion recency', async () => {
  const run = async (prefetch) => {
    const closed = [];
    const loader = createDecodedImageLoader({
      budget: 1200,
      expectedBytes: () => 400,
      decode: async (url) => resource(url, closed),
      yield: turn,
    });
    await loader.load('older');
    await loader.load('recent');
    if (prefetch) {
      const future = loader.prefetch(['incoming']);
      assert.ok(future);
      assert.equal(await future.ready, true);
      future.release();
    }
    const incoming = loader.load('incoming');
    const recent = loader.load('recent');
    await Promise.all([incoming, recent]);
    await loader.load('next');
    await loader.load('last');
    const evicted = [...closed];
    loader.dispose();
    return evicted;
  };
  const cold = await run(false),
    warmed = await run(true);
  assert.deepEqual(cold, ['older', 'recent']);
  assert.deepEqual(warmed, cold, 'warm completion must retain the same next victims');
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
