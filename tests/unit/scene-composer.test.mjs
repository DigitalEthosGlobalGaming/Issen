import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneComposer } from '../../src/presentation/scene-composer.ts';

const pass = (name, calls) => ({ name, draw: (frame, views) => calls.push([name, frame, views]) });

test('named scene passes retain painter order and explicit frame/view identity', () => {
  const calls = [],
    frame = {},
    views = {};
  const composer = createSceneComposer(
    ['environment', 'combat', 'post'].map((name) => pass(name, calls)),
  );
  const remove = composer.insert(pass('lights', calls), { before: 'combat' });
  composer.insert(pass('rim', calls), { after: 'combat' });
  composer.draw(frame, views);
  assert.deepEqual(
    calls.map((call) => call[0]),
    ['environment', 'lights', 'combat', 'rim', 'post'],
  );
  assert.ok(calls.every((call) => call[1] === frame && call[2] === views));
  remove();
  remove();
  assert.deepEqual(composer.order, ['environment', 'combat', 'rim', 'post']);
});

test('scene insertion rejects ambiguous, absent, duplicate and unknown anchors', () => {
  const calls = [];
  assert.throws(() => createSceneComposer([pass('a', calls), pass('a', calls)]), /Duplicate/);
  const composer = createSceneComposer([pass('a', calls)]);
  for (const anchor of [{}, { before: 'a', after: 'a' }])
    assert.throws(() => composer.insert(pass('b', calls), anchor), /exactly one/);
  assert.throws(() => composer.insert(pass('b', calls), { after: 'missing' }), /Unknown/);
  assert.throws(() => composer.insert(pass('a', calls), { after: 'a' }), /Duplicate/);
  assert.throws(() => composer.insert(pass('', calls), { after: 'a' }), /empty/);
  assert.deepEqual(composer.order, ['a']);
});

test('installing or removing scene extensions during a draw affects the next frame', () => {
  const calls = [];
  let remove,
    installed = false;
  const composer = createSceneComposer([
    {
      name: 'first',
      draw() {
        calls.push('first');
        if (!installed) {
          installed = true;
          remove = composer.insert(
            { name: 'extension', draw: () => calls.push('extension') },
            { after: 'first' },
          );
        } else remove();
      },
    },
    { name: 'last', draw: () => calls.push('last') },
  ]);
  composer.draw({}, {});
  assert.deepEqual(calls, ['first', 'last']);
  calls.length = 0;
  composer.draw({}, {});
  assert.deepEqual(calls, ['first', 'extension', 'last']);
  calls.length = 0;
  composer.draw({}, {});
  assert.deepEqual(calls, ['first', 'last']);
});

test('order snapshots and removed extension handles cannot alter later registrations', () => {
  const calls = [],
    composer = createSceneComposer([pass('a', calls)]);
  const extension = pass('b', calls),
    remove = composer.insert(extension, { after: 'a' });
  composer.order.reverse();
  remove();
  composer.insert(extension, { after: 'a' });
  remove();
  assert.deepEqual(composer.order, ['a', 'b']);
});
