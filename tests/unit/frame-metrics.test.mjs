import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFrameMetrics } from '../../src/platform/frame-metrics.ts';
import { frameMetricsText } from '../../src/ui/frame-metrics.ts';

test('cadence reports delivered mean frame intervals and publishes at a bounded rate', () => {
  const metrics = createFrameMetrics();
  const snapshot = metrics.snapshot;
  let notifications = 0;
  metrics.subscribe(() => notifications++);
  for (let i = 0; i < 26; i++) {
    metrics.sample(10);
    metrics.sample(30);
  }
  assert.equal(notifications, 2);
  assert.equal(metrics.snapshot, snapshot);
  assert.equal(snapshot.fps, 50);
  assert.equal(snapshot.frameMs, 20);
  assert.equal(frameMetricsText(snapshot), '50 FPS · 20.0 ms');
  for (const invalid of [NaN, Infinity, -1, 0, 2000]) metrics.sample(invalid);
  assert.equal(notifications, 2);
});

test('30, 60 and 120 cadence uses render intervals and survives suspension without stale samples', () => {
  for (const fps of [30, 60, 120]) {
    const metrics = createFrameMetrics();
    for (let i = 0; i <= fps; i++) metrics.sample(1000 / fps);
    assert.ok(Math.abs(metrics.snapshot.fps - fps) < 0.000001);
    assert.ok(Math.abs(metrics.snapshot.frameMs - 1000 / fps) < 0.000001);
    metrics.sample(400);
    metrics.suspend();
    assert.equal(metrics.snapshot.active, false);
    assert.equal(frameMetricsText(metrics.snapshot), 'Waiting for frames…');
    for (let i = 0; i < 25; i++) metrics.sample(20);
    assert.equal(metrics.snapshot.fps, 50);
  }
});

test('subscriptions dispose and repeated suspension does not publish unchanged state', () => {
  const metrics = createFrameMetrics();
  let notifications = 0;
  const unsubscribe = metrics.subscribe(() => notifications++);
  metrics.suspend();
  assert.equal(notifications, 0);
  for (let i = 0; i < 25; i++) metrics.sample(20);
  metrics.suspend();
  metrics.suspend();
  assert.equal(notifications, 2);
  unsubscribe();
  for (let i = 0; i < 25; i++) metrics.sample(20);
  assert.equal(notifications, 2);
});
