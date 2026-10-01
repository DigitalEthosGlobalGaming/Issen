import test from 'node:test';
import assert from 'node:assert/strict';
import { createFigureRenderer } from '../../src/rendering/figures/figure.ts';
import { createPalette } from '../../src/rendering/palette.ts';
import { makeFig, EPOSE } from '../../src/rendering/figures/model.ts';

function render({ body = true, sword = true, mode = 'ink', figure = {} } = {}) {
  const calls = { parts: [], swords: [], fills: [], strokes: [], steelGradients: 0 };
  const stack = [];
  const state = {
    globalAlpha: 0.7,
    fillStyle: '',
    strokeStyle: '',
    globalCompositeOperation: 'source-over',
  };
  const context = new Proxy(state, {
    get(target, key) {
      if (key === 'save') return () => stack.push({ ...target });
      if (key === 'restore')
        return () => {
          assert.ok(stack.length, 'restore has a matching save');
          const saved = stack.pop();
          for (const property of Object.keys(target)) delete target[property];
          Object.assign(target, saved);
        };
      if (key === 'fill' || key === 'fillRect') return () => calls.fills.push(target.fillStyle);
      if (key === 'stroke')
        return () =>
          calls.strokes.push({
            style: target.strokeStyle,
            composite: target.globalCompositeOperation,
          });
      if (key === 'createLinearGradient' || key === 'createRadialGradient')
        return (...args) => {
          if (
            key === 'createLinearGradient' &&
            JSON.stringify(args) === JSON.stringify([0, -0.012, 0, 0.01])
          )
            calls.steelGradients++;
          return {
            kind: key,
            args,
            stops: [],
            addColorStop(...stop) {
              this.stops.push(stop);
            },
          };
        };
      return key in target ? target[key] : () => {};
    },
  });
  const palette = createPalette();
  const env = {
    time: 0.4,
    wind: 0.2,
    petActive: false,
    width: 390,
    height: 844,
    palette: (fog) => palette.fog(fog, [100, 110, 120]),
    random: () => 0.5,
    artwork: mode,
    inkPlayer: {
      drawPart(g, part, f) {
        calls.parts.push({ part, alpha: g.globalAlpha, pose: { ...f.pose } });
        return body;
      },
    },
    inkSword: {
      draw(g, gx, gy, angle) {
        calls.swords.push({ gx, gy, angle, alpha: g.globalAlpha });
        return sword;
      },
    },
  };
  const f = {
    x: 150,
    y: 420,
    h: 120,
    fog: 0,
    alpha: 0.6,
    d: makeFig(4),
    pose: { ...EPOSE.left },
    back: true,
    robeId: 'sumi',
    bladeId: 'steel',
    blade: { len: 0.52 },
    ...figure,
  };
  const before = structuredClone(f);
  createFigureRenderer(context, env).drawFigure(f);
  assert.deepEqual(f, before, 'drawing never mutates pose, equipment or seed');
  assert.equal(context.globalAlpha, 0.7, 'caller opacity restored');
  assert.equal(context.globalCompositeOperation, 'source-over');
  assert.equal(stack.length, 0, 'all transforms and clip saves balanced');
  return calls;
}

test('player body and steel sword fall back independently while preserving figure opacity', () => {
  const bodyOnly = render({ body: true, sword: false });
  assert.deepEqual(
    bodyOnly.parts.map((call) => call.part),
    ['arms', 'body', 'head'],
    'rear-view forearms paint before the torso so crossing arms are occluded',
  );
  assert.equal(bodyOnly.swords.length, 1);
  assert.equal(bodyOnly.steelGradients, 1, 'unavailable sword keeps classic steel');
  const swordOnly = render({ body: false, sword: true });
  assert.deepEqual(
    swordOnly.parts.map((call) => call.part),
    ['arms', 'body'],
  );
  assert.equal(swordOnly.swords.length, 1);
  assert.equal(swordOnly.steelGradients, 0, 'available sword replaces classic blade');
  assert.ok(
    swordOnly.fills.length > bodyOnly.fills.length,
    'unavailable body still paints classic clothing',
  );
  for (const call of [
    ...bodyOnly.parts,
    ...bodyOnly.swords,
    ...swordOnly.parts,
    ...swordOnly.swords,
  ]) {
    assert.ok(Math.abs(call.alpha - 0.42) < 1e-10, 'hooks inherit caller and figure alpha');
  }
});

test('unsupported equipment, enemies and Classic mode retain their own artwork', () => {
  for (const scenario of [{ mode: 'classic' }, { figure: { back: false } }]) {
    const calls = render(scenario);
    assert.deepEqual(calls.parts, []);
    assert.deepEqual(calls.swords, []);
    assert.equal(calls.steelGradients, 1);
  }
  const robe = render({ figure: { robeId: 'hai' } });
  assert.deepEqual(robe.parts, []);
  assert.equal(robe.swords.length, 1, 'supported sword is independent of unsupported robe');
  const blade = render({ figure: { bladeId: 'other' } });
  assert.equal(blade.parts.length, 3);
  assert.deepEqual(blade.swords, []);
  assert.equal(blade.steelGradients, 1);
  const unlabelled = render({ figure: { robeId: undefined, bladeId: undefined } });
  assert.deepEqual(unlabelled.parts, []);
  assert.deepEqual(unlabelled.swords, []);
});

test('an unavailable body and sword preserve the complete Classic draw path', () => {
  const fallback = render({ body: false, sword: false });
  const classic = render({ mode: 'classic' });
  assert.deepEqual(
    JSON.parse(JSON.stringify(fallback.fills)),
    JSON.parse(JSON.stringify(classic.fills)),
  );
  assert.deepEqual(fallback.strokes, classic.strokes);
  assert.equal(fallback.steelGradients, classic.steelGradients);
});

test('awakened steel aura remains visible with sprite body and sword', () => {
  const calls = render({
    figure: { blade: { len: 0.52, aura: { mode: 'glow', c: '91,172,243' } } },
  });
  assert.equal(calls.parts.length, 3);
  assert.equal(calls.swords.length, 1);
  assert.ok(
    calls.strokes.some(
      (call) => call.composite === 'lighter' && call.style.startsWith('rgba(91,172,243,'),
    ),
    'shared aura pass still paints',
  );
});
