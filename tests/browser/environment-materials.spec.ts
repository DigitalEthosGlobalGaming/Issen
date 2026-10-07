import { expect, test } from '@playwright/test';

test('every stage retains aligned material layers, including foreground bamboo', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { registerMaterialSink } = await import('/src/rendering/scene-material.ts');
    const renderer = createEnvironmentRenderer(document);
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const g = await createTestDrawing(canvas);
    let stamps: any[] = [];
    registerMaterialSink(g, { draw: (stamp) => stamps.push(stamp), lights: () => {} });
    const stages = [];
    for (let stage = 0; stage < 9; stage++) {
      await renderer.prepare(stage);
      stamps = [];
      const frame = {
        width: 180,
        height: 120,
        dpr: 1,
        time: 0,
        stage,
        reducedMotion: true,
        reducedFlashes: true,
        lowQuality: true,
      };
      await renderer.compose(frame);
      const drawn = renderer.draw(g, frame);
      const foreground = stage === 4 && renderer.drawForeground(g, frame);
      stages.push({
        stage,
        drawn,
        foreground,
        count: stamps.length,
        aligned: stamps.every((stamp) => {
          const m = stamp.material;
          return (
            m.normal.source.width === m.surface.source.width &&
            m.normal.source.height === m.surface.source.height &&
            (!m.emissive || m.emissive.source.width === m.surface.source.width) &&
            (m.surfaceCoverage ||
              (m.normal.frame?.join() === m.surface.frame?.join() &&
                (!m.emissive || m.normal.frame?.join() === m.emissive.frame?.join())))
          );
        }),
        coverage: stamps.some((stamp) => {
          const source = stamp.material.surface.source;
          const sample = document.createElement('canvas');
          sample.width = source.width;
          sample.height = source.height;
          const read = sample.getContext('2d')!;
          read.drawImage(source, 0, 0);
          const data = read.getImageData(0, 0, source.width, source.height).data;
          return data.some((value: number, index: number) => index % 4 === 3 && value > 0);
        }),
      });
    }
    renderer.dispose();
    return stages;
  });
  expect(result).toHaveLength(9);
  for (const stage of result) {
    expect(stage.drawn, `stage ${stage.stage}`).toBe(true);
    expect(stage.count).toBeGreaterThan(0);
    expect(stage.aligned).toBe(true);
    expect(stage.coverage).toBe(true);
    if (stage.stage === 4) expect(stage.foreground).toBe(true);
  }
});
