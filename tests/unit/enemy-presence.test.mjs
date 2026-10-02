import test from 'node:test';
import assert from 'node:assert/strict';
import { enemyPresence } from '../../src/rendering/figures/enemy-presence.ts';
import { makeFig, EPOSE } from '../../src/rendering/figures/model.ts';
import { BLADE_RECIPES } from '../../src/rendering/figures/blade-recipes.ts';

const figure = (seed) => ({
  d: makeFig(seed),
  pose: { ...EPOSE.right },
  varied: true,
  waiting: true,
});
test('enemy weapons vary in silhouette, length and angle without changing saved poses', () => {
  const originals = Array.from({ length: 50 }, (_, i) => figure(i));
  const shown = originals.map((f) => enemyPresence(f, 2));
  assert.ok(new Set(shown.map((f) => BLADE_RECIPES[f.bladeId].profile)).size >= 4);
  assert.ok(new Set(shown.map((f) => f.blade.len)).size >= 4);
  assert.ok(new Set(shown.map((f) => f.pose.ang)).size >= 8);
  for (let i = 0; i < originals.length; i++) {
    assert.deepEqual(originals[i].pose, EPOSE.right);
    assert.deepEqual(shown[i], enemyPresence(JSON.parse(JSON.stringify(originals[i])), 2));
    assert.ok(Math.abs(shown[i].pose.ang - EPOSE.right.ang) < 0.09);
  }
});
test('waiting enemies breathe with pinned feet; reduced motion and attacks are steady', () => {
  const f = figure(19);
  assert.notEqual(enemyPresence(f, 0).sy, enemyPresence(f, 1).sy);
  assert.equal(enemyPresence(f, 0, true).sy, enemyPresence(f, 1, true).sy);
  assert.equal(enemyPresence({ ...f, waiting: false }, 0).sy, 1);
  assert.equal(enemyPresence({ ...f, varied: false }, 0).pose, f.pose);
});
