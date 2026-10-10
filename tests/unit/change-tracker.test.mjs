import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ChangeTracker } from '../../src/rendering/pixi/change-tracker.ts';

test('ordered snapshots detect mutation, removal and submissions after a flush', () => {
  const tracker = new ChangeTracker();
  const mutable = new Float32Array([1, 2]);
  const frame = () => {
    tracker.begin();
    tracker.value('mesh');
    tracker.numbers(mutable);
    return tracker.finish();
  };
  assert.equal(frame(), true);
  assert.equal(frame(), false);
  mutable[1] = 3;
  assert.equal(frame(), true);
  tracker.acknowledge();
  assert.equal(tracker.finish(), false);
  tracker.value('later submission');
  assert.equal(tracker.finish(), true);
  assert.equal(frame(), true);
  assert.equal(frame(), false);
  tracker.begin();
  assert.equal(tracker.finish(), true);
});
