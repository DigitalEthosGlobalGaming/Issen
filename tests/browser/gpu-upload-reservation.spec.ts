import { test, expect } from '@playwright/test';

test('concurrent painter warming shares upload reservations and clears them on cancellation/readiness', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createTestDrawing(canvas);
    const source = document.createElement('canvas');
    source.width = source.height = 8;
    const uploads = [{ texture: { source, revision: 0 } }];
    const first = new AbortController(),
      second = new AbortController();
    try {
      const a = painter.warmScene(uploads, first.signal);
      const initial = documentSceneMemory(document).reservedBytes;
      const b = painter.warmScene(uploads, second.signal);
      const shared = documentSceneMemory(document).reservedBytes;
      second.abort();
      const canceled = await b;
      const ready = await a;
      const settled = documentSceneMemory(document).reservedBytes;
      painter.dispose();
      return {
        initial,
        shared,
        canceled,
        ready,
        settled,
        disposed: documentSceneMemory(document).reservedBytes,
      };
    } finally {
      first.abort();
      second.abort();
      painter.dispose();
    }
  });
  expect(result.initial).toBeGreaterThanOrEqual(8 * 8 * 4);
  expect(result.shared).toBe(result.initial);
  expect(result.canceled).toBe(false);
  expect(result.ready).toBe(true);
  expect(result.settled).toBe(0);
  expect(result.disposed).toBe(0);
});
