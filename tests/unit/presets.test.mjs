import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePresets,
  addPreset,
  mergePresets,
  presetEquipment,
} from '../../src/game/progression/presets.ts';
import { DEFAULT_EQUIPMENT } from '../../src/platform/saves.ts';
import { createItems } from '../../src/game/content/items.ts';
import { prepareImport } from '../../src/platform/save-transfer.ts';
test('slot capacity, snapshots and deletion permit saving a replacement', () => {
  const presets = [];
  const eq = { ...DEFAULT_EQUIPMENT, bladeSp: true };
  assert.equal(addPreset(presets, 0, eq, 'a'), false);
  assert.equal(addPreset(presets, 1, eq, 'a'), true);
  eq.blade = 'sakura';
  assert.equal(presets[0].equipment.blade, 'steel');
  assert.equal(addPreset(presets, 1, eq, 'b'), false);
  presets.splice(0, 1);
  assert.equal(addPreset(presets, 1, eq, 'b'), true);
});
test('unavailable selections are preserved but equipping respects ownership and awakening access', () => {
  const preset = parsePresets([
    {
      id: 'a',
      name: 'test',
      equipment: {
        ...DEFAULT_EQUIPMENT,
        blade: 'sakura',
        bladeSp: true,
        robe: 'hai',
        robeSp: true,
        film: 'premium',
      },
    },
  ])[0];
  const owned = new Set(['steel', 'sumi', 'steel+', 'hai', 'hai+']);
  const items = createItems(() => owned);
  const equipped = presetEquipment(preset, owned, items, 0);
  assert.equal(equipped.blade, 'steel');
  assert.equal(equipped.bladeSp, false);
  assert.equal(equipped.robeSp, false);
  assert.equal(equipped.film, 'mono');
  assert.equal(presetEquipment(preset, owned, items, 2).robeSp, true);
  assert.equal(preset.equipment.blade, 'sakura');
});
test('parser/import validate names, unique IDs and preserve at most five equipment snapshots', () => {
  const presets = parsePresets(
    Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      name: 'x'.repeat(50),
      equipment: DEFAULT_EQUIPMENT,
    })),
  );
  assert.equal(presets.length, 5);
  assert.equal(presets[0].name.length, 32);
  assert.equal(mergePresets(presets, presets).length, 5);
  const result = prepareImport(JSON.stringify({ meta: { upgrades: { presets: 3 } }, presets }), {});
  assert.equal(result.data.meta.upgrades.presets, 3);
  assert.equal(result.data.presets.length, 5);
});
