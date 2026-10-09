import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('worker quiet preload resumes after explicit preparation and waits for its composed scene', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    const renderer = createWorkerEnvironmentRenderer(
      document,
      (sources, signal) => drawing.warmScene(sources, signal),
      {
        retainWorkerSources: (sources) => drawing.retainTextureSources(sources),
      },
    );
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 10,
      lowQuality: false,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const next = { ...frame, stage: 2, stageSeed: 11 };
    const sample = (stage = 1, incoming = next) =>
      sampleAssetBackground(stage, true, 1, 8.3, incoming.stage, incoming);
    try {
      const preparing = renderer.prepare(1);
      sample();
      const during = renderer.snapshot().imagePreload?.status;
      await preparing;
      sample();
      const beforeCompose = renderer.snapshot().imagePreload?.status;
      if (!(await renderer.compose(frame))) throw Error('Worker scene failed');
      sample();
      const deadline = performance.now() + 20000;
      while (renderer.snapshot().imagePreload?.status === 'pending' && performance.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 10));
      const ready = renderer.snapshot();
      await renderer.prepare(2);
      sample();
      const changed = renderer.snapshot().imagePreload?.status;
      if (!(await renderer.compose(next))) throw Error('Incoming worker scene failed');
      sample(2, { ...next, stage: 3, stageSeed: 12 });
      const resumed = renderer.snapshot().imagePreload?.status;
      return { during, beforeCompose, ready, changed, resumed };
    } finally {
      renderer.dispose();
      drawing.dispose();
    }
  });
  expect(result.during).toBe('none');
  expect(result.beforeCompose).toBe('none');
  expect(result.ready.worker).toBe(true);
  expect(result.ready.imagePreload?.status).toBe('ready');
  expect(result.changed).toBe('none');
  expect(result.resumed).toBe('pending');
});

for (const [worker, memory] of [
  [false, 2],
  [false, 8],
  [true, 2],
  [true, 8],
] as const)
  test(`${worker ? 'worker' : 'local'} quiet image preloads preserve scenes at ${memory} GiB`, async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(240000);
    const warnings: string[] = [];
    page.on('console', (m) => {
      if (/feedback loop|destroyed while still bound|GL_INVALID_OPERATION/i.test(m.text()))
        warnings.push(m.text());
    });
    const capture = async (enabled: boolean, targetPage = page) => {
      await targetPage.goto('/privacy/index.html');
      return targetPage.evaluate(
        async ({ enabled, worker, memory }) => {
          Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: memory });
          const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
          const { createLocalEnvironmentRenderer } =
            await import('/src/rendering/environment/local-renderer.ts');
          const { compositionKey } = await import('/src/rendering/environment/worker-types.ts');
          const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
          const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
          const { sceneImageUrls } = await import('/src/rendering/environment/asset-sources.ts');
          const NativeWorker = window.Worker;
          const workerUrls: string[] = [];
          const transferred = new Map<string, any[]>();
          let activeKey = '',
            decodes = 0;
          if (worker)
            window.Worker = class extends NativeWorker {
              constructor(url: string | URL, options?: WorkerOptions) {
                const moduleUrl = new URL(String(url), location.href).href;
                const code = `Object.defineProperty(navigator,"deviceMemory",{value:${memory}});const queued=[];onmessage=e=>queued.push(e);await import(${JSON.stringify(moduleUrl)});const handle=onmessage;for(const event of queued)handle(event);`;
                const workerUrl = URL.createObjectURL(
                  new Blob([code], { type: 'text/javascript' }),
                );
                workerUrls.push(workerUrl);
                super(workerUrl, options);
                this.addEventListener('message', ({ data }) => {
                  if (data.ok && data.layers?.length)
                    transferred.set(data.key, [...data.layers, ...data.foreground]);
                });
              }
            };
          const originalDecode = HTMLImageElement.prototype.decode;
          HTMLImageElement.prototype.decode = function () {
            decodes++;
            return originalDecode.call(this);
          };
          const canvas = document.createElement('canvas');
          canvas.width = 390;
          canvas.height = 844;
          const g = await createTestDrawing(canvas);
          const renderer = worker
            ? createEnvironmentRenderer(document, {
                warmWorkerScene: (sources, signal) => g.warmScene(sources, signal),
                retainWorkerSources: (sources) => g.retainTextureSources(sources),
              })
            : createLocalEnvironmentRenderer(document);
          const digest = async (rgba: Uint8ClampedArray) =>
            Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', rgba)))
              .map((v) => v.toString(16).padStart(2, '0'))
              .join('');
          const hashes = async () => {
            const output = !worker ? (renderer as any).exportLayers() : undefined;
            const layers = worker
              ? transferred.get(activeKey)!
              : [...output.layers, ...output.foreground];
            const values = [];
            for (const layer of layers)
              for (const kind of ['colour', 'normal', 'surface', 'emissive']) {
                const source = worker
                  ? layer[kind]
                  : kind === 'colour'
                    ? layer.colour
                    : layer.material?.[kind]?.source;
                if (!source) continue;
                const c = new OffscreenCanvas(source.width, source.height);
                const ctx = c.getContext('2d', { willReadFrequently: true })!;
                ctx.drawImage(source, 0, 0);
                values.push({
                  kind,
                  width: c.width,
                  height: c.height,
                  hash: await digest(ctx.getImageData(0, 0, c.width, c.height).data),
                });
                c.width = c.height = 0;
              }
            return values;
          };
          const rows = [];
          try {
            for (let cycle = 0; cycle < 3; cycle++)
              for (let stage = 0; stage < 9; stage++) {
                const frame = {
                  width: cycle === 2 ? 900 : 390,
                  height: cycle === 2 ? 600 : 844,
                  dpr: 2,
                  stage,
                  stageSeed: 424242 + cycle,
                  time: 1.25,
                  lowQuality: cycle === 1,
                  reducedMotion: cycle === 1,
                  reducedFlashes: cycle === 1,
                };
                const beforeDecode = decodes;
                if (!(await renderer.compose(frame))) throw Error('Scene failed to compose');
                activeKey = compositionKey(frame);
                const enteredDecodes = decodes - beforeDecode;
                const before = renderer.snapshot(),
                  planes = await hashes();
                const draw = async () => {
                  g.begin();
                  g.clearRect(0, 0, 390, 844);
                  if (!renderer.draw(g, frame)) throw Error('Current scene missing');
                  renderer.drawForeground(g, frame);
                  return digest(g.getImageData(0, 0, 390, 844).data);
                };
                const pixels = await draw();
                const next = { ...frame, stage: (stage + 1) % 9 };
                const future = sceneImageUrls(next.stage);
                if (future.some((url) => /_diffuse\./.test(url)))
                  throw Error('Redundant diffuse preload');
                sampleAssetBackground(stage, enabled, 1, 8.3, next.stage, next);
                if (enabled) {
                  const deadline = performance.now() + 20000;
                  while (
                    renderer.snapshot().imagePreload?.status === 'pending' &&
                    performance.now() < deadline
                  )
                    await new Promise((resolve) => setTimeout(resolve, 10));
                  if (renderer.snapshot().imagePreload?.status === 'pending')
                    throw Error('Preload did not settle');
                }
                const preloaded = renderer.snapshot(),
                  held = await hashes(),
                  afterPixels = await draw();
                // Busy frames stop pending work; completed worker scenes can remain ready.
                sampleAssetBackground(stage, false, 1, 8.3, next.stage, next);
                const cancelled = renderer.snapshot().imagePreload?.status;
                sampleAssetBackground(stage, true, 1, 8.3, next.stage, {
                  ...next,
                  width: next.width + 1,
                });
                const invalid = renderer.snapshot().imagePreload?.status;
                rows.push({
                  cycle,
                  stage,
                  before,
                  preloaded,
                  enteredDecodes,
                  futureCount: future.length,
                  planes,
                  held,
                  pixels,
                  afterPixels,
                  cancelled,
                  invalid,
                });
              }
          } finally {
            renderer.dispose();
            g.dispose();
            window.Worker = NativeWorker;
            for (const url of workerUrls) URL.revokeObjectURL(url);
            HTMLImageElement.prototype.decode = originalDecode;
          }
          return rows;
        },
        { enabled, worker, memory },
      );
    };
    const secondContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const candidatePage = await secondContext.newPage();
    candidatePage.on('console', (m) => {
      if (/feedback loop|destroyed while still bound|GL_INVALID_OPERATION/i.test(m.text()))
        warnings.push(m.text());
    });
    // Native sampling can change across capture ordinals even without preload.
    // Match both contexts' history, retaining exact plane/frame equality.
    await capture(false);
    await capture(false);
    const original = await capture(false);
    await capture(false, candidatePage);
    await capture(false, candidatePage);
    let candidate;
    try {
      candidate = await capture(true, candidatePage);
    } finally {
      await secondContext.close();
    }
    await writeFile(
      testInfo.outputPath('scene-image-preload.json'),
      JSON.stringify({ original, candidate, warnings }, null, 2),
    );
    expect(candidate).toHaveLength(27);
    expect(candidate.some((row) => row.preloaded.imagePreload?.status === 'ready')).toBe(true);
    for (let i = 0; i < candidate.length; i++) {
      const row = candidate[i]!;
      expect(row.planes, `incoming planes ${row.cycle}:${row.stage}`).toEqual(original[i]!.planes);
      expect(row.pixels, `native output ${row.cycle}:${row.stage}`).toEqual(original[i]!.pixels);
      expect(row.held).toEqual(row.planes);
      expect(row.afterPixels).toEqual(original[i]!.afterPixels);
      expect(row.preloaded.builds).toBe(row.before.builds);
      expect(row.preloaded.stage).toBe(row.stage);
      expect(row.cancelled).toBe(
        worker && row.preloaded.imagePreload?.status === 'ready' ? 'ready' : 'none',
      );
      expect(row.invalid).toBe('none');
      if (worker) {
        expect(row.before.worker).toBe(true);
        expect(row.before.decodedLoader!.budget).toBe((memory === 2 ? 256 : 512) * 1024 * 1024);
      }
      expect(row.before.decodedLoader!.peakBytes).toBeLessThanOrEqual(
        row.before.decodedLoader!.budget,
      );
      if (!worker && i % 9 > 0 && candidate[i - 1]!.preloaded.imagePreload?.status === 'ready')
        expect(row.enteredDecodes).toBe(0);
    }
    expect(warnings).toEqual([]);
  });
