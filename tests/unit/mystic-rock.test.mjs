import test from 'node:test';
import assert from 'node:assert/strict';
import { createInkCompanionRenderer } from '../../src/rendering/figures/ink-companions.ts';

function fixture() {
  const images = [];
  const renderer = createInkCompanionRenderer({
    createElement() {
      const image = { naturalWidth: 0, naturalHeight: 0, removeAttribute() {} };
      images.push(image);
      return image;
    },
  });
  return { renderer, images };
}
test('rock loads independently of animals, preserves aspect and freezes its bob', async () => {
  const { renderer, images } = fixture();
  const pending = renderer.prepare();
  const rock = images.find((i) => i.src.endsWith('mystic-rock.png'));
  rock.naturalWidth = 1145;
  rock.naturalHeight = 1373;
  rock.onload();
  const animal = images.find((i) => i !== rock);
  animal.onerror();
  await pending;
  const draws = [];
  const ctx = {
    drawImage(...args) {
      draws.push(args);
    },
  };
  assert.equal(renderer.draw('mystic-rock', ctx, 100, 200, 120, 0, false, true), true);
  assert.equal(renderer.draw('mystic-rock', ctx, 100, 200, 120, 99, false, true), true);
  assert.deepEqual(draws[0], draws[1]);
  assert.ok(Math.abs(draws[0][3] / draws[0][4] - 1145 / 1373) < 1e-9);
  renderer.dispose();
  assert.equal(renderer.draw('mystic-rock', ctx, 0, 0, 120), false);
});
test('disposing while both companion images load settles preparation', async () => {
  const { renderer, images } = fixture();
  const pending = renderer.prepare();
  renderer.dispose();
  await pending;
  assert.equal(renderer.ready, false);
  for (const image of images) {
    assert.equal(image.onload, null);
    assert.equal(image.onerror, null);
  }
});
