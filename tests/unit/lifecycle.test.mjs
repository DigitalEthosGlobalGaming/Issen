import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycle } from '../../src/platform/lifecycle.ts';

test('lifecycle removes listeners, cancels timers and disposes once in reverse order', async () => {
  const lifecycle = createLifecycle(),
    target = new EventTarget(),
    calls = [];
  lifecycle.listen(target, 'click', () => calls.push('click'));
  target.dispatchEvent(new Event('click'));
  lifecycle.timeout(() => calls.push('late'), 5);
  const cancelled = lifecycle.timeout(() => calls.push('cancelled'), 5);
  lifecycle.clearTimeout(cancelled);
  lifecycle.add(() => calls.push('first'));
  lifecycle.add(() => calls.push('second'));
  lifecycle.dispose();
  lifecycle.dispose();
  target.dispatchEvent(new Event('click'));
  lifecycle.add(() => calls.push('after'));
  lifecycle.timeout(() => calls.push('after-timer'), 5);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(lifecycle.disposed, true);
  assert.deepEqual(calls, ['click', 'second', 'first', 'after']);
});
