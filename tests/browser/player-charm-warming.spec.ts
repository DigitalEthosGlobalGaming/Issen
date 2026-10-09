import { test, expect } from '@playwright/test';

for (const memory of [2, 8])
  test(`selected player outfit and charm draw without first-use uploads after preparation (${memory}GiB)`, async ({
    page,
  }) => {
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (memory) => {
      Object.defineProperty(navigator, 'deviceMemory', { value: memory, configurable: true });
      const { trimMainImages } = await import('/src/platform/main-images.ts');
      const { createInkPlayerRenderer } = await import('/src/rendering/figures/ink-player.ts');
      const { createInkCharmRenderer } = await import('/src/rendering/figures/ink-charms.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const { createPalette } = await import('/src/rendering/palette.ts');
      const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const drawing = await createTestDrawing(canvas);
      const player = createInkPlayerRenderer(document),
        charm = createInkCharmRenderer(document);
      const signal = new AbortController().signal;
      const rows = [];
      try {
        for (const robe of ['monk', 'yoroi', 'mino']) {
          const parts = await player.prepareUploads(robe, signal);
          const charms = await charm.prepareUploads('omikuji', '#c9bda1', signal);
          if (!parts || !charms) throw Error('Selected artwork preparation failed');
          const uploads = [...parts, ...charms];
          const release = drawing.retainTextureSources(uploads.map((item) => item.texture.source));
          if (!(await drawing.warmScene(uploads, signal))) throw Error('Warming failed');
          trimMainImages(document, Infinity);
          const pinned = player.snapshot().decodedLoader.pinned;
          let count = 0;
          const gl = canvas.getContext('webgl2')!,
            native = gl.texImage2D;
          gl.texImage2D = (...args: any[]) => {
            count++;
            return Reflect.apply(native, gl, args);
          };
          const draw = () => {
            drawing.begin();
            drawing.save();
            drawing.translate(80, 110);
            drawing.scale(90, 90);
            player.draw(
              drawing,
              {
                x: 0,
                y: 0,
                h: 1,
                fog: 0,
                back: true,
                robeId: robe,
                d: makeFig(1),
                pose: EPOSE.left,
              },
              {
                time: 0,
                wind: 0,
                width: 160,
                height: 120,
                petActive: false,
                palette: () => createPalette().robe(robe),
                random: () => 0,
              },
            );
            charm.draw(drawing, 'omikuji', 0.2, -0.5, 0.1, '#c9bda1');
            drawing.restore();
            drawing.flush();
            return canvas.toDataURL();
          };
          try {
            const first = draw(),
              replay = draw();
            rows.push({
              robe,
              pinned,
              compact: player.snapshot().outfits.compact,
              count,
              exact: first === replay,
              reused: parts === (await player.prepareUploads(robe, signal)),
            });
          } finally {
            gl.texImage2D = native;
            release();
          }
        }
        return rows;
      } finally {
        player.dispose();
        charm.dispose();
        drawing.dispose();
      }
    }, memory);
    for (const row of result) {
      expect(row).toMatchObject({ count: 0, exact: true, reused: true, compact: memory === 2 });
      if (memory === 2) expect(row.pinned).toBe(4);
    }
  });
