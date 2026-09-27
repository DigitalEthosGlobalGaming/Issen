import test from 'node:test';
import assert from 'node:assert/strict';
import { createItems } from '../../src/game/content/items.ts';
import { ROBE_AWAKENINGS } from '../../src/game/content/robe-awakenings.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';

test('every outfit has an earnable, distinct awakening using supported modifiers', () => {
  const robes = createItems(() => new Set()).filter((item) => item.type === 'robe');
  assert.equal(robes.length, 20);
  assert.deepEqual(Object.keys(ROBE_AWAKENINGS).sort(), robes.map((item) => item.id).sort());
  const defaults = computeModifiers([], new Set());
  const effects = new Set();
  for (const robe of robes) {
    const awakening = ROBE_AWAKENINGS[robe.id];
    assert.ok(awakening.pk && awakening.tr && awakening.need[2]);
    assert.ok(['k', 'p', 'd', 'w', 'rw', 'c', 'sc'].includes(awakening.need[0]));
    assert.ok(Number.isInteger(awakening.need[1]) && awakening.need[1] > 0);
    assert.match(awakening.st.c, /^\d+,\d+,\d+$/);
    assert.equal(awakening.aura.c, awakening.st.c);
    for (const [key, value] of Object.entries(awakening.m)) {
      assert.ok(key in defaults, `${robe.id}: unsupported modifier ${key}`);
      assert.ok(Number.isFinite(value));
    }
    const resolved = computeModifiers([awakening.m], new Set());
    assert.ok(resolved.atk > 0 && resolved.parry > 0 && resolved.stag > 0);
    effects.add(JSON.stringify(awakening.m));
  }
  assert.equal(effects.size, robes.length);
});
