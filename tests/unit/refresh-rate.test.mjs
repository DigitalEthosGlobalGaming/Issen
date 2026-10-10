import test from 'node:test';
import assert from 'node:assert/strict';
import { supports120Hz, createRefreshRateMonitor } from '../../src/platform/refresh-rate.ts';
import { graphicsPreset, graphicsFrameRate } from '../../src/platform/graphics-settings.ts';

test('120 fps availability requires stable rAF evidence, rejecting 60/90 Hz and sparse samples', () => {
  assert.equal(supports120Hz(Array(48).fill(1000 / 120)), true);
  assert.equal(supports120Hz(Array(48).fill(1000 / 144)), true);
  assert.equal(supports120Hz(Array(48).fill(1000 / 90)), false);
  assert.equal(supports120Hz(Array(48).fill(1000 / 60)), false);
  assert.equal(supports120Hz(Array(12).fill(1000 / 120)), false);
  assert.equal(supports120Hz([...Array(47).fill(8), NaN]), false);
  assert.equal(supports120Hz([...Array(20).fill(8), ...Array(28).fill(16)]), false);
  const high = graphicsPreset('high');
  assert.equal(graphicsFrameRate(high, { mobile: false }, false), 60);
  assert.equal(graphicsFrameRate(high, { mobile: false }, true), 120);
  assert.equal(high.frameRate, 120);
});

test('refresh observation stops after its bounded sample and disposal cancels pending work', () => {
  let callback,
    requests = 0,
    cancelled = 0,
    events = 0;
  const doc = {
    hidden: false,
    documentElement: { dataset: {} },
    defaultView: {
      requestAnimationFrame(cb) {
        callback = cb;
        return ++requests;
      },
      cancelAnimationFrame() {
        cancelled++;
      },
      dispatchEvent() {
        events++;
      },
    },
  };
  const monitor = createRefreshRateMonitor(doc);
  for (let i = 1; i <= 48; i++) callback((i * 1000) / 120);
  assert.equal(monitor.supports120, true);
  assert.equal(requests, 48);
  assert.equal(events, 1);
  assert.equal(doc.documentElement.dataset.supports120, 'true');
  monitor.dispose();
  assert.equal(cancelled, 0);
  const cancelledMonitor = createRefreshRateMonitor(doc);
  cancelledMonitor.dispose();
  assert.equal(cancelled, 1);
});
