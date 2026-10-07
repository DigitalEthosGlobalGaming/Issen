import test from 'node:test';
import assert from 'node:assert/strict';
import { createFigureRenderer } from '../../src/rendering/figures/figure.ts';
import { createPalette } from '../../src/rendering/palette.ts';
import { makeFig, EPOSE } from '../../src/shared/figure-model.ts';

test('outfit aura is independent, stateless and respects caller and figure opacity', () => {
  const gradients = [],
    fills = [],
    stack = [];
  const state = { globalAlpha: 0.8, fillStyle: '', strokeStyle: '' };
  const context = new Proxy(state, {
    get(target, key) {
      if (key === 'save') return () => stack.push({ ...target });
      if (key === 'restore') return () => Object.assign(target, stack.pop());
      if (key === 'createRadialGradient')
        return () => {
          const stops = [];
          gradients.push(stops);
          return { stops, addColorStop: (offset, color) => stops.push([offset, color]) };
        };
      if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (key === 'fillRect')
        return () => {
          if (target.fillStyle?.stops?.some(([, color]) => color === 'rgba(211,73,102,.12)'))
            fills.push({ style: target.fillStyle, alpha: target.globalAlpha });
        };
      return key in target ? target[key] : () => {};
    },
  });
  const palette = createPalette();
  const renderer = createFigureRenderer(context, {
    time: 2,
    wind: 0,
    petActive: false,
    width: 390,
    height: 844,
    palette: (fog) => palette.fog(fog, [100, 110, 120]),
    random: () => {
      throw new Error('Outfit aura must not consume random state');
    },
  });
  const figure = {
    x: 100,
    y: 300,
    h: 100,
    fog: 0,
    alpha: 0.5,
    d: makeFig(4),
    pose: EPOSE.guard,
    noSword: true,
  };
  for (const mode of ['after', 'dark', 'bolt', 'petal', 'frost', 'glow']) {
    const aura = { c: '211,73,102', mode };
    const before = JSON.stringify(aura);
    const count = fills.length;
    renderer.drawFigure({ ...figure, robeAura: aura });
    assert.equal(fills.length, count + 1);
    assert.equal(fills.at(-1).alpha, 0.4);
    assert.ok(fills.at(-1).style.stops.some(([, color]) => color === 'rgba(211,73,102,.12)'));
    assert.equal(JSON.stringify(aura), before);
    assert.equal(context.globalAlpha, 0.8);
    assert.equal(stack.length, 0);
  }
  const count = fills.length;
  renderer.drawFigure(figure);
  assert.equal(fills.length, count, 'inactive outfit has no halo');
});
