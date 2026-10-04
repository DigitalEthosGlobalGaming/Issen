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
        'window.__performance = { G, fx, preview, supportPreview, frameLoop, render, state: () => ({ time, runTime:G.runTime, enemies:JSON.stringify(G.enemies), particles:JSON.stringify(fx) }) }; if (pageActive()) frameLoop.start();',
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

test('only opaque inspection stops main drawing; previews, scroll backgrounds and return stay live', async ({
  page,
}) => {
  await observe(page);
  await page.locator('#bArmory').click();
  const count = () =>
    page.evaluate(() => ({
      main: (window as any).performanceProbe.main,
      preview: (window as any).performanceProbe.preview,
    }));
  let before = await count();
  await expect.poll(async () => (await count()).main).toBeGreaterThan(before.main);
  await page.locator('#prevC').click();
  await expect(page.getByRole('dialog', { name: 'Equipment inspection' })).toBeVisible();
  before = await count();
  await page.waitForTimeout(350);
  const after = await count();
  expect(after.main).toBe(before.main);
  expect(after.preview).toBeGreaterThan(before.preview);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await count()).main).toBeGreaterThan(before.main);
  await expect(page.locator('#prevC')).toBeFocused();
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
