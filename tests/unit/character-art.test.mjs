import { BLADES } from '../../src/game/content/cosmetics.ts';
import { enemyAppearance } from '../../src/rendering/figures/enemy-appearance.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFigureRenderer } from '../../src/rendering/figures/figure.ts';
import { createPalette } from '../../src/rendering/palette.ts';
import { ROBES } from '../../src/game/content/cosmetics.ts';
import { makeFig, EPOSE } from '../../src/rendering/figures/model.ts';

function render({
  body = true,
  enemy = false,
  charmInk = false,
  sword = true,
  mode = 'ink',
  figure = {},
} = {}) {
  const calls = {
    charms: [],
    parts: [],
    enemyParts: [],
    order: [],
    swords: [],
    fills: [],
    strokes: [],
    steelGradients: 0,
  };
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
          ) {
            calls.steelGradients++;
            calls.order.push('weapon');
          }
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
    inkCharm: {
      draw(g, id, x, y, size, color) {
        calls.charms.push({ id, x, y, size, color, alpha: g.globalAlpha });
        return charmInk;
      },
    },
    inkEnemy: {
      drawPart(g, part, f) {
        calls.enemyParts.push({ part, alpha: g.globalAlpha });
        calls.order.push(part);
        return enemy;
      },
    },
    inkSword: {
      draw(g, gx, gy, angle, palette, style, id) {
        calls.swords.push({ gx, gy, angle, id, alpha: g.globalAlpha });
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
  const robe = render({ figure: { robeId: 'unknown-outfit' } });
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

test('five modular player outfits replace the body without duplicate Classic armour', () => {
  for (const robeId of ['yoroi', 'helm', 'shinobi', 'jinbaori', 'mino']) {
    const calls = render({ figure: { robeId, rf: { armor: 1 }, cape: 1, coat: 1 } });
    assert.deepEqual(
      calls.parts.map((c) => c.part),
      ['arms', 'body', 'head'],
    );
    assert.ok(!calls.fills.includes('#3a1612'), 'Classic armour is suppressed');
  }
});

test('front enemy limbs hold weapons between arms and hands, preserving inherited opacity', () => {
  for (const variant of ['', 'mask', 'monk', 'jingasa', 'kasa', 'kabuto', 'hair']) {
    const calls = render({ enemy: true, figure: { back: false, variant } });
    assert.deepEqual(
      calls.enemyParts.map((c) => c.part),
      ['body', 'head', 'arms', 'hands'],
    );
    assert.deepEqual(calls.order, ['body', 'head', 'arms', 'weapon', 'hands']);
    assert.ok(calls.enemyParts.every((c) => Math.abs(c.alpha - 0.42) < 1e-10));
    assert.deepEqual(calls.parts, []);
  }
  const twin = render({ enemy: true, figure: { back: false, twin: 1 } });
  assert.equal(twin.steelGradients, 2, 'both swords stay visible');
  const spear = render({ enemy: true, figure: { back: false, spear: 1 } });
  assert.equal(spear.steelGradients, 0, 'spear retains its existing drawing');
});

test('missing enemy art preserves Classic figure drawing', () => {
  const fallback = render({ figure: { back: false } }),
    classic = render({ mode: 'classic', figure: { back: false } });
  assert.deepEqual(
    JSON.parse(JSON.stringify(fallback.fills)),
    JSON.parse(JSON.stringify(classic.fills)),
  );
  assert.deepEqual(fallback.strokes, classic.strokes);
  assert.equal(fallback.steelGradients, classic.steelGradients);
  assert.deepEqual(classic.enemyParts, []);
});

test('every primary outfit uses the shared Ink puppet while Classic remains available', () => {
  for (const robeId of Object.keys(ROBES)) {
    const figure = {
      robeId,
      variant: ROBES[robeId].variant,
      rf: ROBES[robeId],
      cape: ROBES[robeId].cape,
      coat: ROBES[robeId].coat,
    };
    const ink = render({ figure }),
      classic = render({ mode: 'classic', figure });
    assert.deepEqual(
      ink.parts.map((c) => c.part),
      ['arms', 'body', 'head'],
      robeId,
    );
    assert.deepEqual(classic.parts, [], robeId);
  }
});

test('regular enemy appearance is stable per saved figure, varied, and preserves authored looks', () => {
  const hats = new Set(),
    colors = new Set(),
    widths = new Set();
  for (let seed = 0; seed < 80; seed++) {
    const f = { d: makeFig(seed), variant: null },
      before = structuredClone(f);
    const a = enemyAppearance(f);
    assert.deepEqual(enemyAppearance(f), a);
    assert.deepEqual(f, before);
    hats.add(a.variant);
    colors.add(a.palette.robe);
    widths.add(a.width);
    assert.ok(a.width >= 0.94 && a.width <= 1.061);
  }
  assert.ok(hats.size >= 5);
  assert.equal(colors.size, 4);
  assert.ok(widths.size >= 5);
  const f = { d: makeFig(1), variant: 'mask', pal: createPalette().robe('shiro') };
  assert.equal(enemyAppearance(f).variant, 'mask');
  assert.equal(enemyAppearance(f).palette, f.pal);
});

test('all primary blades including beam and pan reach the Ink weapon hook', () => {
  const ids = [
    'steel',
    'kuro',
    'beni',
    'tsuki',
    'oboro',
    'mura',
    'raijin',
    'sakura',
    'kage',
    'bokken',
    'kodachi',
    'doji',
    'kiku',
    'yuki',
    'masamune',
    'orochi',
    'onikiri',
    'tsubame',
    'koken',
    'pan',
  ];
  for (const bladeId of ids) {
    const figure = { bladeId, blade: BLADES[bladeId] || null };
    const ink = render({ figure }),
      classic = render({ mode: 'classic', figure });
    assert.equal(ink.swords.length, 1, bladeId);
    assert.equal(ink.swords[0].id, bladeId);
    assert.deepEqual(classic.swords, [], bladeId);
  }
});

test('sprite charms replace the pouch but preserve the cord, alpha and Classic fallback', () => {
  const figure = { charmId: 'suzu', charm: '#abc123' };
  const ink = render({ figure, charmInk: true }),
    fallback = render({ figure }),
    classic = render({ figure, mode: 'classic' });
  assert.equal(ink.charms.length, 1);
  assert.equal(ink.charms[0].id, 'suzu');
  assert.ok(Math.abs(ink.charms[0].alpha - 0.42) < 1e-10);
  assert.ok(!ink.fills.includes('#abc123'));
  assert.ok(fallback.fills.includes('#abc123'));
  assert.ok(classic.fills.includes('#abc123'));
  assert.deepEqual(classic.charms, []);
});
