import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoss } from '../../src/game/encounters/boss-create.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { BOSSES } from '../../src/game/content/bosses.ts';
test('seeded identity varies appearance while preserving archetype and combat parameters', () => {
  const mods = computeModifiers([], new Set());
  const pos = () => ({ x: 0, y: 0, h: 1, fog: 0, alpha: 1 });
  for (let count = 1; count <= 6; count++) {
    const a = createBoss(count, 'normal', mods, pos, restorableRng(123).next);
    const b = createBoss(count, 'normal', mods, pos, restorableRng(123).next);
    const base = createBoss(count, 'normal', mods, pos);
    assert.deepEqual(a, b);
    assert.deepEqual(a.bp, base.bp);
    for (const key of ['v', 'twin', 'spear', 'mirror'])
      assert.equal(a.def[key], BOSSES[count - 1][key]);
    const variations = [0, 0.4, 0.9].map((n) => createBoss(count, 'normal', mods, pos, () => n));
    assert.equal(new Set(variations.map((v) => v.def.n)).size, 3);
    assert.equal(new Set(variations.map((v) => v.d.seed)).size, 3);
  }
});
