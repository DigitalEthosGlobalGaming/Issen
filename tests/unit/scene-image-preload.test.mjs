import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleAssetBackground } from '../../src/platform/asset-background.ts';
import { createSceneImagePreload } from '../../src/rendering/environment/image-preload.ts';
import { compositionKey } from '../../src/rendering/environment/worker-types.ts';

test('removing the forecast releases pending and ready next scenes even during busy frames', async () => {
  for (const ready of [false, true]) {
    const doc = new EventTarget();
    doc.hidden = false;
    const current = { width: 100, height: 100, dpr: 1, lowQuality: false, stage: 0, stageSeed: 1 };
    const next = { ...current, stage: 1, stageSeed: 2 };
    let finish,
      releases = 0,
      starts = 0;
    const preloader = createSceneImagePreload(
      doc,
      () => current,
      () => {
        starts++;
        return {
          ready: new Promise((resolve) => {
            finish = resolve;
          }),
          release() {
            releases++;
          },
        };
      },
      { retainReadyWhenBusy: true },
    );
    try {
      sampleAssetBackground(0, true, 1, 8.3, 1, next);
      if (ready) {
        finish(true);
        await Promise.resolve();
      }
      assert.equal(preloader.snapshot().status, ready ? 'ready' : 'pending');
      sampleAssetBackground(0, false, 1, 8.3);
      assert.equal(releases, 1);
      assert.deepEqual(preloader.snapshot(), { key: undefined, status: 'none' });
      finish(true);
      await Promise.resolve();
      assert.equal(
        preloader.snapshot().status,
        'none',
        'cancelled completion cannot restore ownership',
      );
      sampleAssetBackground(0, true, 1, 8.3);
      assert.equal(starts, 1, 'disabled forecast cannot restart preparation');
      sampleAssetBackground(0, true, 1, 8.3, 1, next);
      assert.equal(starts, 2, 'reenabling the same forecast creates a new lease');
    } finally {
      preloader.dispose();
    }
  }
});

test('ready scene ownership survives busy frames and transfers only to its exact identity', async () => {
  const doc = new EventTarget();
  doc.hidden = false;
  const current = { width: 100, height: 100, dpr: 1, lowQuality: true, stage: 0, stageSeed: 1 };
  const next = { ...current, stage: 1, stageSeed: 2 };
  let releases = 0;
  const preloader = createSceneImagePreload(
    doc,
    () => current,
    () => ({
      ready: Promise.resolve(true),
      release() {
        releases++;
      },
    }),
    { retainReadyWhenBusy: true },
  );
  const sample = (quiet = true) => sampleAssetBackground(0, quiet, 1, 8.3, 1, next);
  try {
    sample();
    await Promise.resolve();
    sample(false);
    assert.equal(preloader.snapshot().status, 'ready');
    assert.equal(preloader.consume(compositionKey({ ...next, stageSeed: 3 })), false);
    assert.equal(preloader.consume(compositionKey(next)), true);
    preloader.cancel();
    assert.equal(releases, 0, 'promoted ownership belongs to the consumer');
    sample();
    await Promise.resolve();
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(releases, 1);
    assert.equal(preloader.snapshot().status, 'none');
  } finally {
    preloader.dispose();
  }
});

test('scene image preloading requires a settled matching quiet scene and invalidates every identity field', async () => {
  const doc = new EventTarget();
  doc.hidden = false;
  const current = { width: 390, height: 844, dpr: 2, lowQuality: false, stage: 1, stageSeed: 10 };
  let active = current,
    started = 0,
    released = 0;
  const next = { ...current, stage: 2, stageSeed: 11 };
  const preloader = createSceneImagePreload(
    doc,
    () => active,
    () => {
      started++;
      return {
        ready: Promise.resolve(true),
        release() {
          released++;
        },
      };
    },
  );
  const sample = (scene = next, quiet = true, work = 2, stage = 1) =>
    sampleAssetBackground(stage, quiet, work, 8.3, scene?.stage, scene);
  try {
    for (const [quiet, work, stage] of [
      [false, 2, 1],
      [true, 7, 1],
      [true, 2, 0],
    ])
      sample(next, quiet, work, stage);
    active = undefined;
    sample();
    active = current;
    doc.hidden = true;
    sample();
    doc.hidden = false;
    sample(current);
    assert.equal(started, 0);
    sample();
    await Promise.resolve();
    assert.equal(preloader.snapshot().status, 'ready');
    for (let i = 0; i < 100; i++) sample();
    assert.equal(started, 1);
    for (const changed of [
      { width: 400 },
      { height: 800 },
      { dpr: 1 },
      { lowQuality: true },
      { stage: 3 },
      { stageSeed: 12 },
    ]) {
      sample({ ...next, ...changed });
      sample();
      await Promise.resolve();
      assert.equal(preloader.snapshot().status, 'ready');
    }
    const before = released;
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    assert.equal(released, before + 1);
    assert.equal(preloader.snapshot().status, 'none');
  } finally {
    preloader.dispose();
  }
});

test('an obsolete preload completion cannot mark a replacement ready', async () => {
  const doc = new EventTarget();
  doc.hidden = false;
  const current = { width: 100, height: 100, dpr: 1, lowQuality: true, stage: 0, stageSeed: 1 };
  const finishes = [];
  let releases = 0;
  const preloader = createSceneImagePreload(
    doc,
    () => current,
    () => ({
      ready: new Promise((resolve) => finishes.push(resolve)),
      release() {
        releases++;
      },
    }),
  );
  try {
    sampleAssetBackground(0, true, 1, 8.3, 1, { ...current, stage: 1 });
    sampleAssetBackground(0, true, 1, 8.3, 2, { ...current, stage: 2 });
    assert.equal(releases, 1);
    finishes[0](true);
    await Promise.resolve();
    assert.equal(preloader.snapshot().status, 'pending');
    finishes[1](true);
    await Promise.resolve();
    assert.equal(preloader.snapshot().status, 'ready');
    preloader.dispose();
    assert.equal(releases, 2);
    sampleAssetBackground(0, true, 1, 8.3, 1, { ...current, stage: 1 });
    assert.equal(finishes.length, 2);
  } finally {
    preloader.dispose();
  }
});

test('same-scene artwork forecasts use their own identity and cancel changed encounters', async () => {
  const doc = new EventTarget();
  doc.hidden = false;
  const current = { width: 100, height: 100, dpr: 1, lowQuality: true, stage: 0, stageSeed: 1 };
  let ordinal = 4,
    starts = 0,
    releases = 0;
  const preload = createSceneImagePreload(
    doc,
    () => current,
    () => {
      starts++;
      return {
        ready: Promise.resolve(true),
        release() {
          releases++;
        },
      };
    },
    {
      allowCurrentScene: true,
      retainReadyWhenBusy: true,
      predict: (active) =>
        ordinal
          ? { identity: active, key: compositionKey(active) + ':boss:' + ordinal }
          : undefined,
    },
  );
  const sample = (quiet) => sampleAssetBackground(0, quiet, 1, 8.3);
  try {
    sample(true);
    await Promise.resolve();
    assert.equal(preload.snapshot().status, 'ready');
    sample(false);
    assert.equal(starts, 1);
    ordinal = 6;
    sample(true);
    await Promise.resolve();
    assert.equal(starts, 2);
    assert.equal(releases, 1);
    current.dpr = 2;
    sample(true);
    await Promise.resolve();
    assert.equal(starts, 3);
    assert.equal(releases, 2);
    ordinal = 0;
    sample(true);
    assert.equal(preload.snapshot().status, 'none');
    assert.equal(releases, 3);
  } finally {
    preload.dispose();
  }
});
