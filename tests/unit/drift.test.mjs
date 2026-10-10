import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRIFT_ATLASES,
  DRIFT_SPRITES,
  DRIFT_MIXTURES,
  DRIFT_DENSITY,
  chooseDriftSprite,
} from '../../src/rendering/scene/drift-catalog.ts';
import { createAmbient } from '../../src/rendering/scene/ambient.ts';
import { rng } from '../../src/shared/random.ts';
import { parseSettings, assignBinding } from '../../src/platform/settings.ts';
test('all ten stage mixtures resolve to valid independent atlas frames', () => {
  assert.equal(DRIFT_MIXTURES.length, 10);
  assert.equal(DRIFT_SPRITES.length, 32);
  const used = new Set(DRIFT_MIXTURES.flatMap((m) => m.map(([id]) => id)));
  assert.equal(used.size, 32);
  for (const sprite of DRIFT_SPRITES) {
    assert.ok(DRIFT_ATLASES[sprite.atlas]);
    assert.ok(used.has(sprite.id));
    const [x, y, w, h] = sprite.frame;
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1 && y + h <= 1);
  }
  for (let stage = 0; stage < 10; stage++) {
    const allowed = new Set(DRIFT_MIXTURES[stage].map(([id]) => id));
    const random = rng(42);
    for (let i = 0; i < 100; i++) assert.ok(allowed.has(chooseDriftSprite(stage, random).id));
  }
});
test('sprite identity survives updates and is chosen from current stage on respawn', () => {
  const environment = {
    width: 390,
    height: 844,
    scale: 1,
    layout: { groundY: 650, eH: 160 },
    random: rng(42),
    stage: 4,
  };
  const ambient = createAmbient(environment);
  const leaves = ambient.buildLeaves();
  const ids = leaves.map((l) => l.sprite);
  ambient.updateLeaves(leaves, 0, 0, 0);
  assert.deepEqual(
    leaves.map((l) => l.sprite),
    ids,
  );
  environment.stage = 6;
  leaves[0].x = 1000;
  ambient.updateLeaves(leaves, 0, 0, 0);
  assert.ok(DRIFT_MIXTURES[6].some(([id]) => id === leaves[0].sprite));
});
test('legacy debris choices migrate to sprites and the lighting shortcut remains reserved', () => {
  for (const debrisStyle of [undefined, 'original', 'sprites', 'invalid']) {
    const settings = parseSettings({ version: 1, debrisStyle });
    assert.equal('debrisStyle' in settings, false);
    assert.equal(settings.graphics.particles, 'medium');
  }
  for (const key of ['`', '~'])
    assert.match(assignBinding(parseSettings(null), 'up', key), /reserved/);
});

test('Blossom retains density and other scenes are substantially quieter', () => {
  assert.equal(DRIFT_DENSITY[2], 1);
  DRIFT_DENSITY.forEach((density, index) => {
    if (index !== 2) assert.ok(density > 0 && density <= 0.4);
  });
});
