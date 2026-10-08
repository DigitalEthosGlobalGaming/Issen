import { expect, test } from '@playwright/test';

test('native equipment and death poses retain colour-art coverage and isolated draw state', async ({
  page,
}, info) => {
  await page.goto('/privacy/index.html');
  const warnings: string[] = [];
  page.on('pageerror', (error) => warnings.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('PixiJS'))
      warnings.push(message.text());
  });
  const results = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { createFigureRenderer } = await import('/src/rendering/figures/figure.ts');
    const { createInkPlayerRenderer } = await import('/src/rendering/figures/ink-player.ts');
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const { createInkCharmRenderer } = await import('/src/rendering/figures/ink-charms.ts');
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const { applyDeathPose } = await import('/src/rendering/figures/death.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { BLADES, ROBES } = await import('/src/game/content/cosmetics.ts');
    const artwork = {
      inkPlayer: createInkPlayerRenderer(document),
      inkEnemy: createInkEnemyRenderer(document),
      inkSword: createInkSwordRenderer(document),
      inkCharm: createInkCharmRenderer(document),
      inkCompanion: createInkCompanionRenderer(document),
    };
    await Promise.all(Object.values(artwork).map((owner) => owner.prepare()));
    const native = document.createElement('canvas'),
      reference = document.createElement('canvas'),
      copy = document.createElement('canvas');
    for (const canvas of [native, reference, copy]) canvas.width = canvas.height = 320;
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const painter = await createPixiScenePainter(native),
      canvas = await createTestDrawing(reference),
      read = copy.getContext('2d')!;
    const palette = createPalette();
    const environment = {
      ...artwork,
      time: 1.25,
      wind: 0.5,
      petActive: false,
      width: 320,
      height: 320,
      palette: (fog: number) => palette.fog(fog, [146, 141, 132]),
      random: () => 0.5,
    };
    const renderers = [
      createFigureRenderer(painter, environment),
      createFigureRenderer(canvas, environment),
    ];
    document.body.replaceChildren();
    document.body.style.cssText =
      'margin:0;padding:0;max-width:none;background:#ddd6c8;display:grid;grid-template-columns:repeat(5,160px);font:12px sans-serif';
    const samples = [];
    const figure = () => ({
      x: 160,
      y: 280,
      h: 210,
      fog: 0,
      d: makeFig(42),
      pose: { ...EPOSE.guard },
      back: true,
      robeId: Object.keys(ROBES)[0]!,
      bladeId: 'steel',
    });
    const draw = (id: string, make: () => any, death = '') => {
      painter.begin();
      canvas.clearRect(0, 0, 320, 320);
      for (const renderer of renderers) {
        const f = make();
        if (death === 'split') renderer.drawSplit(f, { x: f.x, y: f.y, h: f.h }, 0.4, 0.25, 1.1);
        else if (death === 'scatter') renderer.drawScattered(f, 0.4, 0.25);
        else {
          if (death) applyDeathPose(f, death, 0.25, -1, false);
          renderer.drawFigure(f);
        }
      }
      painter.flush();
      read.clearRect(0, 0, 320, 320);
      read.drawImage(native, 0, 0);
      const actual = read.getImageData(0, 0, 320, 320).data,
        expected = canvas.getImageData(0, 0, 320, 320).data;
      let nativeAlpha = 0,
        canvasAlpha = 0,
        alphaDifference = 0;
      for (let i = 3; i < actual.length; i += 4) {
        nativeAlpha += actual[i]!;
        canvasAlpha += expected[i]!;
        alphaDifference += Math.abs(actual[i]! - expected[i]!);
      }
      samples.push({
        id,
        ratio: nativeAlpha / Math.max(1, canvasAlpha),
        coverage: canvasAlpha,
        alphaDifference: alphaDifference / Math.max(1, canvasAlpha),
      });
      if (painter.globalAlpha !== 1 || painter.globalCompositeOperation !== 'source-over')
        throw new Error('Leaked state: ' + id);
      const cell = document.createElement('div'),
        label = document.createElement('p'),
        image = document.createElement('canvas');
      label.textContent = id;
      image.width = image.height = 160;
      image.getContext('2d')!.drawImage(copy, 0, 0, 160, 160);
      cell.append(label, image);
      document.body.append(cell);
    };
    for (const [id, blade] of Object.entries(BLADES))
      draw('blade ' + id, () => ({ ...figure(), bladeId: id, blade }));
    for (const [id, robe] of Object.entries(ROBES))
      draw('robe ' + id, () => ({
        ...figure(),
        ...robe,
        robeId: id,
        rf: robe,
        pal: palette.robe(id),
      }));
    for (const death of ['split', 'scatter', 'kneel', 'stagger', 'disarm', 'fall', 'crumple'])
      draw(death, () => ({ ...figure(), back: false, variant: 'ronin', varied: true }), death);
    canvas.dispose();
    painter.dispose();
    for (const owner of Object.values(artwork)) owner.dispose();
    return samples;
  });
  await page.setViewportSize({ width: 800, height: 800 });
  await page.screenshot({ path: info.outputPath('equipment-and-deaths.png'), fullPage: true });
  expect(warnings).toEqual([]);
  expect(results.length).toBeGreaterThan(40);
  for (const result of results) {
    expect(result.coverage, result.id).toBeGreaterThan(10000);
    expect(result.ratio, JSON.stringify(result)).toBeGreaterThan(0.9);
    expect(
      result.ratio,
      JSON.stringify(
        results.filter(
          (sample) => sample.ratio > 1.1 || sample.ratio < 0.9 || sample.alphaDifference > 0.13,
        ),
      ),
    ).toBeLessThan(1.1);
    expect(result.alphaDifference, JSON.stringify(result)).toBeLessThan(0.13);
  }
});

test('native weather and decorative particles draw without advancing their simulation', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const count = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { createWeatherRenderer } = await import('/src/rendering/scene/weather-draw.ts');
    const { createWeatherParticles } = await import('/src/rendering/scene/weather-particles.ts');
    const { createWeatherState } = await import('/src/rendering/scene/weather-state.ts');
    const { createEffectRenderer } = await import('/src/rendering/effects/draw.ts');
    const { createEffects } = await import('/src/rendering/effects/state.ts');
    const native = document.createElement('canvas'),
      copy = document.createElement('canvas'),
      sprite = document.createElement('canvas');
    native.width = copy.width = 320;
    native.height = copy.height = 240;
    sprite.width = sprite.height = 16;
    sprite.getContext('2d')!.fillRect(0, 0, 16, 16);
    const painter = await createPixiScenePainter(native),
      read = copy.getContext('2d')!;
    let count = 0;
    const verify = (name: string) => {
      painter.flush();
      read.clearRect(0, 0, 320, 240);
      read.drawImage(native, 0, 0);
      if (!read.getImageData(0, 0, 320, 240).data.some((v, i) => i % 4 === 3 && v > 0))
        throw new Error('Empty ' + name);
      if (painter.globalAlpha !== 1 || painter.globalCompositeOperation !== 'source-over')
        throw new Error('Leaked state ' + name);
      count++;
    };
    for (const weather of ['rain', 'storm', 'snow', 'sakura', 'smoke'] as const) {
      const { particles, bamboo } = createWeatherParticles(weather, 320, 240, 1, () => 0.5),
        state = createWeatherState(() => 0.5);
      state.veil = 0.5;
      state.surge = 1;
      state.wo = 0.4;
      state.banks.push({ x: 160, y: 120, v: 1, puffs: [{ dx: 0, dy: 0, s: 20, a: 1 }] });
      const before = JSON.stringify({ particles, bamboo, state });
      painter.begin();
      const draw = createWeatherRenderer(painter, {
        weather,
        width: 320,
        height: 240,
        scale: 1,
        time: 1,
        wind: 1,
        hazard: 0.5,
        particles,
        bamboo,
        state,
        smokeSprite: sprite,
      });
      draw.drawWeather();
      if (weather === 'smoke') draw.drawSmoke();
      verify(weather);
      if (before !== JSON.stringify({ particles, bamboo, state }))
        throw new Error('Weather advanced');
    }
    for (const k of [
      'moon',
      'star',
      'lantern',
      'crane',
      'koi',
      'puff',
      'wave',
      'crack',
      'flake',
      'soul',
      'maple',
      'fw',
      'conf',
      'duck',
    ] as const) {
      const fx = createEffects();
      fx.px.push({
        k,
        x: 160,
        y: 120,
        s: 20,
        t: 0.2,
        life: 1,
        rot: 0.2,
        ph: 1,
        vx: 10,
        vy: -10,
        c: '#d8642a',
        pts: [
          [-1, -1],
          [0, 0.3],
          [1, 1],
        ],
      });
      const before = JSON.stringify(fx);
      painter.begin();
      const draw = createEffectRenderer(painter, fx, {
        scale: 1,
        time: 1,
        font: 'serif',
        seal: '#a3271d',
        mistSprite: null,
      });
      draw.drawFx();
      draw.drawFx2();
      draw.drawStains();
      draw.drawPops();
      draw.drawStamps();
      verify(k);
      if (before !== JSON.stringify(fx)) throw new Error('Effects advanced');
    }
    painter.dispose();
    return count;
  });
  expect(errors).toEqual([]);
  expect(count).toBe(19);
});
