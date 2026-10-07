import { expect, test } from '@playwright/test';

async function observe(page: import('@playwright/test').Page) {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'if (pageActive()) frameLoop.start();',
        'window.__performance = { G, fx: presentationState.fx, preview, supportPreview, frameLoop, render, state: () => ({ time: presentationState.time, runTime:G.runTime, enemies:JSON.stringify(G.enemies), particles:JSON.stringify(presentationState.fx) }) }; if (pageActive()) frameLoop.start();',
      ),
    });
  });
  await page.addInitScript(() => {
    const probe = { main: 0, preview: 0, audio: [] as AudioContext[] };
    Object.assign(window, { performanceProbe: probe });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: Parameters<typeof draw>) {
      if (this.canvas.id === 'c') probe.main++;
      if (this.canvas.id === 'prevC') probe.preview++;
      return Reflect.apply(draw, this, args);
    };
    // Scheduling assertions observe either backend; these are activity counts,
    // not frame-time or throughput measurements.
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const draw = Context.prototype.drawElements;
      Context.prototype.drawElements = function (...args: Parameters<typeof draw>) {
        const id = (this.canvas as HTMLCanvasElement).id;
        if (id === 'c') probe.main++;
        if (id === 'prevC') probe.preview++;
        return Reflect.apply(draw, this, args);
      };
    }
    const Audio = window.AudioContext;
    window.AudioContext = class extends Audio {
      constructor(...args: ConstructorParameters<typeof Audio>) {
        super(...args);
        probe.audio.push(this);
      }
    };
  });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__performance);
}

test('settled Armoury holds the main scene while both preview sizes remain animated', async ({
  page,
}) => {
  await observe(page);
  await page.locator('#bArmory').click();
  const count = () =>
    page.evaluate(() => ({
      main: (window as any).performanceProbe.main,
      preview: (window as any).performanceProbe.preview,
    }));
  await page.waitForTimeout(600);
  let before = await count();
  const scene = await page.evaluate(() => (window as any).__performance.state());
  await page.waitForTimeout(350);
  expect((await count()).main).toBe(before.main);
  expect((await count()).preview).toBeGreaterThan(before.preview);
  expect(await page.evaluate(() => (window as any).__performance.state())).toEqual(scene);
  await page.locator('#prevC').click();
  await expect(page.getByRole('dialog', { name: 'Equipment inspection' })).toBeVisible();
  before = await count();
  await page.waitForTimeout(350);
  const after = await count();
  expect(after.main).toBe(before.main);
  expect(after.preview).toBeGreaterThan(before.preview);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  expect((await count()).main).toBe(before.main);
  await page.keyboard.press('Escape');
  await expect(page.locator('#prevC')).toBeFocused();
  // Resize invalidation redraws the uncovered snapshot, then settles again.
  await expect.poll(async () => (await count()).main).toBeGreaterThan(before.main);
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.waitForTimeout(600);
  before = await count();
  await page.waitForTimeout(200);
  expect((await count()).main).toBe(before.main);
  expect((await count()).preview).toBeGreaterThan(before.preview);
  await page.locator('#armory [data-back]').click();
  await expect.poll(async () => (await count()).main).toBeGreaterThan(before.main);
});

for (const [button, screen] of [
  ['bStats', 'stats'],
  ['bOptions', 'options'],
] as const)
  test(`${screen} stops scene simulation and drawing after settling, then resumes on return`, async ({
    page,
  }) => {
    await observe(page);
    await page.locator(`#${button}`).click();
    await page.waitForTimeout(600);
    const state = () =>
      page.evaluate(() => ({
        scene: (window as any).__performance.state(),
        stamps: (window as any).performanceProbe.main,
      }));
    const before = await state();
    await page.waitForTimeout(350);
    expect(await state()).toEqual(before);
    if (screen === 'options')
      await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).click();
    else await page.locator(`#${screen} [data-back]`).click();
    await expect.poll(async () => (await state()).stamps).toBeGreaterThan(before.stamps);
  });

test('unchanged resizes preserve the snapshot; backing size and DPR changes prepare it again', async ({
  page,
}) => {
  await observe(page);
  await page.locator('#bStats').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const create = document.createElement.bind(document);
    (window as any).resizeCanvases = 0;
    document.createElement = ((...args: Parameters<typeof create>) => {
      if (args[0] === 'canvas') (window as any).resizeCanvases++;
      return Reflect.apply(create, document, args);
    }) as typeof document.createElement;
  });
  const state = () =>
    page.evaluate(() => ({
      scene: (window as any).__performance.state(),
      stamps: (window as any).performanceProbe.main,
      canvases: (window as any).resizeCanvases,
    }));
  const before = await state();
  for (let event = 0; event < 3; event++) {
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(130);
  }
  expect(await state()).toEqual(before);
  await page.evaluate(() => {
    (document.querySelector('#c') as HTMLCanvasElement).width = 1;
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(async () => (await state()).canvases).toBeGreaterThan(0);
  const size = () =>
    page.locator('#c').evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
      rect: canvas.getBoundingClientRect().toJSON(),
      dpr: Math.min(2, devicePixelRatio),
    }));
  let resized = await size();
  expect(resized.width).toBe(Math.round(resized.rect.width * resized.dpr));
  expect(resized.height).toBe(Math.round(resized.rect.height * resized.dpr));
  await page.evaluate(() => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 1 });
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(async () => (await size()).width).toBe(Math.round(resized.rect.width));
  resized = await size();
  expect(resized.height).toBe(Math.round(resized.rect.height));
});

for (const event of ['blur', 'visibilitychange'] as const)
  test(`${event} suspends combat, both renderers and audio without catch-up`, async ({ page }) => {
    await observe(page);
    await page.locator('#bPlay').click();
    await page.locator('#bBegin').click();
    await page.waitForTimeout(150);
    await page.evaluate((event) => {
      if (event === 'blur') window.dispatchEvent(new Event('blur'));
      else {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }, event);
    await expect(page.locator('html')).toHaveAttribute('data-inactive', '');
    const state = () =>
      page.evaluate(() => ({
        state: (window as any).__performance.state(),
        main: (window as any).performanceProbe.main,
        preview: (window as any).performanceProbe.preview,
      }));
    const before = await state();
    await page.waitForTimeout(500);
    expect(await state()).toEqual(before);
    await expect
      .poll(() => page.evaluate(() => (window as any).performanceProbe.audio[0]?.state))
      .toBe('suspended');
    await page.evaluate(() => {
      delete (document as any).hidden;
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await state()).main).toBeGreaterThan(before.main);
    expect((await state()).state.runTime - before.state.runTime).toBeLessThan(0.25);
  });

test('the visible inspection preview also suspends when the window loses focus', async ({
  page,
}) => {
  await observe(page);
  await page.locator('#bArmory').click();
  await page.locator('#prevC').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).performanceProbe.preview))
    .toBeGreaterThan(0);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const count = () => page.evaluate(() => (window as any).performanceProbe.preview);
  const before = await count();
  await page.waitForTimeout(350);
  expect(await count()).toBe(before);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(count).toBeGreaterThan(before);
});
