import test from 'node:test';
import assert from 'node:assert/strict';
import { createPalette } from '../../src/rendering/palette.ts';
import { createLayout } from '../../src/rendering/layout.ts';
import { createFigureRenderer } from '../../src/rendering/figures/figure.ts';
import { makeFig, EPOSE } from '../../src/shared/figure-model.ts';

test('split enemy and boss shadows stay grounded, fade with the body and vanish at expiry', () => {
  const stack = [];
  const shadows = [];
  const state = { globalAlpha: 1, fillStyle: '', ellipse: null };
  const context = new Proxy(state, {
    get(target, key) {
      if (key === 'save') return () => stack.push({ ...target });
      if (key === 'restore') return () => Object.assign(target, stack.pop());
      if (key === 'ellipse') return (...args) => (target.ellipse = args);
      if (key === 'fill')
        return () => {
          if (target.fillStyle === 'rgba(0,0,0,.25)') shadows.push(target.globalAlpha);
        };
      if (key === 'createLinearGradient' || key === 'createRadialGradient')
        return () => ({ addColorStop() {} });
      return key in target ? target[key] : () => {};
    },
  });
  const palette = createPalette();
  const renderer = createFigureRenderer(context, {
    time: 0,
    wind: 0,
    petActive: false,
    width: 390,
    height: 844,
    palette: (fog) => palette.fog(fog, [100, 110, 120]),
    random: () => 0.5,
  });
  const f = { x: 100, y: 300, h: 100, fog: 0, alpha: 0.8, d: makeFig(4), pose: EPOSE.guard };
  for (const duration of [0.9, 1.6]) {
    shadows.length = 0;
    renderer.drawSplit(f, f, 0.7, duration * 0.7, duration);
    assert.equal(shadows.length, 1, 'one grounded shadow, never a shadow per fragment');
    assert.ok(Math.abs(shadows[0] - 0.4) < 1e-10);
    assert.equal(context.globalAlpha, 1, 'caller opacity restored');
    shadows.length = 0;
    renderer.drawSplit(f, f, 0.7, duration, duration);
    assert.deepEqual(shadows, []);
  }
});

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
