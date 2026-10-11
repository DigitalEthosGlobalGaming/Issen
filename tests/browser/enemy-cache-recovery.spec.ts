import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

for (const compact of [false, true]) {
  test(`enemy artwork rebuilds after real WebGL restoration (compact=${compact})`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(60000);
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (compact) => {
      const { createNativeServices } = await import('/src/presentation/native-services.ts');
      const { createLifecycle } = await import('/src/platform/lifecycle.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const { createPalette } = await import('/src/rendering/palette.ts');
      const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
      document.documentElement.dataset.graphicsMemory = compact ? 'low' : 'normal';
      Object.defineProperty(navigator, 'deviceMemory', {
        configurable: true,
        value: compact ? 2 : 8,
      });
      const canvas = document.createElement('canvas');
      canvas.id = 'enemyRecovery';
      canvas.width = canvas.height = 180;
      document.body.append(canvas);
      const painter = await createTestDrawing(canvas);
      const lifecycle = createLifecycle();
      lifecycle.add(() => painter.dispose());
      const services = createNativeServices(document, lifecycle, undefined, painter);
      const enemy = services.inkEnemy;
      const palette = createPalette();
      const env = {
        time: 0,
        wind: 0,
        width: 180,
        height: 180,
        palette: (fog: number) => palette.fog(fog, [100, 110, 120]),
      };
      const figure = { back: false, varied: true, d: makeFig(2), pose: EPOSE.left, fog: 0 };
      const draw = () => {
        painter.begin();
        painter.save();
        painter.translate(90, 165);
        painter.scale(130, 130);
        for (const part of ['body', 'head', 'arms', 'hands'] as const)
          enemy.drawPart(painter, part, figure, env);
        painter.restore();
        painter.flush();
      };
      const alpha = (source: CanvasImageSource) => {
        const copy = document.createElement('canvas');
        copy.width = copy.height = 32;
        const ctx = copy.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(source, 0, 0, 32, 32);
        return ctx
          .getImageData(0, 0, 32, 32)
          .data.some((value, index) => index % 4 === 3 && value > 0);
      };
      try {
        await enemy.prepare();
        const uploads = await enemy.prepareUploads([], new AbortController().signal);
        if (!uploads) throw Error('Enemy preparation failed');
        const colour = [
          ...new Set(
            uploads.filter((upload) => !upload.data).map((upload) => upload.texture.source),
          ),
        ].filter((source): source is HTMLCanvasElement => source instanceof HTMLCanvasElement);
        const cpuBacked = colour.every(
          (source) => source.getContext('2d')!.getContextAttributes().willReadFrequently,
        );
        draw();
        const beforeVisible = alpha(canvas);
        const original = enemy.snapshot();
        // Reproduce the blank derived backing reported after the native GPU crash.
        for (const source of colour)
          source.getContext('2d')!.clearRect(0, 0, source.width, source.height);
        const blank = colour.every((source) => !alpha(source));
        const extension = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
        const lost = new Promise<void>((resolve) =>
          canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
        );
        extension.loseContext();
        await lost;
        await new Promise((resolve) => setTimeout(resolve, 100));
        const restored = new Promise<void>((resolve) =>
          canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true }),
        );
        extension.restoreContext();
        await restored;
        await painter.recoveryReady;
        const cleared = enemy.snapshot();
        const released = colour.every((source) => source.width === 0 && source.height === 0);
        const rebuilt = await enemy.prepareUploads([], new AbortController().signal);
        const rebuiltColours = rebuilt
          ?.filter((upload) => !upload.data && upload.texture.source instanceof HTMLCanvasElement)
          .map((upload) => upload.texture.source);
        draw();
        const visible = alpha(canvas);
        const rebuiltNonblank = rebuiltColours?.every(alpha);
        const recovered = enemy.snapshot();
        const image = canvas.toDataURL('image/png');
        lifecycle.dispose();
        canvas.dispatchEvent(new Event('webglcontextrestored'));
        return {
          compact: original.compact,
          cpuBacked,
          beforeVisible,
          blank,
          released,
          cleared,
          recovered,
          visible,
          rebuiltNonblank,
          disposed: enemy.snapshot(),
          image,
        };
      } finally {
        lifecycle.dispose();
      }
    }, compact);
    expect(result.compact).toBe(compact);
    expect(result.cpuBacked).toBe(true);
    expect(result.beforeVisible).toBe(true);
    expect(result.blank).toBe(true);
    expect(result.released).toBe(true);
    expect(result.cleared.cachedParts + result.cleared.toneParts).toBe(0);
    expect(result.cleared.variantPixels + result.cleared.tonePixels).toBe(0);
    expect(result.cleared.ready).toBe(true);
    expect(result.visible).toBe(true);
    expect(result.rebuiltNonblank).toBe(true);
    expect(result.recovered.variantPixels + result.recovered.tonePixels).toBeLessThanOrEqual(
      result.recovered.maxCachePixels,
    );
    expect(result.disposed.cacheGeneration).toBe(result.recovered.cacheGeneration);
    await writeFile(
      testInfo.outputPath('enemy-recovery.png'),
      Buffer.from(result.image.split(',')[1]!, 'base64'),
    );
  });
}
