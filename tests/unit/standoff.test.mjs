import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createStandoff,
  updateStandoff,
  resolveStandoffSwipe,
} from '../../src/game/encounters/standoff.ts';
const make = () =>
  createStandoff({ dir: 'right', glint: 0, lean: 0, snap: 0 }, 4, 'normal', 1, 1, () => 0);
test('standoff draw begins the response window and timeout fires once', () => {
  const so = make(),
    run = { so, state: 'standoff' },
    events = [];
  const callbacks = {
    nextWave: (n) => events.push(n),
    step: () => events.push('step'),
    draw: () => events.push('draw'),
    late: () => {
      events.push('late');
      run.state = 'dead';
    },
  };
  updateStandoff(run, 0.9, callbacks, () => 0);
  assert.deepEqual(events, ['step']);
  updateStandoff(run, 0.9, callbacks, () => 0);
  assert.equal(so.fired, true);
  assert.equal(so.ft, 1.8);
  updateStandoff(run, 0.5, callbacks, () => 0);
  assert.equal(so.done, false);
  updateStandoff(run, 0.01, callbacks, () => 0);
  assert.equal(so.done, true);
  updateStandoff(run, 2, callbacks, () => 0);
  assert.deepEqual(events, ['step', 'draw', 'late']);
});
test('standoff swipes distinguish early, wrong, success and duplicate input', () => {
  assert.equal(resolveStandoffSwipe(make(), 'right'), 'early');
  const wrong = make();
  wrong.fired = true;
  assert.equal(resolveStandoffSwipe(wrong, 'left'), 'wrong');
  const hit = make();
  hit.fired = true;
  assert.equal(resolveStandoffSwipe(hit, 'right'), 'cut');
  assert.equal(resolveStandoffSwipe(hit, 'right'), 'ignore');
  assert.equal(hit.e.glint, 0);
  const run = { so: hit, state: 'standoff' },
    waves = [];
  const callbacks = { nextWave: (n) => waves.push(n), step() {}, draw() {}, late() {} };
  updateStandoff(run, 1.4, callbacks);
  assert.deepEqual(waves, []);
  updateStandoff(run, 0.01, callbacks);
  assert.deepEqual(waves, [4]);
  assert.equal(run.so, null);
});
test('standoff response windows retain the minimum under difficulty modifiers', () => {
  assert.equal(createStandoff({}, 1, 'ronin', 0.1, 0.1, () => 0).win, 0.34);
  assert.equal(createStandoff({}, 1, 'normal', 2, 1.5, () => 0).win, 1.5);
});
