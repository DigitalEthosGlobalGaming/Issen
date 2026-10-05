import { expect, test } from '@playwright/test';

test('leaving the window stops scene work, audio and tutorial time without changing manual pause', async ({
  page,
}) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.addInitScript(() => {
    const state = { stamps: 0, contexts: [] as AudioContext[] };
    Object.assign(window, { activityProbe: state });
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (...args: Parameters<typeof draw>) {
      if (this.canvas.id === 'c') state.stamps++;
      return Reflect.apply(draw, this, args);
    };
    for (const Context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const draw = Context.prototype.drawElements;
      Context.prototype.drawElements = function (...args: Parameters<typeof draw>) {
        if ((this.canvas as HTMLCanvasElement).id === 'c') state.stamps++;
        return Reflect.apply(draw, this, args);
      };
    }
    const Context = window.AudioContext;
    window.AudioContext = class extends Context {
      constructor(...args: ConstructorParameters<typeof Context>) {
        super(...args);
        state.contexts.push(this);
      }
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.keyboard.press('p');
  await expect(page.locator('#bResume')).toBeVisible();
  await page.waitForTimeout(550);
  await page.evaluate(async () => {
    const { activeNow } = await import('/src/platform/activity.ts');
    Object.assign(window, { activityNow: activeNow });
    activeNow();
    window.dispatchEvent(new Event('blur'));
  });
  await expect(page.locator('html')).toHaveAttribute('data-inactive', '');
  const before = await page.evaluate(async () => {
    const activeNow = (window as any).activityNow;
    const probe = (window as any).activityProbe;
    return { time: activeNow(), stamps: probe.stamps };
  });
  await page.waitForTimeout(450);
  expect(
    await page.evaluate(async () => {
      const activeNow = (window as any).activityNow;
      const probe = (window as any).activityProbe;
      return { time: activeNow(), stamps: probe.stamps };
    }),
  ).toEqual(before);
  await expect
    .poll(() => page.evaluate(() => (window as any).activityProbe.contexts[0]?.state))
    .toBe('suspended');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('#bResume')).toBeVisible();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => (window as any).activityProbe.stamps)).toBe(before.stamps);
  await page.locator('#bResume').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).activityProbe.stamps))
    .toBeGreaterThan(before.stamps);
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  await page.locator('#bMenu').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const cue = await page.locator('.tutorial-cue').textContent();
  await page.waitForTimeout(1000);
  expect(await page.locator('.tutorial-cue').textContent()).toBe(cue);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.tutorial-overlay')).toHaveAttribute('data-step', '1');
});
