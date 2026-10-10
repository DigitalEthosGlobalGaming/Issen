import { expect, test } from '@playwright/test';

test('Memory applies one debounced budget to live loaders without rebuilding the paused scene', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    const win = window as typeof window & { memoryReplies: number[] };
    win.memoryReplies = [];
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        this.addEventListener('message', ({ data }) => {
          if (!data.phase && data.snapshot?.decodedLoader)
            win.memoryReplies.push(data.snapshot.decodedLoader.budget);
        });
      }
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
  await page.getByLabel('Memory usage', { exact: true }).selectOption('high');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-memory', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  const snapshot = () =>
    page.evaluate(async () => {
      const { createMainImageOwner, documentImageBudget, documentResourceBudget } =
        await import('/src/platform/main-images.ts');
      const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
      const owner = createMainImageOwner(document);
      try {
        return {
          base: documentImageBudget(document),
          budget: documentResourceBudget(document),
          loader: owner.snapshot().budget,
          combined: documentSceneMemory(document).budget,
          width: (document.querySelector('#c') as HTMLCanvasElement).width,
          checkpoint: localStorage.getItem('issen.runCheckpoint'),
          prepared: performance
            .getEntriesByType('mark')
            .filter((entry) => entry.name.startsWith('issen:prepare-scene:')).length,
          worker: (window as typeof window & { memoryReplies: number[] }).memoryReplies.at(-1),
        };
      } finally {
        owner.dispose();
      }
    });
  const before = await snapshot();
  expect(before.loader).toBe(before.base * 1.5);
  expect(before.worker).toBe(before.loader);
  const immediate = await page
    .getByLabel('Memory usage', { exact: true })
    .evaluate((input: HTMLSelectElement) => {
      for (const value of ['low', 'high', 'normal']) {
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        memory: document.documentElement.dataset.graphicsMemory,
        applying: document.documentElement.dataset.graphicsApplying,
      };
    });
  expect(immediate).toEqual({ memory: 'high', applying: 'true' });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-memory', 'normal');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  const after = await snapshot();
  expect(after.loader).toBe(after.base * 1.25);
  expect(after.budget).toBe(after.loader);
  expect(after.worker).toBe(after.loader);
  expect(after.combined).toBe(after.loader * 2);
  expect(after.width).toBe(before.width);
  expect(after.prepared).toBe(before.prepared);
  expect(after.checkpoint).toBe(before.checkpoint);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.settings')!).graphics),
  ).toMatchObject({ preset: 'custom', memory: 'normal' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-memory', 'normal');
});
