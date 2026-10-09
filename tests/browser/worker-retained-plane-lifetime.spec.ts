import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('worker retained planes preserve exact unchanged-key copies', async ({ page }, testInfo) => {
  test.setTimeout(180000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const moduleUrl = new URL(
      '/src/rendering/environment/compose.worker.ts?worker_file&type=module',
      location.origin,
    ).href;
    const url = URL.createObjectURL(
      new Blob(
        [
          `Object.defineProperty(navigator, 'deviceMemory', { value: 2 }); await import(${JSON.stringify(moduleUrl)}); postMessage({ ready: true });`,
        ],
        { type: 'text/javascript' },
      ),
    );
    const worker = new Worker(url, { type: 'module' });
    let id = 0;
    const request = (value: any) =>
      new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('worker plane request timed out')), 30000);
        worker.onmessage = ({ data }) => {
          if (data.phase) return;
          clearTimeout(timer);
          data.ok ? resolve(data) : reject(Error(data.error || 'worker plane request failed'));
        };
        worker.onerror = (error) => {
          clearTimeout(timer);
          reject(Error(error.message));
        };
        worker.postMessage({ ...value, id: ++id });
      });
    const hashes = async (reply: any) => {
      const values = [];
      for (const layer of [...reply.layers, ...reply.foreground])
        for (const kind of ['colour', 'normal', 'surface', 'emissive']) {
          const bitmap = layer[kind];
          if (!bitmap) continue;
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const g = canvas.getContext('2d', { willReadFrequently: true })!;
          g.drawImage(bitmap, 0, 0);
          const rgba = g.getImageData(0, 0, canvas.width, canvas.height).data;
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', rgba)))
            .map((v) => v.toString(16).padStart(2, '0'))
            .join('');
          values.push({ kind, width: bitmap.width, height: bitmap.height, hash });
          canvas.width = canvas.height = 0;
        }
      return values;
    };
    const close = (reply: any) => {
      for (const layer of [...reply.layers, ...reply.foreground])
        for (const kind of ['colour', 'normal', 'surface', 'emissive']) layer[kind]?.close();
    };
    const rows = [];
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('worker initialization timed out')), 20000);
        worker.onmessage = ({ data }) => {
          if (data.ready) {
            clearTimeout(timer);
            resolve();
          }
        };
        worker.onerror = (error) => {
          clearTimeout(timer);
          reject(Error(error.message));
        };
      });
      for (let cycle = 0; cycle < 3; cycle++)
        for (let stage = 0; stage < 9; stage++) {
          const frame = {
            stage,
            stageSeed: 424242 + cycle,
            width: cycle === 2 ? 900 : 390,
            height: cycle === 2 ? 600 : 844,
            dpr: 2,
            lowQuality: cycle === 1,
            time: 1.25,
            reducedMotion: cycle === 1,
            reducedFlashes: cycle === 1,
          };
          const command = { kind: 'compose', key: JSON.stringify(frame), frame };
          const first = await request(command);
          let repeat: any;
          try {
            const before = await hashes(first);
            const prepared = await request({ kind: 'prepare', stage });
            repeat = await request(command);
            const rebuilt = await hashes(repeat),
              held = await hashes(first);
            const differences = [];
            const flatten = (reply: any) =>
              [...reply.layers, ...reply.foreground].flatMap((layer) =>
                ['colour', 'normal', 'surface', 'emissive']
                  .filter((kind) => layer[kind])
                  .map((kind) => layer[kind]),
              );
            const a = flatten(first),
              b = flatten(repeat);
            for (let i = 0; i < before.length; i++) {
              if (before[i].hash === rebuilt[i].hash) continue;
              const pixels = (bitmap: ImageBitmap) => {
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const g = canvas.getContext('2d', { willReadFrequently: true })!;
                g.drawImage(bitmap, 0, 0);
                const rgba = g.getImageData(0, 0, canvas.width, canvas.height).data;
                canvas.width = canvas.height = 0;
                return rgba;
              };
              const old = pixels(a[i]),
                fresh = pixels(b[i]);
              let max = 0,
                changed = 0;
              for (let p = 0; p < old.length; p++) {
                const d = Math.abs(old[p] - fresh[p]);
                max = Math.max(max, d);
                if (d) changed++;
              }
              differences.push({ plane: i, kind: before[i].kind, max, changed });
            }
            rows.push({
              cycle,
              stage,
              first: first.snapshot,
              prepared: prepared.snapshot,
              repeat: repeat.snapshot,
              before,
              rebuilt,
              held,
              differences,
            });
          } finally {
            close(first);
            if (repeat) close(repeat);
          }
        }
      return rows;
    } finally {
      worker.terminate();
      URL.revokeObjectURL(url);
    }
  });
  await writeFile(
    testInfo.outputPath('worker-plane-lifetime.json'),
    JSON.stringify(result, null, 2),
  );
  expect(result).toHaveLength(27);
  for (const row of result) {
    expect(row.prepared.width).toBe(row.first.width);
    expect(row.prepared.height).toBe(row.first.height);
    expect(row.prepared.pixels).toBe(row.first.pixels);
    expect(row.prepared.foreground.pixels).toBe(row.first.foreground.pixels);
    expect(row.prepared.materialCutouts.pixels).toBe(0);
    expect(row.prepared.decodedLoader.pinned).toBe(0);
    expect(row.prepared.decodedLoader.pinnedBytes).toBe(0);
    expect(row.first.decodedLoader.bytes).toBe(0);
    expect(row.repeat.decodedLoader.bytes).toBe(0);
    expect(row.repeat.builds).toBe(row.first.builds);
    expect(row.rebuilt).toEqual(row.before);
    expect(row.held).toEqual(row.before);
    expect(row.repeat.decodedLoader.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
  }
});
