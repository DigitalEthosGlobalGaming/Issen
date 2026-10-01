import { createItems } from '../../src/game/content/items.ts';
import { createInkCharmRenderer } from '../../src/rendering/figures/ink-charms.ts';
import { supportsInkBlade } from '../../src/rendering/figures/blade-recipes.ts';
import { BLADES } from '../../src/game/content/cosmetics.ts';
import { enemyAppearance } from '../../src/rendering/figures/enemy-appearance.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFigureRenderer } from '../../src/rendering/figures/figure.ts';
import { createPalette } from '../../src/rendering/palette.ts';
import { ROBES } from '../../src/game/content/cosmetics.ts';
import { makeFig, EPOSE } from '../../src/rendering/figures/model.ts';

function render({ body = true, enemy = false, charmInk = false, sword = true, figure = {} } = {}) {
  const calls = {
    companions: [],
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
    inkCompanion: {
      draw(type, _g, x, y, size) {
        calls.companions.push({ type, x, y, size });
        return true;
      },
    },
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
        calls.order.push('weapon');
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

test('modular hooks preserve opacity and never substitute removed geometry when unavailable', () => {
  const ready = render(),
    missing = render({ body: false, sword: false });
  for (const calls of [ready, missing]) {
    assert.deepEqual(
      calls.parts.map((call) => call.part),
      ['arms', 'body', 'head'],
    );
    assert.equal(calls.swords.length, 1);
    assert.equal(calls.steelGradients, 0);
    for (const call of [...calls.parts, ...calls.swords])
      assert.ok(Math.abs(call.alpha - 0.42) < 1e-10);
  }
  assert.deepEqual(missing.fills, ready.fills);
  assert.deepEqual(missing.strokes, ready.strokes);
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
  assert.equal(twin.swords.length, 2, 'both swords use modular artwork');
  const spear = render({ enemy: true, figure: { back: false, spear: 1 } });
  assert.equal(spear.steelGradients, 0, 'spear retains its existing drawing');
});

test('every primary outfit uses the shared Ink puppet without a mode gate', () => {
  for (const robeId of Object.keys(ROBES)) {
    const figure = {
      robeId,
      variant: ROBES[robeId].variant,
      rf: ROBES[robeId],
      cape: ROBES[robeId].cape,
      coat: ROBES[robeId].coat,
    };
    const ink = render({ figure });
    assert.deepEqual(
      ink.parts.map((c) => c.part),
      ['arms', 'body', 'head'],
      robeId,
    );
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
    const ink = render({ figure });
    assert.equal(ink.swords.length, 1, bladeId);
    assert.equal(ink.swords[0].id, bladeId);
  }
});

test('sprite charms preserve the cord and alpha without a rectangle fallback', () => {
  const figure = { charmId: 'suzu', charm: '#abc123' };
  for (const charmInk of [true, false]) {
    const calls = render({ figure, charmInk });
    assert.equal(calls.charms[0].id, 'suzu');
    assert.ok(Math.abs(calls.charms[0].alpha - 0.42) < 1e-10);
    assert.ok(!calls.fills.includes('#abc123'));
    assert.ok(calls.strokes.some((call) => call.style === '#d9d3c4'));
  }
});

test('Ink recipes cover the complete item catalog including trial and progression charms', () => {
  const items = createItems(() => new Set());
  const charms = items
    .filter((i) => i.type === 'charm' && i.id !== 'nocharm')
    .map((i) => i.id)
    .sort();
  const kit = createInkCharmRenderer({});
  assert.deepEqual(kit.snapshot().supported.sort(), charms);
  kit.dispose();
  for (const item of items.filter((i) => i.type === 'blade'))
    assert.ok(supportsInkBlade(item.id), item.id);
  for (const item of items.filter((i) => i.type === 'robe'))
    assert.ok(Object.hasOwn(ROBES, item.id), item.id);
});

test('crow follows the shoulder lean and figures never draw body-attached grass', () => {
  for (const lean of [-0.08, 0, 0.08]) {
    const calls = render({ figure: { pet: 'crow', lean, rot: 0.3 } });
    assert.deepEqual(calls.companions[0], {
      type: 'crow',
      x: 0.14 + lean * 0.8,
      y: -0.755,
      size: 0.1,
    });
    const grass = createPalette().fog(0, [100, 110, 120]).grass;
    assert.ok(!calls.fills.includes(grass), 'ground grass must remain in scene coordinates');
  }
});
