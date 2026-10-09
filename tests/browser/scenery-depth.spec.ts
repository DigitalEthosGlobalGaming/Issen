import { expect, test } from '@playwright/test';

test('atmospheric colour preserves solid occlusion, cutout holes, contact edges and Canvas state', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { drawAtlasSprite, setSceneryAtmosphere } =
      await import('/src/rendering/environment/scene-kit.ts');
    const source = document.createElement('canvas');
    source.width = source.height = 64;
    const art = source.getContext('2d')!;
    art.fillStyle = '#202020';
    art.fillRect(8, 4, 48, 60);
    art.clearRect(27, 18, 10, 10);
    const image = new Image();
    image.src = source.toDataURL();
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d')!;
    const pixel = (x: number, y: number) => Array.from(g.getImageData(x, y, 1, 1).data);
    const draw = (background: string, strength = 1, translucent = false) => {
      g.clearRect(0, 0, 64, 64);
      g.fillStyle = background;
      g.fillRect(0, 0, 64, 64);
      setSceneryAtmosphere(g, '#b0a090', strength);
      drawAtlasSprite(g, image, 0, 32, 64, 64, {
        columns: 1,
        rows: 1,
        anchorY: 1,
        alpha: 0.25,
        fadeFrom: 0.65,
        fadeTo: 1,
        translucent,
      });
      return { body: pixel(16, 40), hole: pixel(32, 23), contact: pixel(16, 63) };
    };
    const red = draw('#ff0000');
    const blue = draw('#0000ff');
    const near = draw('#ff0000', 0.35);
    const mistRed = draw('#ff0000', 1, true);
    const mistBlue = draw('#0000ff', 1, true);
    return {
      red,
      blue,
      near,
      mistRed,
      mistBlue,
      state: {
        alpha: g.globalAlpha,
        filter: g.filter,
        composite: g.globalCompositeOperation,
        transform: [g.getTransform().a, g.getTransform().d, g.getTransform().e, g.getTransform().f],
      },
    };
  });
  expect(result.red.body).toEqual(result.blue.body);
  expect(result.red.hole).toEqual([255, 0, 0, 255]);
  expect(result.blue.hole).toEqual([0, 0, 255, 255]);
  expect(result.red.contact).not.toEqual(result.blue.contact);
  expect(result.red.body[0]).toBeGreaterThan(result.near.body[0]!);
  expect(result.mistRed.body).not.toEqual(result.mistBlue.body);
  expect(result.state).toEqual({
    alpha: 1,
    filter: 'none',
    composite: 'source-over',
    transform: [1, 1, 0, 0],
  });
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
]) {
  test(`all ten scenery compositions retain depth at ${viewport.width}`, async ({ page }, info) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    await page.goto('/privacy/index.html');
    await page.evaluate(async ({ width, height }) => {
      const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
      const { createDemonRealmRenderer } =
        await import('/src/rendering/environment/demon-realm.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      document.body.replaceChildren(canvas);
      document.body.style.cssText = 'margin:0;padding:0;overflow:hidden';
      canvas.style.display = 'block';
      const renderer = createEnvironmentRenderer(document);
      const demon = createDemonRealmRenderer(document);
      const drawing = await createTestDrawing(canvas);
      (window as any).depthPreview = { renderer, demon, canvas, drawing };
    }, viewport);
    for (let stage = 0; stage < 10; stage++) {
      await page.evaluate(async (stage) => {
        const { renderer, demon, canvas, drawing } = (window as any).depthPreview;
        const g = drawing;
        if (stage < 9) {
          await renderer.prepare(stage);
          const frame = {
            width: canvas.width,
            height: canvas.height,
            dpr: 1,
            time: 0,
            stage,
            stageSeed: 3,
            reducedMotion: true,
            reducedFlashes: true,
            lowQuality: false,
          };
          await renderer.compose(frame);
          if (!renderer.draw(g, frame)) throw new Error(`Stage ${stage} unavailable`);
        } else {
          if (!(await demon.prepare())) throw Error('Demon scenery unavailable');
          for (let i = 0; !demon.draw(g, canvas.width, canvas.height, 0, true, 131304); i++) {
            if (i > 40) throw new Error('Demon assets unavailable');
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }
      }, stage);
      await page.locator('canvas').screenshot({ path: info.outputPath(`scene-${stage}.png`) });
    }
    await page.evaluate(() => {
      const { renderer, demon } = (window as any).depthPreview;
      renderer.dispose();
      demon.dispose();
      delete (window as any).depthPreview;
    });
  });
}
