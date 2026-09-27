import test from 'node:test';
import assert from 'node:assert/strict';
import { createPalette } from '../../src/rendering/palette.ts';
import { createLayout } from '../../src/rendering/layout.ts';

test('fog caches distinguish stages and robe colors preserve their overrides', () => {
  const palette = createPalette();
  assert.equal(palette.fog(0, [100, 110, 120]).robe, 'rgb(33,31,29)');
  assert.equal(palette.fog(1, [100, 110, 120]).robe, 'rgb(100,110,120)');
  assert.equal(palette.fog(1, [200, 210, 220]).robe, 'rgb(200,210,220)');
  assert.equal(palette.robe('hai').robe, 'rgb(84,81,76)');
  assert.equal(palette.robe('missing').robe, 'rgb(33,31,29)');
});

test('responsive layout gives five ordered slots and independent geometry per canvas', () => {
  const portrait = createLayout(390, 844);
  const landscape = createLayout(844, 390);
  assert.equal(portrait.slots.length, 5);
  assert.equal(landscape.slots.length, 5);
  for (const layout of [portrait, landscape]) {
    assert.ok(layout.player.h > 0);
    assert.ok(layout.boss.h > 0);
    for (let i = 1; i < layout.slots.length; i++) {
      assert.ok(layout.slots[i].x > layout.slots[i - 1].x);
    }
  }
  landscape.player.x = -1;
  assert.ok(portrait.player.x > 0);
});
