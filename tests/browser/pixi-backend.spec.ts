import { expect, test } from '@playwright/test';

test('drawing the same prepared scene twice preserves poses, RNG, post state and haptics', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { drawHaptics: 0 });
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: () => {
        (window as any).drawHaptics++;
        return true;
      },
    });
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'frameLoop.start();',
        'window.__preparedScene = { frameLoop, preparePresentation, drawScene, snapshot: () => JSON.stringify({ G, P, fx, postState, shake, rng: runRandom.state(), saves: Object.entries(localStorage), haptics: window.drawHaptics }) }; frameLoop.start();',
      ),
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__preparedScene);
  const result = await page.evaluate(() => {
    const harness = (window as any).__preparedScene;
    harness.frameLoop.stop();
    const frame = harness.preparePresentation(1 / 60);
    const source = document.querySelector<HTMLCanvasElement>('#c')!;
    const copy = document.createElement('canvas');
    copy.width = source.width;
    copy.height = source.height;
    const read = copy.getContext('2d')!;
    const capture = () => {
      read.clearRect(0, 0, copy.width, copy.height);
      read.drawImage(source, 0, 0);
      return read.getImageData(0, 0, copy.width, copy.height).data;
    };
    const before = harness.snapshot();
    harness.drawScene(frame);
    const first = capture();
    harness.drawScene(frame);
    const second = capture();
    let changed = 0,
      maximum = 0;
    const points = [];
    for (let index = 0; index < first.length; index++)
      if (first[index] !== second[index]) {
        changed++;
        maximum = Math.max(maximum, Math.abs(first[index]! - second[index]!));
        if (points.length < 10)
          points.push([
            Math.floor(index / 4) % source.width,
            Math.floor(index / 4 / source.width),
            first[index],
            second[index],
          ]);
      }
    return {
      unchanged: before === harness.snapshot(),
      fractionChanged: changed / first.length,
      changed,
      maximum,
      points,
    };
  });
  expect(result.unchanged).toBe(true);
  // GPU antialias/blend rounding can differ by a byte at isolated part edges.
  // The state comparison is exact; the image comparison has a bounded tolerance.
  expect(result.maximum, JSON.stringify(result)).toBeLessThanOrEqual(2);
  expect(result.fractionChanged, JSON.stringify(result)).toBeLessThan(0.01);
});

test('unavailable WebGL initializes a playable Canvas surface with the same saves', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ tutorial: 'skipped' }));
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind.includes('webgl')) return null;
      return Reflect.apply(get, this, [kind, ...args]);
    } as typeof get;
  });
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-graphics-backend', 'canvas');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.keyboard.press('p');
  await expect(page.locator('#bResume')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).tutorial)).toBe(
    'skipped',
  );
});

test('unused native texture sources expire without invalidating retained draws', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('PixiJS'))
      warnings.push(message.text());
  });
  await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const source = document.createElement('canvas');
    source.width = source.height = 8;
    source.getContext('2d')!.fillRect(0, 0, 8, 8);
    const painter = await createPixiScenePainter(canvas);
    painter.begin();
    painter.drawImage(source, 0, 0);
    painter.flush();
    for (let i = 0; i < 125; i++) {
      painter.begin();
      painter.fillStyle = '#fff';
      painter.fillRect(0, 0, 16, 16);
      painter.flush();
    }
    painter.begin();
    painter.drawImage(source, 0, 0);
    painter.flush();
    painter.dispose();
  });
  expect(warnings).toEqual([]);
});

test('native gradients and reused grain follow Canvas transforms, including high DPI', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const comparison = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const native = document.createElement('canvas'),
      reference = document.createElement('canvas');
    native.width = reference.width = 192;
    native.height = reference.height = 128;
    const painter = await createPixiScenePainter(native),
      canvas = reference.getContext('2d')!;
    const tile = document.createElement('canvas');
    tile.width = tile.height = 8;
    const ink = tile.getContext('2d')!;
    ink.fillStyle = '#ff0000';
    ink.fillRect(0, 0, 4, 8);
    ink.fillStyle = '#0000ff';
    ink.fillRect(4, 0, 4, 8);
    const paint = (g: typeof painter | CanvasRenderingContext2D) => {
      g.setTransform(2, 0, 0, 2, 0, 0);
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 96, 64);
      const pattern = g.createPattern(tile, 'repeat')!;
      g.save();
      g.translate(3, 0);
      g.fillStyle = pattern;
      g.fillRect(0, 0, 24, 12);
      g.restore();
      g.save();
      g.translate(33, 0);
      g.fillStyle = pattern;
      g.fillRect(0, 0, 24, 12);
      g.restore();
      g.save();
      g.translate(40, 40);
      g.scale(2, 0.5);
      g.rotate(0.35);
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, 14);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(1, '#000000');
      g.fillStyle = glow;
      g.fillRect(-18, -18, 36, 36);
      g.restore();
    };
    // Reusing a pattern for more than the texture-cache grace period must not
    // evict its source while it is still being displayed.
    const persistent = painter.createPattern(tile, 'repeat')!;
    for (let i = 0; i < 123; i++) {
      painter.begin();
      painter.fillStyle = persistent;
      painter.fillRect(0, 0, 16, 16);
      painter.flush();
    }
    painter.begin();
    paint(painter);
    paint(canvas);
    painter.flush();
    const copy = document.createElement('canvas');
    copy.width = 192;
    copy.height = 128;
    const read = copy.getContext('2d')!;
    read.drawImage(native, 0, 0);
    const points = [
      [8, 8],
      [16, 8],
      [68, 8],
      [76, 8],
      [80, 80],
      [100, 80],
      [80, 88],
      [104, 84],
    ];
    const samples = points.map(([x, y]) => ({
      native: [...read.getImageData(x!, y!, 1, 1).data],
      canvas: [...canvas.getImageData(x!, y!, 1, 1).data],
    }));
    painter.dispose();
    return samples;
  });
  for (const sample of comparison) {
    for (let i = 0; i < 4; i++)
      expect(
        Math.abs(sample.native[i]! - sample.canvas[i]!),
        JSON.stringify(comparison),
      ).toBeLessThan(12);
  }
});

test('native Armoury and tutorial scenes keep their own targets and clocks', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?renderer=pixi');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink');
  await page.locator('#bArmory').click();
  await expect(page.locator('#prevC')).toHaveAttribute('data-graphics-backend', 'pixi');
  await page.waitForTimeout(600);
  await page.screenshot({ path: testInfo.outputPath('pixi-armoury.png') });
  await page.keyboard.press('Escape');
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await expect(page.locator('.tutorial-canvas')).toHaveAttribute('data-graphics-backend', 'pixi');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.tutorial-overlay')).toHaveAttribute('data-step', '1');
  await page.screenshot({ path: testInfo.outputPath('pixi-tutorial.png') });
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('lost auxiliary contexts fall back without advancing tutorial or touching saves', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?renderer=pixi');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.locator('#bArmory').click();
  await page
    .locator('#prevC')
    .evaluate((canvas: HTMLCanvasElement) =>
      canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext(),
    );
  await expect(page.locator('#prevC')).toHaveAttribute('data-context-state', 'lost');
  await expect(page.locator('#prevC')).toHaveAttribute('data-graphics-backend', 'canvas', {
    timeout: 12000,
  });
  await page.keyboard.press('Escape');
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await expect(page.locator('.tutorial-canvas')).toHaveAttribute('data-graphics-backend', 'pixi');
  const saves = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  await page
    .locator('.tutorial-canvas')
    .evaluate((canvas: HTMLCanvasElement) =>
      canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext(),
    );
  await expect(page.locator('.tutorial-canvas')).toHaveAttribute('data-context-state', 'lost');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.tutorial-overlay')).toHaveAttribute('data-step', '0');
  await expect(page.locator('.tutorial-canvas')).toHaveAttribute(
    'data-graphics-backend',
    'canvas',
    { timeout: 12000 },
  );
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.tutorial-overlay')).toHaveAttribute('data-step', '1');
  expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))).toBe(saves);
  expect(errors).toEqual([]);
});

for (const restore of [true, false]) {
  test(
    restore
      ? 'WebGL context restoration keeps combat paused until explicit resume'
      : 'unrestored WebGL context falls back to Canvas without resetting the run',
    async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem(
          'issen.meta',
          JSON.stringify({ tutorial: 'skipped', bossMilestone: 3, revealSeen: 3 }),
        );
        localStorage.setItem(
          'issen.guidedLessons',
          JSON.stringify({ order: true, bossParry: true }),
        );
      });
      await page.goto('/?renderer=pixi');
      await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink');
      await page.locator('#bPlay').click();
      await page.locator('#bBegin').click();
      const seed = await page.evaluate(
        () => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).seed,
      );
      const extension = await page.evaluateHandle(() =>
        document
          .querySelector<HTMLCanvasElement>('#c')!
          .getContext('webgl2')!
          .getExtension('WEBGL_lose_context')!,
      );
      await extension.evaluate((ext) => ext.loseContext());
      await expect(page.locator('#paused')).toHaveClass(/on/);
      await expect(page.locator('#bResume')).toBeDisabled();
      if (restore) {
        await extension.evaluate((ext) => ext.restoreContext());
        await expect(page.locator('#c')).toHaveAttribute('data-context-state', 'ready');
      } else {
        await expect(page.locator('#c')).toHaveAttribute('data-context-state', 'fallback', {
          timeout: 12000,
        });
        await expect(page.locator('#c')).toHaveAttribute('data-graphics-backend', 'canvas');
      }
      await expect(page.locator('#paused')).toHaveClass(/on/);
      await expect(page.locator('#bResume')).toBeEnabled();
      expect(
        await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).seed),
      ).toBe(seed);
      await page.locator('#bResume').click();
      await expect(page.locator('#paused')).not.toHaveClass(/on/);
    },
  );
}

test('every film runs on native Pixi with isolated feedback targets and restored drawing state', async ({
  page,
}) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.addInitScript(() => {
    const warn = console.warn;
    console.warn = (...args: unknown[]) => warn(...args, new Error('render warning').stack);
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('PixiJS'))
    )
      errors.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 64;
    const g = await createPixiScenePainter(canvas);
    const films = [
      'mono',
      'trial-inferno',
      'supporter-print',
      'trial-gold',
      'trial-glitch',
      'trial-dusk',
      'trial-dawn',
      'sepia',
      'silver',
      'noir',
      'cyan',
      'nitrate',
      'ukiyo',
      'koda',
    ];
    const captures: number[][] = [];
    for (const film of films) {
      g.begin();
      g.fillStyle = '#738b91';
      g.fillRect(0, 0, 96, 64);
      g.fillStyle = '#332211';
      g.fillRect(20, 20, 30, 30);
      applyFilm(g, 96, 64, canvas, film, 2, {});
      if (g.globalAlpha !== 1 || g.globalCompositeOperation !== 'source-over')
        throw new Error('Leaked film state: ' + film);
      g.flush();
      const copy = document.createElement('canvas');
      copy.width = 96;
      copy.height = 64;
      const c = copy.getContext('2d')!;
      c.drawImage(canvas, 0, 0);
      captures.push([...c.getImageData(48, 32, 1, 1).data]);
    }
    g.dispose();
    return { captures, count: films.length };
  });
  expect(errors).toEqual([]);
  expect(result.count).toBe(14);
  expect(result.captures.every((pixel) => pixel[3] === 255)).toBe(true);
  expect(new Set(result.captures.map((pixel) => pixel.join(','))).size).toBeGreaterThan(8);
});

test('native scene renders the actual title and playable combat with unchanged DOM controls', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('PixiJS'))
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ tutorial: 'skipped', bossMilestone: 3, revealSeen: 3 }),
    );
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  });
  await page.goto('/?renderer=pixi');
  await expect(page.locator('#c')).toHaveAttribute('data-graphics-backend', 'pixi');
  await page.screenshot({ path: testInfo.outputPath('pixi-title.png') });
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await expect(page.locator('#title')).not.toHaveClass(/on/);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: testInfo.outputPath('pixi-combat.png') });
  await page.keyboard.press('p');
  await expect(page.getByRole('button', { name: 'End run', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('scene geometry draws natively with transformed paths, gradients and scoped clipping', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = await createPixiScenePainter(canvas);
    g.begin();
    g.fillStyle = '#ff0000';
    g.fillRect(0, 0, 64, 64);
    g.save();
    g.translate(16, 16);
    g.scale(2, 2);
    g.beginPath();
    g.rect(0, 0, 8, 8);
    g.clip();
    g.fillStyle = '#0000ff';
    g.fillRect(-20, -20, 100, 100);
    g.restore();
    g.save();
    g.translate(40, 0);
    const gradient = g.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#000000');
    g.fillStyle = gradient;
    g.fillRect(0, 0, 24, 64);
    g.restore();
    g.flush();
    const copy = document.createElement('canvas');
    copy.width = copy.height = 64;
    const c = copy.getContext('2d')!;
    c.drawImage(canvas, 0, 0);
    const pixel = (x: number, y: number) => [...c.getImageData(x, y, 1, 1).data];
    const result = {
      red: pixel(4, 4),
      clipped: pixel(24, 24),
      outside: pixel(35, 24),
      light: pixel(50, 4),
      dark: pixel(50, 60),
    };
    g.begin();
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 64, 64);
    g.flush();
    c.clearRect(0, 0, 64, 64);
    c.drawImage(canvas, 0, 0);
    const next = pixel(24, 24);
    g.dispose();
    return { ...result, next };
  });
  expect(result.red).toEqual([255, 0, 0, 255]);
  expect(result.clipped).toEqual([0, 0, 255, 255]);
  expect(result.outside).toEqual([255, 0, 0, 255]);
  expect(result.light[1]).toBeGreaterThan(200);
  expect(result.dark[1]).toBeLessThan(40);
  expect(result.next).toEqual([255, 255, 255, 255]);
});

test('normal materials respond to lights and mirrored normals without changing transparent coverage', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const pixels = await page.evaluate(async () => {
    const { createPixiBackend } = await import('/src/rendering/pixi/backend.ts');
    const { IDENTITY } = await import('/src/rendering/scene-frame.ts');
    const canvas = document.createElement('canvas');
    const backend = await createPixiBackend(canvas);
    const makeTexture = (color: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 8;
      const g = source.getContext('2d')!;
      g.fillStyle = color;
      g.fillRect(0, 0, 8, 8);
      return { source, revision: 0 };
    };
    const texture = makeTexture('#808080');
    const normal = makeTexture('rgb(218,128,218)');
    const material = { normal, lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0] };
    const sprite = {
      kind: 'sprite',
      texture,
      transform: IDENTITY,
      width: 32,
      height: 32,
      alpha: 0.5,
      tint: 0xffffff,
      blend: 'normal',
      material,
    };
    const frame = {
      width: 32,
      height: 32,
      dpr: 1,
      time: 0,
      reducedMotion: false,
      reducedFlashes: false,
      sprites: [sprite],
      lighting: {
        ambient: [0.1, 0.1, 0.1],
        directional: [0.8, 0.8, 0.8],
        direction: [1, 0, 1],
        points: [],
      },
    };
    const capture = () => {
      backend.render(frame);
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      const g = c.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(16, 16, 1, 1).data];
    };
    const lit = capture();
    sprite.transform = { ...IDENTITY, a: -1, tx: 32 };
    const mirrored = capture();
    sprite.material = { ...material, lighting: 0, fog: 1, fogColor: [1, 0, 0] };
    const fogged = capture();
    backend.dispose();
    return { lit, mirrored, fogged };
  });
  expect(errors).toEqual([]);
  expect(pixels.lit[0]).toBeGreaterThan(100);
  expect(pixels.mirrored[0]).toBeLessThan(30);
  expect(pixels.lit[3]).toBeCloseTo(128, -1);
  expect(pixels.mirrored[3]).toBe(pixels.lit[3]);
  expect(pixels.fogged[0]).toBe(255);
  expect(pixels.fogged[1]).toBe(0);
});

test('native Pixi atlas sprites preserve order, transforms, revisions and target isolation', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiBackend } = await import('/src/rendering/pixi/backend.ts');
    const { IDENTITY } = await import('/src/rendering/scene-frame.ts');
    const target = document.createElement('canvas');
    const preview = document.createElement('canvas');
    const atlas = document.createElement('canvas');
    atlas.width = 20;
    atlas.height = 10;
    const ink = atlas.getContext('2d')!;
    ink.fillStyle = '#ff0000';
    ink.fillRect(0, 0, 10, 10);
    ink.fillStyle = '#0000ff';
    ink.fillRect(10, 0, 10, 10);
    const live = await createPixiBackend(target);
    const isolated = await createPixiBackend(preview);
    const lighting = {
      ambient: [1, 1, 1],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
    };
    const back = {
      kind: 'sprite',
      texture: { source: atlas, revision: 0, frame: [0, 0, 10, 10] },
      transform: IDENTITY,
      width: 32,
      height: 32,
      alpha: 1,
      tint: 0xffffff,
      blend: 'normal',
    };
    const front = {
      ...back,
      texture: { source: atlas, revision: 0, frame: [10, 0, 10, 10] },
      transform: { ...IDENTITY, tx: 8, ty: 8 },
      width: 16,
      height: 16,
      alpha: 0.5,
    };
    const frame = {
      width: 32,
      height: 32,
      dpr: 1,
      time: 0,
      reducedMotion: false,
      reducedFlashes: false,
      sprites: [back, front],
      lighting,
    };
    const sample = (canvas: HTMLCanvasElement, x: number, y: number) => {
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(x, y, 1, 1).data];
    };
    live.render(frame);
    const border = sample(target, 3, 3);
    const overlap = sample(target, 16, 16);
    const retainedInput = JSON.stringify(frame, (key, value) =>
      key === 'source' ? 'atlas' : value,
    );
    live.render(frame);
    const repeat = sample(target, 16, 16);
    const unchanged =
      retainedInput === JSON.stringify(frame, (key, value) => (key === 'source' ? 'atlas' : value));
    isolated.render({ ...frame, sprites: [back] });
    const previewPixel = sample(preview, 16, 16);
    isolated.dispose();
    ink.fillStyle = '#00ff00';
    ink.fillRect(0, 0, 10, 10);
    live.render({ ...frame, sprites: [{ ...back, texture: { ...back.texture, revision: 1 } }] });
    const updated = sample(target, 16, 16);
    live.render({ ...frame, width: 64, height: 48, dpr: 2, sprites: [back] });
    const dimensions = [target.width, target.height];
    live.dispose();
    live.dispose();
    return {
      border,
      overlap,
      repeat,
      unchanged,
      previewPixel,
      updated,
      dimensions,
      sourceSize: [atlas.width, atlas.height],
    };
  });
  expect(result.border).toEqual([255, 0, 0, 255]);
  expect(result.overlap[0]).toBeGreaterThanOrEqual(126);
  expect(result.overlap[0]).toBeLessThanOrEqual(129);
  expect(result.overlap[2]).toBeGreaterThanOrEqual(126);
  expect(result.overlap[2]).toBeLessThanOrEqual(129);
  expect(result.repeat).toEqual(result.overlap);
  expect(result.unchanged).toBe(true);
  expect(result.previewPixel).toEqual([255, 0, 0, 255]);
  expect(result.updated).toEqual([0, 255, 0, 255]);
  expect(result.dimensions).toEqual([128, 96]);
  expect(result.sourceSize).toEqual([20, 10]);
});
