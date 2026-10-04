// Runtime profiling harness. Hooks exist only in intercepted development responses.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { execFileSync } from 'node:child_process';
import { stripTypeScriptTypes } from 'node:module';
const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, ...v] = s.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }),
);
const origin = args.origin || 'http://127.0.0.1:5197';
const out = args.out || 'tmp/performance/legacy/current';
const repeats = Number(args.repeats || 3),
  duration = Number(args.duration || 2500),
  warmup = Number(args.warmup || 1500);
const scenarios = String(
  args.scenarios ||
    'title,stats,options,armoury,inspection,combat,demon,film-glitch,film-inferno,kill-effects,stress-100,reduced-title',
).split(',');
const baselineFilm = args.baseline
  ? stripTypeScriptTypes(
      execFileSync(
        'git',
        [
          '-c',
          `safe.directory=${process.cwd().replaceAll('\\', '/')}`,
          'show',
          '992c39d185f0c49658d05d295012f93faa405034:src/rendering/effects/film.ts',
        ],
        { encoding: 'utf8' },
      ),
    )
  : null;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-precise-memory-info'],
});
const percentile = (a, p) =>
  a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;
const stats = (a) => ({
  count: a.length,
  median: percentile(a, 0.5),
  p95: percentile(a, 0.95),
  max: Math.max(0, ...a),
});
const results = {
  metadata: {
    date: new Date().toISOString(),
    variant: args.baseline ? 'baseline optimizations disabled' : 'current worktree',
    opaqueExperiment: !!args.opaque,
    node: process.version,
    revision: execFileSync(
      'git',
      ['-c', `safe.directory=${process.cwd().replaceAll('\\', '/')}`, 'rev-parse', 'HEAD'],
      { encoding: 'utf8' },
    ).trim(),
    browser: browser.version(),
    viewport: { width: 390, height: 844 },
    dpr: 2,
    build: 'Vite development; route-injected instrumentation; no CPU throttling',
    warmupMs: warmup,
    sampleMs: duration,
    repeats,
    hardware: {
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      memoryGiB: totalmem() / 2 ** 30,
    },
    limitations:
      'Desktop headless browser; shared host load; CPU command time excludes deferred raster/GPU work; nominal image/canvas bytes are not resident GPU memory; no phone thermal or battery evidence.',
  },
  samples: [],
};
const hook = `window.__profile = {
 G, fx, frameLoop, startRun, spawnEnemy, enemyPos, killEnemy, startTrial,
 state: () => ({state:G.state,panel:G.panel,enemies:G.enemies.length,runTime:G.runTime,kills:G.kills,time,particles:Object.values(fx).reduce((n,a)=>n+a.length,0)}),
 configure(name) {
  window.__scenario=name;
  if (name==='demon') { startTrial('demon-mirror'); if(!activeTrial) throw Error('Trial did not start'); }
  else if(['combat','film-glitch','film-inferno','kill-effects','stress-100'].includes(name)) startRun();
  if(name==='film-glitch') EQ.film='trial-glitch';
  if(name==='film-inferno') EQ.film='trial-inferno';
  if(name==='kill-effects') EQ.fx='scattered-armour';
  if(name==='stress-100') {
   window.__resetProfileRandom(); time=0;
   G.enemies=[]; G.pendingSpawns=[]; G.toSpawn=0; G.attacker=null; G.gapT=1e9;
   for(let i=0;i<100;i++) { const e=spawnEnemy(i%5,true); e.state='idle'; e.fixed={x:W*(.06+(i%10)*.098),y:H*(.22+Math.floor(i/10)*.054),h:H*.14,fog:(i%5)*.08}; e.pos=enemyPos(e); }
  }
 },
 beforeUpdate() {
  if(window.__scenario==='stress-100') {G.gapT=1e9; return;}
  const e=G.attacker;
  if(e && e.state==='attack' && e.p>=.82) onSwipe(activeTrial?.mirrored?OPP[e.dir]:e.dir);
 },
};`;
function initProbe({ reduced, diagnostic }) {
  let seed = 424242;
  window.__resetProfileRandom = () => {
    seed = 424242;
  };
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Fresh context only. Fix run seed without changing application code.
  crypto.getRandomValues = (a) => {
    for (let i = 0; i < a.length; i++) a[i] = 424242 + i;
    return a;
  };
  localStorage.setItem('issen.stats', JSON.stringify({ runs: 1, roninWave: 10 }));
  localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  localStorage.setItem(
    'issen.settings',
    JSON.stringify({
      version: 1,
      quality: 'high',
      reducedMotion: reduced ? 'on' : 'off',
      reducedFlashes: reduced ? 'on' : 'off',
    }),
  );
  const p = (window.__probe = {
    frames: [],
    updates: [],
    renders: [],
    previews: [],
    last: 0,
    measure: false,
    canvases: [],
    images: [],
    draws: {},
    reads: 0,
    gradients: 0,
    contexts: [],
    diagnostic,
  });
  p.run = (name, fn) => {
    const t = performance.now();
    const result = fn();
    if (p.measure) p[name].push(performance.now() - t);
    return result;
  };
  p.frame = () => {
    const t = performance.now();
    if (p.measure && p.last) p.frames.push(t - p.last);
    p.last = t;
  };
  p.reset = () => {
    for (const k of ['frames', 'updates', 'renders', 'previews']) p[k] = [];
    p.draws = {};
    p.reads = 0;
    p.gradients = 0;
    p.last = 0;
    p.measure = true;
  };
  const create = document.createElement.bind(document);
  document.createElement = function (...a) {
    const e = create(...a);
    if (a[0] === 'canvas') p.canvases.push(new WeakRef(e));
    return e;
  };
  const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...src,
    set(v) {
      p.images.push(new WeakRef(this));
      src.set.call(this, v);
    },
  });
  const Audio = window.AudioContext;
  window.AudioContext = class extends Audio {
    constructor(...a) {
      super(...a);
      p.contexts.push(this);
    }
  };
  p.installCounters = () => {
    for (const method of [
      'drawImage',
      'getImageData',
      'createLinearGradient',
      'createRadialGradient',
    ]) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function (...a) {
        if (p.measure) {
          if (method === 'drawImage') {
            const key = this.canvas.id || 'offscreen';
            p.draws[key] = (p.draws[key] || 0) + 1;
          } else if (method === 'getImageData') p.reads++;
          else p.gradients++;
        }
        return original.apply(this, a);
      };
    }
  };
  if (diagnostic) p.installCounters();
  p.memory = () => {
    const canvases = new Set([
      ...document.querySelectorAll('canvas'),
      ...p.canvases.map((r) => r.deref()).filter(Boolean),
    ]);
    const images = new Set(p.images.map((r) => r.deref()).filter(Boolean));
    const sources = new Map([...images].map((i) => [i.src, i.naturalWidth * i.naturalHeight * 4]));
    return {
      canvasCount: canvases.size,
      canvasBytes: [...canvases].reduce((n, c) => n + c.width * c.height * 4, 0),
      imageObjects: images.size,
      uniqueDecodedSources: sources.size,
      uniqueImageBytes: [...sources.values()].reduce((a, b) => a + b, 0),
      imageObjectBytes: [...images].reduce((n, i) => n + i.naturalWidth * i.naturalHeight * 4, 0),
    };
  };
}
function cpuSummary(profile) {
  const map = new Map(profile.nodes.map((n) => [n.id, n])),
    self = new Map(),
    inclusive = new Map();
  const parents = new Map();
  for (const n of profile.nodes) for (const child of n.children || []) parents.set(child, n.id);
  for (let i = 0; i < (profile.samples || []).length; i++) {
    let id = profile.samples[i],
      ms = (profile.timeDeltas?.[i] || 0) / 1000;
    self.set(id, (self.get(id) || 0) + ms);
    for (let depth = 0; id && depth < 100; depth++, id = parents.get(id))
      inclusive.set(id, (inclusive.get(id) || 0) + ms);
  }
  const rows = [...map.values()].map((n) => ({
    function: n.callFrame.functionName || '(anonymous)',
    url: n.callFrame.url.replace(origin, ''),
    line: n.callFrame.lineNumber + 1,
    selfMs: self.get(n.id) || 0,
    inclusiveMs: inclusive.get(n.id) || 0,
  }));
  return {
    self: rows.sort((a, b) => b.selfMs - a.selfMs).slice(0, 25),
    inclusive: rows
      .filter((r) => r.url.includes('/src/'))
      .sort((a, b) => b.inclusiveMs - a.inclusiveMs)
      .slice(0, 25),
  };
}
async function makePage(scenario, diagnostic) {
  const context = await browser.newContext({
    viewport: results.metadata.viewport,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.addInitScript(initProbe, { reduced: scenario === 'reduced-title', diagnostic });
  if (baselineFilm)
    await page.route(/\/src\/rendering\/effects\/film\.ts(?:\?|$)/, (route) =>
      route.fulfill({ contentType: 'text/javascript', body: baselineFilm }),
    );
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    if (args.baseline) {
      if (
        !body.includes('if (G.panel === "armory" && armory.inspectionExpanded) return;') ||
        (body.match(/,\s*previewArtwork\s*\)/g) || []).length !== 2
      )
        throw Error('Baseline bypass anchors changed');
      body = body.replace('if (G.panel === "armory" && armory.inspectionExpanded) return;', '');
      body = body.replace(/,\s*previewArtwork\s*\)/g, ')');
    }
    if (args.opaque)
      body = body.replace(
        'canvas.getContext("2d")',
        'canvas.getContext("2d", canvas.id === \'c\' ? {alpha:false} : undefined)',
      );
    if (!body.includes('if (pageActive()) frameLoop.start();'))
      throw Error('Runtime hook anchor changed');
    body = body.replace(
      'if (pageActive()) frameLoop.start();',
      hook + ' if (pageActive()) frameLoop.start();',
    );
    body = body.replace(
      /\n\s*update,\n\s*render,\n/,
      `\nupdate: (dt,raw)=>window.__probe.run('updates',()=>{window.__profile?.beforeUpdate();update(dt,raw);}),\nrender: raw=>{window.__probe.frame();return window.__probe.run('renders',()=>render(raw));},\n`,
    );
    body = body.replace(
      'if (G.panel === "armory") drawPreview();',
      `if (G.panel === "armory") window.__probe.run('previews',drawPreview);`,
    );
    await route.fulfill({ response, body });
  });
  return { context, page, errors };
}
try {
  for (const scenario of scenarios) {
    for (let repetition = 0; repetition < repeats; repetition++) {
      const { context, page, errors } = await makePage(scenario, false);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Performance.enable');
      const start = performance.now();
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.__profile);
      const startupMs = performance.now() - start;
      if (['stats', 'options', 'armoury', 'inspection'].includes(scenario))
        await page
          .locator(
            { stats: '#bStats', options: '#bOptions', armoury: '#bArmory', inspection: '#bArmory' }[
              scenario
            ],
          )
          .click();
      if (scenario === 'inspection') await page.locator('#prevC').click();
      await page.evaluate((s) => window.__profile.configure(s), scenario);
      await page.waitForTimeout(warmup);
      const initial = await page.evaluate(() => window.__profile.state());
      await page.evaluate(() => window.__probe.reset());
      const before = await cdp.send('Performance.getMetrics');
      await page.waitForTimeout(duration);
      const after = await cdp.send('Performance.getMetrics');
      const sample = await page.evaluate(() => {
        const p = window.__probe;
        p.measure = false;
        return {
          frames: p.frames,
          updates: p.updates,
          renders: p.renders,
          previews: p.previews,
          memory: p.memory(),
          state: window.__profile.state(),
          alpha: document.querySelector('#c').getContext('2d').getContextAttributes().alpha,
        };
      });
      if (errors.length) throw Error(errors.join('\n'));
      if (!sample.renders.length) throw Error('No measured render callbacks');
      const metric = (m) => Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
      const a = metric(before),
        b = metric(after);
      const target = [
        'combat',
        'demon',
        'film-glitch',
        'film-inferno',
        'kill-effects',
        'stress-100',
      ].includes(scenario)
        ? 1000 / 60
        : 1000 / 30;
      const row = {
        scenario,
        repetition,
        startupMs,
        initial,
        ...sample,
        frames: stats(sample.frames),
        updates: stats(sample.updates),
        renders: stats(sample.renders),
        previews: stats(sample.previews),
        missedBudgetIntervals: sample.frames.filter((x) => x > target * 1.5).length,
        estimatedMissedSlots: sample.frames.reduce(
          (n, x) => n + Math.max(0, Math.round(x / target) - 1),
          0,
        ),
        heapStart: a.JSHeapUsedSize,
        heapEnd: b.JSHeapUsedSize,
        taskMs: (b.TaskDuration - a.TaskDuration) * 1000,
        scriptMs: (b.ScriptDuration - a.ScriptDuration) * 1000,
      };
      results.samples.push(row);
      console.log(JSON.stringify(row));
      await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
      await context.close();
    }
    if (args.diagnostics) {
      const { context, page, errors } = await makePage(scenario, false);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Profiler.enable');
      if (args['startup-allocations'])
        await cdp.send('HeapProfiler.startSampling', {
          samplingInterval: 32768,
          includeObjectsCollectedByMajorGC: true,
          includeObjectsCollectedByMinorGC: true,
        });
      await cdp.send('Profiler.start');
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.__profile);
      const startup = await cdp.send('Profiler.stop');
      let startupAllocationBytes;
      const startupHeap = await cdp.send('Runtime.getHeapUsage');
      if (args['startup-allocations']) {
        const startupAllocations = await cdp.send('HeapProfiler.stopSampling');
        await writeFile(
          `${out}/${scenario}-startup.heapprofile`,
          JSON.stringify(startupAllocations.profile),
        );
        const sum = (n) => n.selfSize + n.children.reduce((total, child) => total + sum(child), 0);
        startupAllocationBytes = sum(startupAllocations.profile.head);
      }
      await writeFile(`${out}/${scenario}-startup.cpuprofile`, JSON.stringify(startup.profile));
      if (['stats', 'options', 'armoury', 'inspection'].includes(scenario))
        await page
          .locator(
            { stats: '#bStats', options: '#bOptions', armoury: '#bArmory', inspection: '#bArmory' }[
              scenario
            ],
          )
          .click();
      if (scenario === 'inspection') await page.locator('#prevC').click();
      await page.evaluate((s) => window.__profile.configure(s), scenario);
      await page.waitForTimeout(warmup);
      await cdp.send('HeapProfiler.collectGarbage');
      await cdp.send('HeapProfiler.startSampling', {
        samplingInterval: 32768,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true,
      });
      await cdp.send('Tracing.start', {
        categories: 'devtools.timeline,v8,disabled-by-default-v8.gc',
        transferMode: 'ReturnAsStream',
      });
      await cdp.send('Profiler.start');
      await page.evaluate(() => window.__probe.reset());
      await page.waitForTimeout(duration);
      const cpu = await cdp.send('Profiler.stop');
      const allocations = await cdp.send('HeapProfiler.stopSampling');
      const complete = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
      await cdp.send('Tracing.end');
      const { stream } = await complete;
      let trace = '';
      for (;;) {
        const chunk = await cdp.send('IO.read', { handle: stream });
        trace += chunk.data;
        if (chunk.eof) break;
      }
      await cdp.send('IO.close', { handle: stream });
      await writeFile(`${out}/${scenario}.trace.json`, trace);
      await writeFile(`${out}/${scenario}.cpuprofile`, JSON.stringify(cpu.profile));
      await writeFile(`${out}/${scenario}.heapprofile`, JSON.stringify(allocations.profile));
      // Draw-call wrappers allocate argument arrays. Install them only AFTER CPU,
      // heap sampling and tracing stop, in their own explicitly labelled window.
      await page.evaluate(() => {
        window.__probe.installCounters();
        window.__probe.reset();
      });
      await page.waitForTimeout(1000);
      const diagnostic = await page.evaluate(() => ({
        counterWindowMs: 1000,
        draws: window.__probe.draws,
        reads: window.__probe.reads,
        gradients: window.__probe.gradients,
        memory: window.__probe.memory(),
      }));
      const events = JSON.parse(trace).traceEvents;
      diagnostic.gc = events
        .filter((e) => /^(MinorGC|MajorGC)$/.test(e.name) && e.ph === 'X')
        .map((e) => ({ name: e.name, ms: e.dur / 1000 }));
      diagnostic.cpu = cpuSummary(cpu.profile);
      diagnostic.startupCpu = cpuSummary(startup.profile);
      diagnostic.startupHeap = startupHeap;
      diagnostic.startupAllocationBytes = startupAllocationBytes;
      let allocationBytes = 0;
      const visit = (n) => {
        allocationBytes += n.selfSize;
        for (const c of n.children) visit(c);
      };
      visit(allocations.profile.head);
      diagnostic.sampledAllocationBytes = allocationBytes;
      diagnostic.metadata = results.metadata;
      await writeFile(`${out}/${scenario}-diagnostic.json`, JSON.stringify(diagnostic, null, 2));
      if (errors.length) throw Error(errors.join('\n'));
      await context.close();
    }
  }
} finally {
  await browser.close();
}
