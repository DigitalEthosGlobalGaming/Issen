import test from 'node:test';
import assert from 'node:assert/strict';
import { leafSprite, emberSprite } from '../../src/rendering/scene/drift-frame.ts';
import { normalTransform } from '../../src/rendering/scene-frame.ts';

test('leaf atlas pose preserves pivot under rotation and mirrored flutter without changing motion state', () => {
  const source = {};
  const images = new Map([['leaves', { source, width: 1536, height: 1024 }]]);
  const leaf = Object.freeze({
    sprite: 'leaves.willow',
    x: 110,
    y: 95,
    s: 5,
    z: 1.5,
    rot: Math.PI / 2,
    fl: Math.PI,
    flutter: 1,
  });
  const sprite = leafSprite(leaf, images, true);
  assert.deepEqual(sprite.texture.frame, [0, 0, 384, 512]);
  assert.equal(sprite.width, 15);
  assert.equal(sprite.height, 20);
  assert.equal(sprite.alpha, 0.6);
  const t = sprite.transform;
  assert.ok(Math.abs(t.a * 7.5 + t.c * 10 + t.tx - leaf.x) < 1e-8);
  assert.ok(Math.abs(t.b * 7.5 + t.d * 10 + t.ty - leaf.y) < 1e-8);
  assert.ok(t.a * t.d - t.b * t.c < 0, 'flutter mirrors the surface');
  assert.equal(leaf.fl, Math.PI);
});

test('missing drift images skip safely and fire variants reuse the same prepared atlas', () => {
  assert.equal(leafSprite({ sprite: 'missing' }, new Map(), true), null);
  const source = {};
  const images = new Map([['fire', { source, width: 1536, height: 1024 }]]);
  const particle = Object.freeze({ x: 10, y: 20, z: 1, ph: 0 });
  const sprites = [0, 1, 2].map((i) => emberSprite(particle, i, 2, images));
  assert.equal(new Set(sprites.map((s) => s.texture.frame.join(','))).size, 3);
  assert.ok(sprites.every((s) => s.texture.source === source && s.alpha === 0.75));
});

test('normal transforms preserve orientation across rotation, mirroring and uniform scale', () => {
  const rotation = normalTransform({ a: 0, b: 10, c: -10, d: 0, tx: 5, ty: 6 });
  assert.deepEqual(
    [...rotation].map((v) => v || 0),
    [0, 1, -1, 0],
  );
  assert.deepEqual(
    [...normalTransform({ a: -2, b: 0, c: 0, d: 2, tx: 0, ty: 0 })].map((v) => v || 0),
    [-1, 0, 0, 1],
  );
  assert.ok([...normalTransform({ a: 0, b: 0, c: 0, d: 0, tx: 0, ty: 0 })].every(Number.isFinite));
});
