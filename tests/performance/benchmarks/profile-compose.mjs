/** Opt-in diagnostic captures; separate from uninstrumented compose timings. */
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const output = process.argv[2];
const stages = (process.argv[3] ?? '0').split(',').map(Number);
if (
  !output?.replaceAll('\\', '/').startsWith('tmp/') ||
  stages.some((s) => !Number.isInteger(s) || s < 0 || s > 8)
)
  throw Error('Usage: node profile-compose.mjs tmp/output [0,3]');
await mkdir(output, { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5296, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ channel: 'msedge' });
const cdp = await browser.newBrowserCDPSession();
const report = {
  status: 'running',
  rows: [],
  limits: [
    'Native method times are diagnostic wall time, including blocking graphics work; not pure CPU execution.',
    'CPU sampling and test-only method wrappers add overhead; do not compare these times to headline timing.',
    'Assets are predecoded. This diagnostic covers dev worker composition at 900x600 DPR1, fixed seed424242.',
  ],
};
let commandId = 0;
const pending = new Map();
cdp.on('Target.receivedMessageFromTarget', ({ message }) => {
  const data = JSON.parse(message);
  const command = pending.get(data.id);
  if (!command) return;
  pending.delete(data.id);
  clearTimeout(command.timeout);
  if (data.error) command.reject(Error(data.error.message));
  else command.resolve(data.result);
});
function send(sessionId, method, params = {}) {
  const id = ++commandId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(Error('Worker command timed out: ' + method));
    }, 10000);
    pending.set(id, { resolve, reject, timeout });
    void cdp
      .send('Target.sendMessageToTarget', {
        sessionId,
        message: JSON.stringify({ id, method, params }),
      })
      .catch((error) => {
        clearTimeout(timeout);
        pending.delete(id);
        reject(error);
      });
  });
}
try {
  for (const stage of stages)
    for (let repetition = 0; repetition < 3; repetition++) {
      const page = await browser.newPage();
      await page.goto('http://127.0.0.1:5296/privacy/index.html');
      await page.evaluate(async (stage) => {
        window.__worker = new Worker(
          '/src/rendering/environment/compose.worker.ts?worker_file&type=module',
          { type: 'module' },
        );
        let id = 0;
        window.__request = (data) =>
          new Promise((resolve, reject) => {
            window.__worker.onmessage = ({ data }) =>
              data.phase ? undefined : data.ok ? resolve(data) : reject(Error(data.error));
            window.__worker.onerror = reject;
            window.__worker.postMessage({ id: ++id, ...data });
          });
        await window.__request({ kind: 'prepare', stage });
      }, stage);
      const targets = await cdp.send('Target.getTargets');
      const target = targets.targetInfos.find(
        (t) => t.type === 'worker' && t.url.includes('/compose.worker.ts'),
      );
      if (!target) throw Error('Compose worker target missing');
      const { sessionId } = await cdp.send('Target.attachToTarget', {
        targetId: target.targetId,
        flatten: false,
      });
      await send(sessionId, 'Runtime.evaluate', {
        expression: `
      globalThis.__nativeTimes = {};
      for (const name of ['drawImage','getImageData','putImageData','fill','stroke','fillRect']) {
        const original = OffscreenCanvasRenderingContext2D.prototype[name];
        const stats = __nativeTimes[name] = { calls: 0, milliseconds: 0, routes: {} };
        OffscreenCanvasRenderingContext2D.prototype[name] = function(...args) {
          const start = performance.now();
          try { return Reflect.apply(original, this, args); }
          finally {
            const elapsed = performance.now() - start;
            stats.calls++; stats.milliseconds += elapsed;
            if (name === 'drawImage') {
              const source = args[0];
              const kind = source instanceof OffscreenCanvas
                ? source.getContext('2d').getContextAttributes().willReadFrequently ? 'software' : 'gpu'
                : 'bitmap';
              const target = this.getContextAttributes().willReadFrequently ? 'software' : 'gpu';
              const route = stats.routes[kind + '→' + target] ||= { calls: 0, milliseconds: 0 };
              route.calls++; route.milliseconds += elapsed;
            }
          }
        };
      }
    `,
      });
      await send(sessionId, 'Profiler.enable');
      await send(sessionId, 'Profiler.start');
      const snapshot = await page.evaluate(async (stage) => {
        const reply = await window.__request({
          kind: 'compose',
          key: 'profile',
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
        for (const layer of [...reply.layers, ...reply.foreground])
          for (const kind of ['colour', 'normal', 'surface', 'emissive']) layer[kind]?.close();
        return reply.snapshot;
      }, stage);
      const { profile } = await send(sessionId, 'Profiler.stop');
      const nativeResult = await send(sessionId, 'Runtime.evaluate', {
        expression: 'globalThis.__nativeTimes',
        returnByValue: true,
      });
      await writeFile(`${output}/${stage}-${repetition}.cpuprofile`, JSON.stringify(profile));
      const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
      const self = new Map();
      for (let i = 0; i < profile.samples.length; i++) {
        const node = nodes.get(profile.samples[i]);
        if (!node) continue;
        self.set(node.id, (self.get(node.id) ?? 0) + profile.timeDeltas[i] / 1000);
      }
      const hotspots = [...self]
        .map(([id, milliseconds]) => ({
          milliseconds,
          function: nodes.get(id).callFrame.functionName,
          source: nodes.get(id).callFrame.url.replace('http://127.0.0.1:5296/', ''),
          line: nodes.get(id).callFrame.lineNumber + 1,
        }))
        .sort((a, b) => b.milliseconds - a.milliseconds)
        .slice(0, 15);
      const row = { stage, repetition, snapshot, native: nativeResult.result.value, hotspots };
      report.rows.push(row);
      console.log(JSON.stringify(row));
      await cdp.send('Target.detachFromTarget', { sessionId });
      await page.evaluate(() => window.__worker.terminate());
      await page.close();
    }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  throw error;
} finally {
  await writeFile(output + '/results.json', JSON.stringify(report, null, 2));
  await browser.close();
  await server.close();
}
