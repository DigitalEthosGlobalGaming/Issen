import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { initResourceProbe } from './resource-probe.mjs';

test('cold worker fetches bypass HTTP storage while preserving request options', async () => {
  const calls = [];
  const realm = {
    URLSearchParams,
    location: { search: '?httpCache=disabled' },
    fetch: async (...args) => {
      calls.push(args);
      return 'response';
    },
  };
  const probe = runInNewContext(`(${initResourceProbe.toString()})()`, realm);
  const options = { cache: 'force-cache', signal: 'fixture-signal', credentials: 'same-origin' };
  assert.equal(await realm.fetch('fixture.png', options), 'response');
  assert.equal(calls[0][1].cache, 'no-store');
  assert.equal(calls[0][1].signal, 'fixture-signal');
  assert.equal(calls[0][1].credentials, 'same-origin');
  assert.equal(options.cache, 'force-cache');
  assert.equal(probe.snapshot().fetchCachePolicy, 'worker-no-store');
});

test('resource accounting distinguishes created, received, transferred and closed bitmaps', async () => {
  const result = await runInNewContext(
    `
    class ImageBitmap { constructor(w,h) { this.width=w;this.height=h; } close() { this.width=this.height=0; } }
    class OffscreenCanvas { constructor(w,h) { this.width=w;this.height=h; } transferToImageBitmap() { return new ImageBitmap(this.width,this.height); } }
    Object.assign(globalThis, {ImageBitmap, OffscreenCanvas, createImageBitmap: async () => new ImageBitmap(10,20),
      postMessage: (message, transfer=[]) => transfer.forEach(value => {value.width=value.height=0;}),
      addEventListener: () => {}});
    const probe = (${initResourceProbe.toString()})();
    (async () => {
      const image = await createImageBitmap(); image.close(); image.close();
      const canvas = new globalThis.OffscreenCanvas(5,6);
      const outgoing = canvas.transferToImageBitmap();
      globalThis.postMessage({}, [outgoing]);
      const received = new ImageBitmap(7,8); probe.receive({nested:[received]}); probe.receive({received});
      const active = probe.snapshot();
      received.close(); canvas.width=canvas.height=0;
      return JSON.stringify({active, final:probe.snapshot()});
    })();
  `,
    { WeakRef, Proxy, Reflect },
  );
  const { active, final } = JSON.parse(result);
  assert.equal(active.bitmapCreated, 2);
  assert.equal(active.bitmapReceived, 1);
  assert.equal(active.bitmapClosed, 1);
  assert.equal(active.bitmapTransferred, 1);
  assert.equal(active.createdBitmapPixels, 230);
  assert.equal(active.activeBitmapPixels, 56);
  assert.equal(active.offscreenCanvasPixels, 30);
  assert.equal(final.activeBitmapPixels, 0);
  assert.equal(final.offscreenCanvasPixels, 0);
  assert.equal(final.bitmapClosed, 2);
});
