import { expect, test } from '@playwright/test';

test('Graphics retains its last native frame through resize and superseded scenery preparation', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    const state = { hold: false, pending: [] as (() => void)[] };
    Object.assign(window, { sceneryHold: state });
    const nativePost = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (message, options) {
      const send = () => nativePost.call(this, message, options as StructuredSerializeOptions);
      if (state.hold && message.kind === 'compose') state.pending.push(send);
      else send();
    };
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await page.locator('#pauseBtn').click();
  await page.locator('#bPauseOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await page.getByLabel('Adaptive quality', { exact: true }).uncheck();
  await page.getByLabel('Preload next stage', { exact: true }).uncheck();
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  const before = await page.evaluate(() => {
    (window as any).sceneryHold.hold = true;
    return {
      width: (document.querySelector('#c') as HTMLCanvasElement).width,
      checkpoint: localStorage.getItem('issen.runCheckpoint'),
    };
  });
  await page.getByLabel('Render resolution', { exact: true }).fill('50');
  const retained = page.locator('.graphics-retained-frame');
  await expect(retained).toBeVisible();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'loading');
  const capture = await retained.evaluate(async (canvas: HTMLCanvasElement) => {
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    Object.assign(window, { retainedGraphicsFrame: canvas });
    let sum = 0,
      alpha = 0;
    for (let i = 0; i < pixels.length; i++) {
      sum += pixels[i]!;
      if (i % 4 === 3) alpha += pixels[i]!;
    }
    return {
      sum,
      alpha,
      width: canvas.width,
      bytes: canvas.width * canvas.height * 4,
      tracked: documentPixelMemory(document).snapshot().canvasBytes,
    };
  });
  expect(capture.alpha).toBeGreaterThan(0);
  expect(capture.width).toBe(before.width);
  expect(capture.tracked).toBeGreaterThanOrEqual(capture.bytes);
  expect(
    await page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width),
  ).toBeLessThan(before.width);
  await page.getByLabel('Scenery detail', { exact: true }).selectOption('low');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-scenery', 'low');
  await expect(retained).toHaveCount(1);
  const after = await retained.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (const channel of pixels) sum += channel;
    return {
      sum,
      checkpoint: localStorage.getItem('issen.runCheckpoint'),
      hit: document.elementFromPoint(innerWidth / 2, 12)?.className,
    };
  });
  expect(after.sum).toBe(capture.sum);
  expect(after.checkpoint).toBe(before.checkpoint);
  await page.screenshot({ path: testInfo.outputPath('retained-loading.png') });
  await page.evaluate(() => {
    const state = (window as any).sceneryHold;
    state.hold = false;
    for (const send of state.pending.splice(0)) send();
  });
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  await expect(retained).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const canvas = (window as any).retainedGraphicsFrame as HTMLCanvasElement;
      return { width: canvas.width, height: canvas.height, connected: canvas.isConnected };
    }),
  ).toEqual({ width: 0, height: 0, connected: false });
});
