import test from 'node:test';
import assert from 'node:assert/strict';
import { createAmbient } from '../../src/rendering/scene/ambient.ts';
import { rng } from '../../src/shared/random.ts';

const make = () =>
  createAmbient({
    width: 390,
    height: 844,
    scale: 1,
    layout: { groundY: 650, eH: 160 },
    random: rng(42),
  });
test('ambient generation is deterministic and grass is sorted back to front', () => {
  const a = make().buildGrass(10),
    b = make().buildGrass(10);
  assert.deepEqual(a, b);
  assert.equal(a.fg.length, 130);
  assert.equal(a.mid.length, 195);
  for (const list of [a.fg, a.mid]) {
    assert.ok(list.every((blade, i) => i === 0 || blade.y >= list[i - 1].y));
    assert.ok(list.every((blade) => blade.h > 0 && blade.w > 0));
  }
});
test('ordinary offscreen leaves respawn but gust leaves are removed', () => {
  const ambient = make(),
    leaves = ambient.buildLeaves();
  const count = leaves.length,
    old = leaves[0];
  old.x = 1000;
  ambient.gustLeaves(leaves, 2);
  assert.equal(leaves.length, count + 2);
  for (const leaf of leaves) if (leaf.gust) leaf.x = 1000;
  ambient.updateLeaves(leaves, 0.05, 1, 1);
  assert.equal(leaves.length, count);
  assert.notEqual(leaves[0], old);
  assert.ok(leaves[0].x < 0);
  assert.ok(leaves.every((leaf) => Number.isFinite(leaf.x) && Number.isFinite(leaf.y)));
});
