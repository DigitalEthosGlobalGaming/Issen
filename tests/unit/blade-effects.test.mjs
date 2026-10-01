import test from 'node:test';
import assert from 'node:assert/strict';
import { BLADE_RECIPES, bladeEffectPoint } from '../../src/rendering/figures/blade-recipes.ts';

test('blade-following effects reach the modular root and tip at short and long lengths', () => {
  for (const [id, recipe] of Object.entries(BLADE_RECIPES)) {
    for (const length of [0.38, 0.52, 0.72]) {
      const root = bladeEffectPoint(id, length, 0),
        tip = bladeEffectPoint(id, length, 1);
      assert.ok(Math.abs(root[0] - 0.016) < 1e-10 && Math.abs(root[1]) < 1e-10, id);
      assert.ok(Math.abs(tip[0] - length) < 1e-10, id);
      assert.ok(Math.abs(tip[1] - (recipe.special ? 0 : -0.05 * length)) < 1e-10, id);
    }
  }
});
test('serpent effects follow alternating bends while straight heavy blades keep their profile', () => {
  const values = [1, 2, 3, 4, 5, 6].map((i) => bladeEffectPoint('orochi', 0.52, i / 7)[1]);
  assert.ok(values[1] < values[0] && values[3] > values[1] && values[5] < values[4]);
  assert.notDeepEqual(
    values,
    [1, 2, 3, 4, 5, 6].map((i) => bladeEffectPoint('onikiri', 0.52, i / 7)[1]),
  );
});
