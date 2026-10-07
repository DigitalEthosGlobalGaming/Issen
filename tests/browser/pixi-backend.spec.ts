import { expect, test } from '@playwright/test';

test('retained sprite slots refresh expired atlas frames after another slot recreates the source', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const pixels = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const painter = await createPixiScenePainter(canvas);
    const source = document.createElement('canvas');
    source.width = source.height = 16;
    const ink = source.getContext('2d')!;
    ink.fillStyle = '#ff0000';
    ink.fillRect(0, 0, 16, 16);
    painter.begin();
    painter.fillStyle = '#000000';
    painter.fillRect(0, 0, 64, 32);
    painter.drawImage(source, 20, 0, 16, 16);
    painter.drawImage(source, 40, 0, 16, 16);
    painter.flush();
    for (let frame = 0; frame < 121; frame++) {
      painter.begin();
      painter.fillRect(0, 0, 64, 32);
      painter.flush();
    }
    painter.begin();
    // Slot zero recreates the expired source; slots one/two still hold its old frames.
    painter.drawImage(source, 0, 0, 16, 16);
    painter.drawImage(source, 20, 0, 16, 16);
    painter.drawImage(source, 40, 0, 16, 16);
    painter.flush();
    const copy = document.createElement('canvas');
    copy.width = 64;
    copy.height = 32;
    const read = copy.getContext('2d')!;
    read.drawImage(canvas, 0, 0);
    const pixels = [8, 28, 48].map((x) => [...read.getImageData(x, 8, 1, 1).data]);
    painter.dispose();
    return pixels;
  });
  expect(errors).toEqual([]);
  expect(pixels).toEqual([
    [255, 0, 0, 255],
    [255, 0, 0, 255],
    [255, 0, 0, 255],
  ]);
});

test('pooled state and retained draws preserve clipping, path continuation and frame transitions', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const differences = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const painter = await createPixiScenePainter(canvas);
    const reference = document.createElement('canvas');
    reference.width = reference.height = 128;
    const context = reference.getContext('2d')!;
    const copy = document.createElement('canvas');
    copy.width = copy.height = 128;
    const read = copy.getContext('2d')!;
    const differences = [];
    for (let frame = 0; frame < 6; frame++) {
      painter.begin();
      context.clearRect(0, 0, 128, 128);
      for (const target of [painter, context]) {
        target.setTransform(1, 0, 0, 1, 0, 0);
        target.globalAlpha = 1;
        target.fillStyle = '#101010';
        target.fillRect(0, 0, 128, 128);
        target.save();
        target.translate(12, 9);
        target.scale(-1, 1);
        target.rotate(0.3);
        target.transform(1, 0.1, 0.2, 1, 0, 0);
        target.save();
        target.fillStyle = '#aabbcc';
        target.globalAlpha = 0.2;
        target.translate(5, 3);
        target.restore();
        target.restore();
        if (frame % 2 === 0) {
          target.save();
          target.beginPath();
          target.rect(15, 15, 95, 90);
          target.clip();
          target.save();
          target.beginPath();
          target.rect(25, 25, 55, 50);
          target.clip();
          target.fillStyle = '#33aadd';
          target.fillRect(0, 0, 128, 128);
          target.restore();
        }
        target.fillStyle = '#bb6644';
        target.beginPath();
        target.ellipse(52, 53, 25, 18, 0.4, 0, Math.PI * 2);
        target.fill();
        target.lineWidth = 2;
        target.strokeStyle = '#dddddd';
        target.stroke();
        if (frame % 2 === 0) target.restore();
        if (frame !== 3) {
          target.save();
          target.translate(94, 92);
          target.rotate(0.7);
          target.scale(0.9, 1.2);
          target.fillStyle = 'rgba(30,210,50,.6)';
          target.beginPath();
          target.arc(0, 0, 14, 0.5, 0.5 + Math.PI * 2);
          target.fill();
          target.restore();
        }
        // A temporary rectangle draw must preserve a preceding lazy ellipse path.
        target.fillStyle = '#eebb66';
        target.beginPath();
        target.arc(25, 100, 9, 0, Math.PI * 2);
        target.fillRect(4, 4, 6, 6);
        target.fill();
      }
      painter.flush();
      read.clearRect(0, 0, 128, 128);
      read.drawImage(canvas, 0, 0);
      const actual = read.getImageData(0, 0, 128, 128).data;
      const expected = context.getImageData(0, 0, 128, 128).data;
      let difference = 0;
      for (let i = 0; i < actual.length; i++) difference += Math.abs(actual[i]! - expected[i]!);
      differences.push(difference / actual.length);
    }
    painter.dispose();
    return differences;
  });
  expect(errors).toEqual([]);
  for (const difference of differences) expect(difference).toBeLessThan(3);
});

test('prepared enemy brush rings retain Canvas appearance at different sizes and states', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const differences = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawEnso } = await import('/src/rendering/glyphs.ts');
    const { registerBrushRingSink } = await import('/src/rendering/scene-brush-ring.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const painter = await createPixiScenePainter(canvas);
    const oldCanvas = document.createElement('canvas');
    oldCanvas.width = oldCanvas.height = 256;
    const oldPainter = await createPixiScenePainter(oldCanvas);
    registerBrushRingSink(oldPainter, (radius, colour) => {
      oldPainter.strokeStyle = colour;
      oldPainter.lineCap = 'round';
      const count = Math.ceil(44 * 0.93);
      for (let i = 0; i < count; i++) {
        oldPainter.lineWidth = radius * 0.1 * (1 - (0.6 * i) / count);
        oldPainter.beginPath();
        oldPainter.arc(
          0,
          0,
          radius,
          -2.2 + (0.93 * Math.PI * 2 * i) / count,
          -2.2 + (0.93 * Math.PI * 2 * (i + 1)) / count + 0.01,
        );
        oldPainter.stroke();
      }
      return true;
    });
    const reference = document.createElement('canvas');
    reference.width = reference.height = 256;
    const context = reference.getContext('2d')!;
    const copy = document.createElement('canvas');
    copy.width = copy.height = 256;
    const read = copy.getContext('2d')!;
    const differences = [];
    for (const radius of [12, 32, 68])
      for (const waiting of [true, false]) {
        painter.begin();
        oldPainter.begin();
        context.clearRect(0, 0, 256, 256);
        for (const target of [painter, oldPainter, context]) {
          target.save();
          target.translate(128, 128);
          target.rotate(0.31);
          drawEnso(
            target,
            {
              time: 1,
              seal: '#111111',
              sealArc: '#774422',
              font: 'sans-serif',
              perfectZone: 0.8,
              noArc: false,
            },
            0,
            0,
            radius,
            'R',
            {
              emphasis: waiting ? 'waiting' : 'next',
              alpha: waiting ? 0.45 : 0.75,
              prog: waiting ? null : 0.6,
            },
          );
          target.restore();
        }
        painter.flush();
        oldPainter.flush();
        read.clearRect(0, 0, 256, 256);
        read.drawImage(canvas, 0, 0);
        const actual = read.getImageData(0, 0, 256, 256).data;
        const expected = context.getImageData(0, 0, 256, 256).data;
        read.clearRect(0, 0, 256, 256);
        read.drawImage(oldCanvas, 0, 0);
        const previous = read.getImageData(0, 0, 256, 256).data;
        let alphaDifference = 0,
          alphaCoverage = 0,
          colourDifference = 0,
          previousDifference = 0;
        for (let i = 0; i < actual.length; i += 4) {
          alphaDifference += Math.abs(actual[i + 3]! - expected[i + 3]!);
          alphaCoverage += expected[i + 3]!;
          previousDifference += Math.abs(previous[i + 3]! - actual[i + 3]!);
          for (let channel = 0; channel < 3; channel++)
            colourDifference += Math.abs(
              (actual[i + channel]! * actual[i + 3]!) / 255 -
                (expected[i + channel]! * expected[i + 3]!) / 255,
            );
        }
        differences.push({
          radius,
          waiting,
          alpha: alphaDifference / alphaCoverage,
          colour: colourDifference / (alphaCoverage * 3),
          previous: previousDifference / alphaCoverage,
        });
      }
    painter.dispose();
    oldPainter.dispose();
    return differences;
  });
  for (const difference of differences) {
    expect(difference.alpha, JSON.stringify(difference)).toBeLessThan(0.22);
    expect(difference.colour, JSON.stringify(difference)).toBeLessThan(0.22);
    expect(difference.previous, JSON.stringify(difference)).toBeLessThan(0.06);
  }
});

test('prepared round strokes preserve coverage, translucent alpha and changing transforms', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const frames = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 96;
    const painter = await createPixiScenePainter(canvas);
    const reference = document.createElement('canvas');
    reference.width = canvas.width;
    reference.height = canvas.height;
    const context = reference.getContext('2d')!;
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const read = copy.getContext('2d')!;
    const frames = [];
    for (let frame = 0; frame < 3; frame++) {
      painter.begin();
      context.clearRect(0, 0, 160, 96);
      for (const target of [painter, context]) {
        target.save();
        target.translate(30 + frame * 9, 30);
        target.rotate(frame * 0.4);
        target.scale(1.2, 1.2);
        target.lineCap = 'round';
        target.strokeStyle = 'rgba(255,0,0,.4)';
        target.lineWidth = 14 - frame * 3;
        target.beginPath();
        target.moveTo(0, 0);
        target.lineTo(65, 0);
        target.stroke();
        target.restore();
        target.lineCap = 'round';
        target.strokeStyle = 'rgba(0,0,255,.7)';
        target.lineWidth = 2;
        target.beginPath();
        target.moveTo(20, 80);
        target.lineTo(130, 70);
        target.stroke();
      }
      painter.flush();
      read.clearRect(0, 0, 160, 96);
      read.drawImage(canvas, 0, 0);
      const actual = read.getImageData(0, 0, 160, 96).data;
      const expected = context.getImageData(0, 0, 160, 96).data;
      let difference = 0,
        coverage = 0,
        maxAlpha = 0;
      for (let i = 3; i < actual.length; i += 4) {
        difference += Math.abs(actual[i]! - expected[i]!);
        coverage += expected[i]!;
        if (Math.floor(i / 4 / 160) < 60) maxAlpha = Math.max(maxAlpha, actual[i]!);
      }
      frames.push({ relativeAlphaDifference: difference / coverage, maxAlpha });
    }
    painter.dispose();
    return frames;
  });
  expect(errors).toEqual([]);
  for (const frame of frames) {
    expect(frame.relativeAlphaDifference).toBeLessThan(0.08);
    expect(frame.maxAlpha).toBeGreaterThanOrEqual(100);
    expect(frame.maxAlpha).toBeLessThanOrEqual(103);
  }
});

test('fading colours with scientific notation retain Canvas alpha without interrupting WebGL', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const samples = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const painter = await createPixiScenePainter(canvas);
    painter.begin();
    painter.fillStyle = 'rgba(8,8,7,7.812472890833533e-12)';
    painter.fillRect(0, 0, 16, 32);
    painter.fillStyle = 'rgba(1e2,0,0,1e-1)';
    painter.fillRect(16, 0, 16, 32);
    const gradient = painter.createLinearGradient(32, 0, 48, 0);
    gradient.addColorStop(0, 'rgba(8,8,7,7.812472890833533e-12)');
    gradient.addColorStop(1, 'rgba(0,0,0,1e-1)');
    painter.fillStyle = gradient;
    painter.fillRect(32, 0, 16, 32);
    painter.shadowColor = 'rgba(8,8,7,7.812472890833533e-12)';
    painter.strokeStyle = 'rgba(0,0,0,1e-1)';
    painter.lineWidth = 8;
    painter.beginPath();
    painter.moveTo(56, 0);
    painter.lineTo(56, 32);
    painter.stroke();
    painter.flush();
    const copy = document.createElement('canvas');
    copy.width = 64;
    copy.height = 32;
    const read = copy.getContext('2d')!;
    read.drawImage(canvas, 0, 0);
    const samples = [8, 24, 56].map((x) => [...read.getImageData(x, 16, 1, 1).data]);
    painter.dispose();
    return samples;
  });
  expect(errors).toEqual([]);
  expect(samples[0]![3]).toBe(0);
  expect(samples[1]![3]).toBeGreaterThanOrEqual(25);
  expect(samples[1]![3]).toBeLessThanOrEqual(26);
  expect(samples[2]![3]).toBeGreaterThanOrEqual(25);
  expect(samples[2]![3]).toBeLessThanOrEqual(26);
});

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
        'artworkReady = true;',
        'window.__preparedScene = { frameLoop, preparePresentation, drawScene, snapshot: () => JSON.stringify({ G, P, fx: presentationState.fx, postState: postPreparation.state, shake: presentationState.shake, rng: activity.runRandom.state(), saves: Object.entries(localStorage), haptics: window.drawHaptics }) }; artworkReady = true;',
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

test('unavailable WebGL reports a graphics error and preserves profile saves', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ tutorial: 'skipped' }));
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind.includes('webgl')) return null;
      return Reflect.apply(get, this, [kind, ...args]);
    } as typeof get;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Graphics not supported' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('[data-graphics-backend="canvas"]')).toHaveCount(0);
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

for (const selector of ['#prevC', '#supportPreview', '.tutorial-canvas']) {
  test(`lost auxiliary context ${selector} preserves its canvas and reports Reload`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/');
    await expect(page.locator('.startup-loading')).toHaveCount(0);
    if (selector === '.tutorial-canvas') {
      await page.locator('#bOptions').click();
      await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
    }
    const canvas = page.locator(selector);
    const handle = await canvas.elementHandle();
    const saves = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
    await canvas.evaluate((element: HTMLCanvasElement) =>
      element.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext(),
    );
    await expect(canvas).toHaveAttribute('data-context-state', 'lost');
    if (selector === '.tutorial-canvas') {
      await page.keyboard.press('ArrowRight');
      await expect(page.locator('.tutorial-overlay')).toHaveAttribute('data-step', '0');
    }
    await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeVisible({
      timeout: 12000,
    });
    await expect(canvas).toHaveAttribute('data-context-state', 'unsupported');
    await expect(canvas).toHaveAttribute('data-graphics-backend', 'pixi');
    expect(await handle!.evaluate((element) => element.isConnected)).toBe(true);
    expect(await page.evaluate(() => JSON.stringify(Object.entries(localStorage)))).toBe(saves);
  });
}

for (const restore of [true, false]) {
  test(
    restore
      ? 'WebGL context restoration keeps combat paused until explicit resume'
      : 'unrestored WebGL context reports a reload error without resetting the run',
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
      await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
        timeout: 15000,
      });
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
        await expect(page.locator('#c')).toHaveAttribute('data-context-state', 'unsupported', {
          timeout: 12000,
        });
        await expect(page.locator('#c')).toHaveAttribute('data-graphics-backend', 'pixi');
        await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeVisible();
      }
      await expect(page.locator('#paused')).toHaveClass(/on/);
      if (restore) await expect(page.locator('#bResume')).toBeEnabled();
      else await expect(page.locator('#bResume')).toBeDisabled();
      expect(
        await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).seed),
      ).toBe(seed);
      if (restore) {
        await page.locator('#bResume').click();
        await expect(page.locator('#paused')).not.toHaveClass(/on/);
      }
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
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const IDENTITY = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createPixiScenePainter(canvas);
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
      painter.begin();
      setSceneLighting(painter, frame.lighting);
      const t = sprite.transform;
      painter.setTransform(t.a, t.b, t.c, t.d, t.tx, t.ty);
      painter.globalAlpha = sprite.alpha;
      drawMaterialStamp(painter, {
        texture: sprite.texture,
        material: sprite.material,
        x: 0,
        y: 0,
        width: sprite.width,
        height: sprite.height,
      });
      painter.flush();
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
    painter.dispose();
    return { lit, mirrored, fogged };
  });
  expect(errors).toEqual([]);
  expect(pixels.lit[0]).toBeGreaterThan(100);
  // Linear ambient 0.1 on display-grey 128 yields about 40 after sRGB encoding.
  expect(pixels.mirrored[0]).toBeGreaterThan(35);
  expect(pixels.mirrored[0]).toBeLessThan(45);
  expect(pixels.lit[0] - pixels.mirrored[0]).toBeGreaterThan(60);
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
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const IDENTITY = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
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
    target.width = target.height = preview.width = preview.height = 32;
    const live = await createPixiScenePainter(target);
    const isolated = await createPixiScenePainter(preview);
    const { invalidateSceneTexture } = await import('/src/rendering/texture-revision.ts');
    const render = (painter: typeof live, frame: any) => {
      if (painter.canvas.width !== frame.width * frame.dpr)
        painter.canvas.width = frame.width * frame.dpr;
      if (painter.canvas.height !== frame.height * frame.dpr)
        painter.canvas.height = frame.height * frame.dpr;
      painter.begin();
      for (const sprite of frame.sprites) {
        const t = sprite.transform;
        painter.setTransform(
          t.a * frame.dpr,
          t.b * frame.dpr,
          t.c * frame.dpr,
          t.d * frame.dpr,
          t.tx * frame.dpr,
          t.ty * frame.dpr,
        );
        painter.globalAlpha = sprite.alpha;
        painter.drawImage(
          sprite.texture.source,
          ...sprite.texture.frame,
          0,
          0,
          sprite.width,
          sprite.height,
        );
      }
      painter.flush();
    };
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
    render(live, frame);
    const border = sample(target, 3, 3);
    const overlap = sample(target, 16, 16);
    const retainedInput = JSON.stringify(frame, (key, value) =>
      key === 'source' ? 'atlas' : value,
    );
    render(live, frame);
    const repeat = sample(target, 16, 16);
    const unchanged =
      retainedInput === JSON.stringify(frame, (key, value) => (key === 'source' ? 'atlas' : value));
    render(isolated, { ...frame, sprites: [back] });
    const previewPixel = sample(preview, 16, 16);
    isolated.dispose();
    ink.fillStyle = '#00ff00';
    ink.fillRect(0, 0, 10, 10);
    invalidateSceneTexture(atlas);
    render(live, { ...frame, sprites: [back] });
    const updated = sample(target, 16, 16);
    render(live, { ...frame, width: 64, height: 48, dpr: 2, sprites: [back] });
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
