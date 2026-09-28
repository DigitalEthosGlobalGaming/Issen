import { expect, test } from '@playwright/test';

test('player sword is behind the back-facing body', async ({ page }) => {
  // Known regression: keep the intended depth contract executable while investigating.
  test.fail();
  await page.goto('/');
  const order = await page.evaluate(async () => {
    const { createFigureRenderer } = await import('/src/rendering/figures/figure.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig } = await import('/src/rendering/figures/model.ts');
    const { REST_POSE } = await import('/src/rendering/figures/player.ts');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const palette = createPalette().fog(0, [146, 141, 132]);
    context.fillStyle = palette.obi;
    const obi = context.fillStyle;
    const order: string[] = [];
    const g = new Proxy(context, {
      get(target, key) {
        if (key === 'fillRect') return (x: number, y: number, w: number, h: number) => {
          if (x === -0.15 && y === -0.012 && w === 0.155 && h === 0.024) order.push('sword');
          return target.fillRect(x, y, w, h);
        };
        if (key === 'fill') return (...args: Parameters<CanvasRenderingContext2D['fill']>) => {
          if (target.fillStyle === obi) order.push('body');
          return target.fill(...args);
        };
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, key, value) { return Reflect.set(target, key, value, target); },
    });
    createFigureRenderer(g, { time: 0, wind: 0, petActive: false, width: 400, height: 400, palette: () => palette, random: () => 0.5 })
      .drawFigure({ x: 200, y: 300, h: 120, fog: 0, d: makeFig(7), pose: REST_POSE, back: true, noShadow: true });
    return order;
  });
  expect(order).toContain('sword');
  expect(order).toContain('body');
  expect(order.indexOf('sword')).toBeLessThan(order.indexOf('body'));
});

test('enemy attack arms sit behind the sword blade', async ({ page }) => {
  test.fail();
  await page.goto('/');
  const order = await page.evaluate(async () => {
    const { createFigureRenderer } = await import('/src/rendering/figures/figure.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig, EPOSE } = await import('/src/rendering/figures/model.ts');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const palette = createPalette().fog(0, [146, 141, 132]);
    const order: string[] = [];
    const g = new Proxy(context, {
      get(target, key) {
        if (key === 'fillRect') return (x: number, y: number, w: number, h: number) => {
          if (x === -0.15 && y === -0.012 && w === 0.155 && h === 0.024) order.push('sword');
          return target.fillRect(x, y, w, h);
        };
        if (key === 'stroke') return (...args: Parameters<CanvasRenderingContext2D['stroke']>) => {
          if (Math.abs(target.lineWidth - 0.075) < 0.001) order.push('arm');
          return target.stroke(...args);
        };
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, key, value) { return Reflect.set(target, key, value, target); },
    });
    createFigureRenderer(g, { time: 0, wind: 0, petActive: false, width: 400, height: 400, palette: () => palette, random: () => 0.5 })
      .drawFigure({ x: 200, y: 300, h: 120, fog: 0, d: makeFig(9), pose: EPOSE.down, noShadow: true });
    return order;
  });
  expect(order.filter((part) => part === 'arm')).toHaveLength(2);
  expect(order.indexOf('arm')).toBeLessThan(order.indexOf('sword'));
});

// These regressions exercise established gameplay; onboarding has dedicated coverage.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta')) {
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({
          tutorial: 'skipped',
          bossMilestone: 3,
          revealSeen: 3,
        }),
      );
    }
  });
});

test('armory preview effects stay local to their renderer instance', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const previewPath = '/src/rendering/armory-preview.ts';
    const modelPath = '/src/rendering/figures/model.ts';
    const palettePath = '/src/rendering/palette.ts';
    const { createArmoryPreview } = await import(previewPath);
    const { makeFig } = await import(modelPath);
    const { createPalette } = await import(palettePath);
    let now = 1000,
      slices = 0;
    const silent = () => {};
    const services = {
      random: () => 0.5,
      now: () => now,
      sounds: {
        zap: silent,
        shatter: silent,
        poof: silent,
        crackle: silent,
        popper: silent,
        squeak: silent,
        bonk: silent,
        slice: () => slices++,
        clink: silent,
      },
    };
    const canvases = Array.from({ length: 2 }, () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 440;
      return canvas;
    });
    const palette = createPalette();
    const frame = {
      time: 1,
      wind: 0,
      petActive: false,
      palette: (fog: number) => palette.fog(fog, [146, 141, 132]),
      background: null,
      appearance: { d: makeFig(12) },
      pet: 'nopet',
      film: 'mono',
      effectsVisible: true,
      font: 'serif',
      seal: '#a3271d',
      mistSprite: null,
    };
    const first = createArmoryPreview(canvases[0], services);
    const second = createArmoryPreview(canvases[1], services);
    first.draw(frame);
    second.draw(frame);
    const before = canvases[1].toDataURL();
    first.demo('petals', false);
    now += 16;
    first.draw(frame);
    second.draw(frame);
    return {
      unaffected: canvases[1].toDataURL() === before,
      different: canvases[0].toDataURL() !== canvases[1].toDataURL(),
      slices,
    };
  });
  expect(result).toEqual({ unaffected: true, different: true, slices: 1 });
});

test('share cards preserve the source and render deterministic mode variants', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    const modulePath = '/src/ui/share-card.ts';
    const { createShareCard } = await import(modulePath);
    const source = document.createElement('canvas');
    source.width = 390;
    source.height = 844;
    const context = source.getContext('2d')!;
    context.fillStyle = '#ff0000';
    context.fillRect(0, 0, 390, 844);
    const before = source.toDataURL();
    const options = {
      stage: { n: 'Bamboo', k: '竹' },
      font: 'serif',
      seal: '#a3271d',
      date: new Date(2026, 8, 27),
    };
    const variants: string[] = [];
    for (const flags of [
      { mode: 'normal', zen: false, rush: false },
      { mode: 'ronin', zen: true, rush: false },
      { mode: 'normal', zen: false, rush: true },
    ]) {
      const run = Object.freeze({
        ...flags,
        blade: false,
        hard: false,
        reason: 'quit',
        maxCombo: 12,
        cardScore: 420,
        bossesSlain: 1,
        wave: 3,
        kills: 20,
        perfects: 10,
        hits: 2,
      });
      const card = createShareCard(source, run, options);
      if (card === source || card.width !== 1080 || card.height !== 1350)
        throw new Error('Invalid output canvas');
      const pixel = Array.from(card.getContext('2d')!.getImageData(540, 100, 1, 1).data);
      if (pixel.join(',') !== '255,0,0,255') throw new Error('Source image was not copied');
      const encoded = card.toDataURL();
      if (encoded !== createShareCard(source, run, options).toDataURL())
        throw new Error('Non-deterministic card');
      variants.push(encoded);
    }
    return { unchanged: source.toDataURL() === before, distinct: new Set(variants).size };
  });
  expect(results).toEqual({ unchanged: true, distinct: 3 });
});

test('weather layers render in both orientations without mutating simulation state', async ({
  page,
}) => {
  await page.goto('/');
  const count = await page.evaluate(async () => {
    const drawPath = '/src/rendering/scene/weather-draw.ts';
    const particlePath = '/src/rendering/scene/weather-particles.ts';
    const statePath = '/src/rendering/scene/weather-state.ts';
    const { createWeatherRenderer } = await import(drawPath);
    const { createWeatherParticles } = await import(particlePath);
    const { createWeatherState } = await import(statePath);
    let count = 0;
    for (const [width, height] of [
      [390, 844],
      [844, 390],
    ]) {
      for (const weather of ['rain', 'storm', 'snow', 'sakura', 'smoke', 'bamboo']) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const g = canvas.getContext('2d')!;
        const { particles, bamboo } = createWeatherParticles(weather, width, height, 1, () => 0.5);
        const state = createWeatherState(() => 0.5);
        state.veil = 0.5;
        state.surge = 1;
        state.wo = 0.4;
        state.banks.push({
          x: width / 2,
          y: height / 2,
          v: 1,
          puffs: [{ dx: 0, dy: 0, s: 20, a: 1 }],
        });
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 16;
        sprite.getContext('2d')!.fillRect(0, 0, 16, 16);
        const before = JSON.stringify({ particles, bamboo, state });
        const renderer = createWeatherRenderer(g, {
          weather,
          width,
          height,
          scale: 1,
          time: 1,
          wind: 1,
          hazard: 0.5,
          particles,
          bamboo,
          state,
          smokeSprite: sprite,
        });
        renderer.drawWeather();
        renderer.drawBamboo();
        if (weather === 'smoke') renderer.drawSmoke();
        if (before !== JSON.stringify({ particles, bamboo, state }))
          throw new Error('Renderer changed weather state');
        if (g.globalAlpha !== 1 || g.globalCompositeOperation !== 'source-over')
          throw new Error('Context leaked');
        if (!g.getImageData(0, 0, width, height).data.some((v, i) => i % 4 === 3 && v > 0))
          throw new Error(`Empty ${weather}`);
        count++;
      }
    }
    return count;
  });
  expect(count).toBe(12);
});

test('all decorative particles render on their own canvas without mutating effect state', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const statePath = '/src/rendering/effects/state.ts';
    const drawPath = '/src/rendering/effects/draw.ts';
    const { createEffects } = await import(statePath);
    const { createEffectRenderer } = await import(drawPath);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 200;
    const g = canvas.getContext('2d')!;
    const other = document.createElement('canvas');
    other.getContext('2d')!.fillRect(0, 0, 10, 10);
    const untouched = other.toDataURL();
    let rendered = 0;
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
    ]) {
      const fx = createEffects();
      fx.px.push({
        k,
        x: 100,
        y: 100,
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
      const renderer = createEffectRenderer(g, fx, {
        scale: 1,
        time: 1,
        font: 'serif',
        seal: '#a3271d',
        mistSprite: null,
      });
      g.clearRect(0, 0, 200, 200);
      renderer.drawFx();
      renderer.drawFx2();
      renderer.drawStains();
      renderer.drawPops();
      renderer.drawStamps();
      if (before !== JSON.stringify(fx)) throw new Error('Drawing mutated simulation');
      if (g.globalCompositeOperation !== 'source-over') throw new Error('Composite mode leaked');
      if (!g.getImageData(0, 0, 200, 200).data.some((v, i) => i % 4 === 3 && v > 0))
        throw new Error(`Empty ${k}`);
      rendered++;
    }
    return { rendered, isolated: untouched === other.toDataURL() };
  });
  expect(result).toEqual({ rendered: 14, isolated: true });
});

test('figure renderer draws every blade and robe without touching another canvas', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const figurePath = '/src/rendering/figures/figure.ts';
    const modelPath = '/src/rendering/figures/model.ts';
    const palettePath = '/src/rendering/palette.ts';
    const contentPath = '/src/game/content/cosmetics.ts';
    const { createFigureRenderer } = await import(figurePath);
    const { makeFig, EPOSE } = await import(modelPath);
    const { createPalette } = await import(palettePath);
    const { BLADES, ROBES } = await import(contentPath);
    const palette = createPalette();
    const live = document.createElement('canvas');
    live.getContext('2d')!.fillRect(0, 0, 20, 20);
    const before = live.toDataURL();
    const preview = document.createElement('canvas');
    preview.width = 390;
    preview.height = 844;
    const g = preview.getContext('2d')!;
    const renderer = createFigureRenderer(g, {
      time: 1,
      wind: 0.5,
      petActive: false,
      width: 390,
      height: 844,
      palette: (fog: number) => palette.fog(fog, [146, 141, 132]),
      random: () => 0.5,
    });
    let count = 0;
    const draw = (extra: object) => {
      g.clearRect(0, 0, 390, 844);
      renderer.drawFigure({
        x: 195,
        y: 700,
        h: 400,
        fog: 0,
        d: makeFig(42),
        pose: EPOSE.guard,
        ...extra,
      });
      if (!g.getImageData(0, 0, 390, 844).data.some((v, i) => i % 4 === 3 && v > 0))
        throw new Error('Empty figure');
      if (g.globalAlpha !== 1 || g.globalCompositeOperation !== 'source-over')
        throw new Error('Context state leaked');
      count++;
    };
    for (const blade of Object.values(BLADES)) draw({ blade });
    for (const [id, robe] of Object.entries(ROBES))
      draw({ ...(robe as object), rf: robe, pal: palette.robe(id), back: true });
    return {
      count,
      expected: Object.keys(BLADES).length + Object.keys(ROBES).length,
      isolated: before === live.toDataURL(),
    };
  });
  expect(result.count).toBe(result.expected);
  expect(result.count).toBeGreaterThan(20);
  expect(result.isolated).toBe(true);
});

test('every stage renders in both orientations with deterministic scenery', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const path = '/src/rendering/scene/background.ts';
    const { createBackground } = await import(path);
    const images: string[] = [];
    for (const [width, height] of [
      [390, 844],
      [844, 390],
    ]) {
      for (let stage = 0; stage < 9; stage++) {
        const { canvas, glows } = createBackground(width, height, 1, stage);
        if (canvas.width !== width || canvas.height !== height)
          throw new Error('Incorrect dimensions');
        if (glows.some((glow: { r: number }) => glow.r <= 0))
          throw new Error('Invalid glow radius');
        images.push(canvas.toDataURL());
      }
    }
    return {
      unique: new Set(images).size,
      deterministic: images[0] === createBackground(390, 844, 1, 0).canvas.toDataURL(),
    };
  });
  expect(result).toEqual({ unique: 18, deterministic: true });
});

test('tree polish review preserves stage composition in both orientations', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const path = '/src/rendering/scene/background.ts';
    const stagesPath = '/src/game/content/stages.ts';
    const { createBackground } = await import(path);
    const { STAGES } = await import(stagesPath);
    const sheet = document.createElement('div');
    sheet.id = 'treeReview';
    sheet.style.cssText =
      'position:relative;z-index:99999;background:#171512;color:white;display:grid;grid-template-columns:repeat(4,390px);gap:8px;width:max-content';
    for (const stage of [0, 2, 6, 7]) {
      const column = document.createElement('div');
      const label = document.createElement('p');
      label.textContent = STAGES[stage].n;
      column.append(label);
      for (const [w, h] of [
        [390, 844],
        [844, 390],
      ]) {
        const { canvas } = createBackground(w, h, 1, stage);
        canvas.style.width = '390px';
        canvas.style.height = `${(h / w) * 390}px`;
        column.append(canvas);
      }
      sheet.append(column);
    }
    document.body.replaceChildren(sheet);
    document.body.style.cssText = 'overflow:visible;width:max-content;height:auto';
  });
  await page.setViewportSize({ width: 1600, height: 1120 });
  await page.locator('#treeReview').screenshot({ path: testInfo.outputPath('tree-review.png') });
  await testInfo.attach('Trees: field, blossoms, burning temple and shore', {
    path: testInfo.outputPath('tree-review.png'),
    contentType: 'image/png',
  });
});

test('film effects restore context state and leave other canvases untouched', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const path = '/src/rendering/effects/film.ts';
    const { applyFilm } = await import(path);
    const live = document.createElement('canvas');
    const preview = document.createElement('canvas');
    const liveContext = live.getContext('2d')!;
    const previewContext = preview.getContext('2d')!;
    liveContext.fillStyle = 'red';
    liveContext.fillRect(0, 0, 30, 30);
    previewContext.fillStyle = 'blue';
    previewContext.fillRect(0, 0, 30, 30);
    previewContext.globalAlpha = 0.7;
    const before = live.toDataURL();
    const { createItems } = await import('/src/game/content/items.ts');
    for (const { id: film } of createItems(() => new Set()).filter(
      (item: { type: string }) => item.type === 'film',
    )) {
      applyFilm(previewContext, 30, 30, preview, film);
      if (previewContext.globalCompositeOperation !== 'source-over')
        throw new Error('Composition leaked');
      if (Math.abs(previewContext.globalAlpha - 0.7) > 0.001) throw new Error('Alpha leaked');
    }
    return before === live.toDataURL();
  });
  expect(result).toBe(true);
});
