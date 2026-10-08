// Opt-in worker timings and raw-plane parity against an unchanged saved baseline.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
const output = process.argv[2];
const baseline = process.argv[3];
if (!output) throw Error('Usage: node measure-compose.mjs tmp/output [tmp/baseline]');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5297, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'msedge' });
const rows = [];
try {
  for (const stage of [0, 1]) {
    for (let repetition = 0; repetition < 5; repetition++) {
      const page = await browser.newPage();
      await page.goto('http://127.0.0.1:5297/privacy/index.html');
      const result = await page.evaluate(
        async ({ stage, capture }) => {
          const worker = new Worker(
            '/src/rendering/environment/compose.worker.ts?worker_file&type=module',
            { type: 'module' },
          );
          let id = 0;
          const request = (data) =>
            new Promise((resolve, reject) => {
              worker.onmessage = ({ data }) =>
                data.ok ? resolve(data) : reject(Error(data.error));
              worker.onerror = reject;
              worker.postMessage({ id: ++id, ...data });
            });
          try {
            await request({ kind: 'prepare', stage });
            const start = performance.now();
            const reply = await request({
              kind: 'compose',
              key: 'fixed',
              frame: {
                width: 900,
                height: 600,
                dpr: 1,
                time: 0,
                stage,
                stageSeed: 424242,
                reducedMotion: true,
                reducedFlashes: true,
                lowQuality: false,
              },
            });
            const milliseconds = performance.now() - start;
            const planes = [];
            for (const [index, layer] of reply.layers.entries()) {
              for (const kind of ['colour', 'normal', 'surface', 'emissive']) {
                const image = layer[kind];
                if (!image) continue;
                if (capture) {
                  const canvas = document.createElement('canvas');
                  canvas.width = image.width;
                  canvas.height = image.height;
                  const ctx = canvas.getContext('2d', { willReadFrequently: true });
                  ctx.drawImage(image, 0, 0);
                  const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                  let binary = '';
                  for (let i = 0; i < bytes.length; i += 32768)
                    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
                  planes.push({ name: index + '-' + kind, bytes: btoa(binary) });
                }
                image.close();
              }
            }
            return { milliseconds, planes };
          } finally {
            worker.terminate();
          }
        },
        { stage, capture: repetition === 0 },
      );
      const differences = [];
      for (const plane of result.planes) {
        const bytes = Buffer.from(plane.bytes, 'base64');
        const name = stage + '-' + plane.name + '.rgba';
        await writeFile(output + '/' + name, bytes);
        if (baseline) {
          const before = await readFile(baseline + '/' + name);
          if (before.length !== bytes.length) throw Error('Plane dimensions changed: ' + name);
          let sum = 0,
            max = 0,
            alphaMax = 0;
          for (let i = 0; i < bytes.length; i++) {
            const delta = Math.abs(bytes[i] - before[i]);
            sum += delta;
            max = Math.max(max, delta);
            if (i % 4 === 3) alphaMax = Math.max(alphaMax, delta);
          }
          differences.push({ name, mean: sum / bytes.length, max, alphaMax });
          // Unpremultiplication amplifies one-byte edge differences; retain alpha and mean guards.
          if (sum / bytes.length > 0.5 || alphaMax > 1)
            throw Error('Compose pixels changed: ' + JSON.stringify(differences.at(-1)));
        }
      }
      rows.push({ stage, repetition, milliseconds: result.milliseconds, differences });
      console.log(JSON.stringify(rows.at(-1)));
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
  await writeFile(output + '/results.json', JSON.stringify(rows, null, 2));
}
