import test from 'node:test';
import assert from 'node:assert/strict';
import {
  observeSceneTextureRetirement,
  retireSceneTexture,
} from '../../src/rendering/texture-revision.ts';

test('final source retirement notifies every GPU consumer once and leaves other sources live', () => {
  const a = {},
    b = {};
  const calls = [];
  observeSceneTextureRetirement(a, () => calls.push('a:first'));
  observeSceneTextureRetirement(a, () => calls.push('a:peer'));
  const stop = observeSceneTextureRetirement(a, () => calls.push('cancelled'));
  observeSceneTextureRetirement(b, () => calls.push('b'));
  stop();
  stop();
  retireSceneTexture(a);
  retireSceneTexture(a);
  assert.deepEqual(calls, ['a:first', 'a:peer']);
  retireSceneTexture(b);
  assert.deepEqual(calls, ['a:first', 'a:peer', 'b']);
});

test('a reused canvas can register a new GPU lifetime after its previous pixels retire', () => {
  const canvas = {};
  let calls = 0;
  const stopPrevious = observeSceneTextureRetirement(canvas, () => calls++);
  retireSceneTexture(canvas);
  const stop = observeSceneTextureRetirement(canvas, () => calls++);
  stopPrevious();
  retireSceneTexture(canvas);
  stop();
  retireSceneTexture(canvas);
  assert.equal(calls, 2);
});

test('cache retirement passes frame preservation explicitly while final retirement remains immediate', () => {
  const modes = [];
  const a = {},
    b = {};
  observeSceneTextureRetirement(a, (mode) => modes.push(mode));
  observeSceneTextureRetirement(b, (mode) => modes.push(mode));
  retireSceneTexture(a, true);
  retireSceneTexture(a, true);
  retireSceneTexture(b);
  assert.deepEqual(modes, [true, false]);
});
