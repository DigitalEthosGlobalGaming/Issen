import { test, expect } from '@playwright/test';
for (const policy of [
  { memory: 2, mobile: false, budget: 256 },
  { memory: 4, mobile: true, budget: 384 },
  { memory: 8, mobile: false, budget: 512 },
])
  test(`worker owns ${policy.budget}MiB inputs and reacquires released composition sources`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (policy) => {
      Object.defineProperty(navigator, 'deviceMemory', {
        value: policy.memory,
        configurable: true,
      });
      if (policy.mobile)
        Object.defineProperty(navigator, 'userAgent', { value: 'Android', configurable: true });
      const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 180;
      const g = await createTestDrawing(canvas),
        owner = createEnvironmentRenderer(document);
      const frame = {
        width: 120,
        height: 180,
        dpr: 1,
        stage: 0,
        stageSeed: 424242,
        time: 1,
        lowQuality: false,
        reducedMotion: false,
        reducedFlashes: false,
      };
      const pixels = () => {
        for (let n = 0; n < 2; n++) {
          g.begin();
          owner.draw(g, frame);
          owner.drawForeground(g, frame);
          g.getImageData(0, 0, 120, 180);
        }
        return Array.from(g.getImageData(0, 0, 120, 180).data);
      };
      const rows = [];
      for (let cycle = 0; cycle < 2; cycle++)
        for (let stage = 0; stage < 9; stage++) {
          frame.stage = stage;
          const ready = await owner.compose(frame);
          const snapshot = owner.snapshot();
          rows.push({ stage, cycle, ready, snapshot });
        }
      frame.stage = 0;
      frame.stageSeed = 424243;
      await owner.compose(frame);
      frame.stageSeed = 424242;
      await owner.compose(frame);
      // Compare settled submissions of the same completed key. The saved original also
      // differs between its first native frame and a later recomposition.
      const first = pixels();
      await owner.compose({ ...frame });
      const restored = pixels();
      let changes = 0;
      for (let n = 0; n < first.length; n++) if (first[n] !== restored[n]) changes++;
      owner.dispose();
      g.dispose();
      return { rows, changes };
    }, policy);
    expect(result.changes).toBe(0);
    expect(result.rows).toHaveLength(18);
    for (const row of result.rows) {
      expect(row.ready).toBe(true);
      expect(row.snapshot.worker).toBe(true);
      const decoded = row.snapshot.decodedLoader!;
      expect(decoded.budget).toBe(policy.budget * 1024 * 1024);
      expect(decoded.peakBytes).toBeLessThanOrEqual(decoded.budget);
      expect(decoded.pinned).toBe(0);
      expect(decoded.pinnedBytes).toBe(0);
    }
    if (policy.budget === 256)
      expect(result.rows.at(-1)!.snapshot.decodedLoader!.evictions).toBeGreaterThan(0);
  });
