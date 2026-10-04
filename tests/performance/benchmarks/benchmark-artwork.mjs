// Run with a development Vite server: node scripts/benchmark-artwork.mjs [origin]
// No application startup, player saves, build artifacts or production code are changed.
import { chromium } from '@playwright/test';

const origin = process.argv[2] || 'http://127.0.0.1:5183';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${origin}/privacy/index.html`, { waitUntil: 'domcontentloaded' });
  const results = await page.evaluate(async () => {
    const { drawAtlasSprite } = await import('/src/rendering/environment/scene-kit.ts');
    const image = async (url) => {
      const result = new Image();
      result.src = url;
      await result.decode();
      return result;
    };
    const pine = await image('/src/rendering/environment/assets/pine-atlas.png');
    const player = await image('/src/rendering/figures/assets/player-ronin-simple.png');
    const canvas = document.createElement('canvas');
    document.body.replaceChildren(canvas);
    const g = canvas.getContext('2d');
    const nextFrame = () => new Promise(requestAnimationFrame);
    const summarize = (numbers) => {
      const ordered = [...numbers].sort((a, b) => a - b);
      return {
        median: +ordered[Math.floor(ordered.length / 2)].toFixed(2),
        p95: +ordered[Math.floor(ordered.length * 0.95)].toFixed(2),
      };
    };
    const samples = [];
    for (const [width, height] of [
      [1440, 900],
      [1024, 768],
    ]) {
      canvas.width = width;
      canvas.height = height;
      for (const family of ['faded-scene', 'modular-figures']) {
        const count = family === 'faded-scene' ? 60 : 1000;
        const draw = (ctx) => {
          for (let i = 0; i < count; i++) {
            const x = (i * 137) % width;
            const y = (i * 83) % height;
            if (family === 'faded-scene') {
              drawAtlasSprite(ctx, pine, i % 4, x, y, 130, {
                fadeFrom: 0.68,
                fadeTo: 0.96,
                alpha: 0.7,
              });
            } else {
              // Transformed modular parts, not a complete animated player simulation.
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate((i % 7) * 0.08);
              ctx.drawImage(player, 45, 54, 382, 358, -24, -45, 48, 45);
              ctx.restore();
            }
          }
        };
        for (const cached of [false, true]) {
          let cache;
          const setupStart = performance.now();
          if (cached) {
            cache = document.createElement('canvas');
            cache.width = width;
            cache.height = height;
            draw(cache.getContext('2d'));
            // Force completion of setup raster work outside frame measurements.
            cache.getContext('2d').getImageData(0, 0, 1, 1);
          }
          const setupMs = performance.now() - setupStart;
          const command = [],
            interval = [];
          let allocations = 0;
          const original = document.createElement.bind(document);
          document.createElement = (...args) => {
            if (args[0] === 'canvas') allocations++;
            return original(...args);
          };
          let last = await nextFrame();
          for (let frame = 0; frame < 48; frame++) {
            const start = performance.now();
            g.clearRect(0, 0, width, height);
            if (cache) g.drawImage(cache, 0, 0);
            else draw(g);
            const submitted = performance.now() - start;
            const now = await nextFrame();
            if (frame >= 8) {
              command.push(submitted);
              interval.push(now - last);
            }
            last = now;
          }
          document.createElement = original;
          // Drain pending raster work before proceeding; excluded from timings.
          g.getImageData(0, 0, 1, 1);
          samples.push({
            width,
            height,
            dpr: devicePixelRatio,
            family,
            sprites: count,
            cached,
            setupMs: +setupMs.toFixed(2),
            commandMs: summarize(command),
            frameIntervalMs: summarize(interval),
            canvasAllocationsAcross48Frames: allocations,
            cachedLayerBytes: cache ? width * height * 4 : 0,
          });
          if (cache) cache.width = cache.height = 0;
        }
      }
    }
    const { createInkPlayerRenderer } = await import('/src/rendering/figures/ink-player.ts');
    const renderer = createInkPlayerRenderer(document);
    await renderer.prepare();
    const figure = {
      back: true,
      robeId: 'hai',
      lean: 0,
      d: { seed: 0 },
      pose: { gx: 0.12, gy: -0.5, ang: 0 },
    };
    const env = { time: 0, wind: 0, reducedMotion: true, reducedFlashes: true };
    const outfitSamples = [];
    for (const robeId of ['hai', 'shiro', 'tanuki', 'rags']) {
      figure.robeId = robeId;
      const durations = [];
      for (let iteration = 0; iteration < 12; iteration++) {
        g.save();
        g.translate(300, 500);
        g.scale(250, 250);
        const start = performance.now();
        if (!renderer.draw(g, figure, env)) throw new Error(`Outfit ${robeId} unavailable`);
        durations.push(performance.now() - start);
        g.restore();
        await nextFrame();
      }
      outfitSamples.push({
        robeId,
        coldDrawMs: +durations[0].toFixed(2),
        warmDrawMs: summarize(durations.slice(1)),
      });
    }
    const figureCache = renderer.snapshot();
    renderer.dispose();
    return { userAgent: navigator.userAgent, samples, outfitSamples, figureCache };
  });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
