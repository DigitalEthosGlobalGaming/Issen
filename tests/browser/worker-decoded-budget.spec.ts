import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

for (const deviceMemory of [8, 2])
  test(`worker cycles every stage within the ${deviceMemory === 2 ? 256 : 512} MiB decoded budget`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (deviceMemory) => {
      const moduleUrl = new URL(
        '/src/rendering/environment/compose.worker.ts?worker_file&type=module',
        location.origin,
      ).href;
      const fixtureUrl = URL.createObjectURL(
        new Blob(
          [
            'Object.defineProperty(navigator, "deviceMemory", { value: ' +
              deviceMemory +
              ' });' +
              'await import(' +
              JSON.stringify(moduleUrl) +
              ');postMessage({ready:true});',
          ],
          { type: 'text/javascript' },
        ),
      );
      const worker = new Worker(fixtureUrl, { type: 'module' });
      const ready = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(Error('worker fixture initialization timed out')),
          20_000,
        );
        worker.onmessage = ({ data }) => {
          if (data.ready) {
            clearTimeout(timeout);
            resolve();
          }
        };
        worker.onerror = (error) => {
          clearTimeout(timeout);
          reject(Error(error.message));
        };
      });
      let id = 0;
      const request = (data: any) =>
        new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => reject(Error('worker budget cycle timed out')), 20_000);
          worker.onmessage = ({ data }) => {
            if (data.phase) return;
            clearTimeout(timeout);
            data.ok ? resolve(data) : reject(Error(data.error));
          };
          worker.onerror = (error) => {
            clearTimeout(timeout);
            reject(Error(error.message));
          };
          worker.postMessage({ id: ++id, ...data });
        });
      const rows: any[] = [];
      try {
        await ready;
        for (let cycle = 0; cycle < 3; cycle++)
          for (let stage = 0; stage < 9; stage++) {
            await request({ kind: 'prepare', stage });
            const reply = await request({
              kind: 'compose',
              key: `${cycle}:${stage}`,
              frame: {
                width: 390,
                height: 844,
                dpr: 2,
                time: 0,
                stage,
                stageSeed: 424242,
                reducedMotion: true,
                reducedFlashes: true,
                lowQuality: false,
              },
            });
            rows.push({
              cycle,
              stage,
              cutouts: reply.snapshot.materialCutouts,
              ...reply.snapshot.decodedLoader,
            });
            for (const layer of [...reply.layers, ...reply.foreground])
              for (const kind of ['colour', 'normal', 'surface', 'emissive']) layer[kind]?.close();
          }
        return rows;
      } finally {
        worker.terminate();
        URL.revokeObjectURL(fixtureUrl);
      }
    }, deviceMemory);
    expect(result).toHaveLength(27);
    expect(result[0].budget).toBe((deviceMemory === 2 ? 256 : 512) * 1024 * 1024);
    expect(result.every((row) => row.bytes <= row.budget && row.peakBytes <= row.budget)).toBe(
      true,
    );
    expect(
      result.every((row) => row.queued === 0 && row.pinned === 0 && row.pinnedBytes === 0),
    ).toBe(true);
    expect(
      result.every(
        (row) =>
          row.cutouts.entries === 0 && row.cutouts.pixels === 0 && row.cutouts.scratchPixels === 0,
      ),
    ).toBe(true);
    expect(result.at(-1).evictions).toBeGreaterThan(0);
    const output = testInfo.outputPath('worker-budget-cycle.json');
    await writeFile(output, JSON.stringify(result, null, 2));
    await testInfo.attach('worker decoded budget', {
      path: output,
      contentType: 'application/json',
    });
  });
