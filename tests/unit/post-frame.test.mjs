import test from 'node:test';
import assert from 'node:assert/strict';
import { createPostState, preparePost } from '../../src/rendering/effects/post-frame.ts';

const input = {
  raw: 0.05,
  width: 390,
  height: 844,
  nitrate: false,
  reducedMotion: false,
  reducedFlashes: false,
  active: true,
  limitedLives: true,
  dead: false,
  lives: 1,
  maxLives: 2,
  imminentAttack: true,
  inkPulse: 1,
  flash: 0.5,
  scratches: [Object.freeze({ x: 5, y0: 0, y1: 10, t: 0.09, life: 0.1, a: 0.1 })],
};

test('post preparation advances once and returns a frame independent of prior mutable state', () => {
  const state = Object.freeze(createPostState());
  const source = Object.freeze({ ...input, scratches: Object.freeze([...input.scratches]) });
  const result = preparePost(state, source, () => 0.5);
  assert.equal(result.heartbeat, true);
  assert.equal(result.state.heartbeatTimer, 0.6);
  assert.equal(result.state.heartbeatPulse, 0.825);
  assert.equal(result.flash, 0.38);
  assert.equal(result.frame.flash, 0.5);
  assert.equal(result.scratches.length, 0);
  assert.equal(result.frame.scratches.length, 1, 'expiring scratch is visible for its final frame');
  assert.equal(source.scratches[0].t, 0.09);
  assert.equal(state.frame, 0);
  const replay = structuredClone(result.frame);
  const next = preparePost(result.state, { ...input, scratches: result.scratches }, () => 0.5);
  assert.equal(next.heartbeat, false);
  assert.deepEqual(result.frame, replay);
});

test('reduced motion and flashes suppress decorative randomness while keeping damage feedback', () => {
  let calls = 0;
  const result = preparePost(
    createPostState(),
    { ...input, reducedMotion: true, reducedFlashes: true },
    () => {
      calls++;
      return 0;
    },
  );
  assert.equal(calls, 0);
  assert.equal(result.frame.grainX, 0);
  assert.equal(result.frame.grainY, 0);
  assert.equal(result.frame.blot, null);
  assert.deepEqual(result.frame.dust, []);
  assert.equal(result.frame.flash, 0.035);
  assert.equal(result.frame.flicker, 0.02);
  assert.ok(result.frame.inkAlpha > 0);
});
