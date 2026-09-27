import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGuidedLessonState,
  parseGuidedLessons,
} from '../../src/game/onboarding/guided-state.ts';

test('guided lesson parsing accepts only completed booleans', () => {
  assert.deepEqual(parseGuidedLessons(null), { order: false, bossParry: false });
  assert.deepEqual(parseGuidedLessons({ order: 1, bossParry: true }), {
    order: false,
    bossParry: true,
  });
});

test('front-order lesson freezes reading and practice until a correct cut', () => {
  const saves = [];
  const states = [];
  const lesson = createGuidedLessonState(
    null,
    (value) => saves.push(value),
    (phase, frozen) => states.push([phase, frozen]),
  );
  assert.equal(lesson.startOrder(), true);
  assert.equal(lesson.frozen, true);
  assert.equal(lesson.swipe('up', 'left').consumed, true);
  lesson.advanceReading();
  assert.equal(lesson.phase, 'order-practice');
  assert.equal(lesson.swipe('up', 'left').retry, true);
  assert.equal(lesson.progress.order, false);
  assert.equal(lesson.swipe('left', 'left').consumed, false);
  lesson.orderSucceeded();
  assert.deepEqual(saves, [{ order: true, bossParry: false }]);
  assert.equal(lesson.frozen, false);
  assert.equal(lesson.startOrder(), false);
  assert.deepEqual(states, [
    ['order-read', true],
    ['order-practice', true],
    ['idle', false],
  ]);
});

test('boss lesson slows the glint approach, holds the parry and persists only on success', () => {
  const saves = [];
  const lesson = createGuidedLessonState({ order: true }, (value) => saves.push(value));
  assert.equal(lesson.startBoss(), true);
  assert.equal(lesson.frozen, true);
  assert.equal(lesson.tap(), true);
  lesson.advanceReading();
  assert.equal(lesson.frozen, false);
  assert.equal(lesson.scale, 0.25);
  assert.equal(lesson.tap(), true);
  lesson.bossFlash();
  assert.equal(lesson.frozen, true);
  assert.equal(lesson.tap(), false);
  assert.equal(lesson.progress.bossParry, false);
  lesson.bossParried();
  assert.deepEqual(saves, [{ order: true, bossParry: true }]);
  assert.equal(lesson.phase, 'idle');
  assert.equal(lesson.startBoss(), false);
});

test('an interrupted lesson retries without persisting completion', () => {
  const saves = [];
  const lesson = createGuidedLessonState(null, (value) => saves.push(value));
  lesson.startOrder();
  lesson.reset();
  assert.equal(lesson.progress.order, false);
  assert.equal(lesson.startOrder(), true);
  assert.deepEqual(saves, []);
});
