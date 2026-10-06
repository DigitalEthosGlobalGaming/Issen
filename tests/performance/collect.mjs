import { writeFile } from 'node:fs/promises';
import { stats, cpuSummary } from './report.mjs';
import { configure, checkState, checkPresentation, cycleMenus } from './scenarios.mjs';

const metrics = (m) => Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
export async function measure(
  target,
  origin,
  config,
  scenario,
  repetition,
  out,
  diagnostic = false,
) {
  const { page, cdp, close } = await target.sample();
  const errors = [];
  const onError = (e) => errors.push(e.message);
  page.on('pageerror', onError);
  const onResponse = (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()}: ${r.url()}`);
  };
  page.on('response', onResponse);
  const imageResponses = [];
  const onImageResponse = (response) => {
    const url = response.url();
    if (!/^https?:/.test(url)) return;
    const headers = response.headers();
    if (
      !headers['content-type']?.startsWith('image/') &&
      !/\.(png|svg|jpe?g|webp)(?:\?|$)/i.test(url)
    )
      return;
    const length = Number(headers['content-length']);
    const timing = response.request().timing();
    imageResponses.push({
      url,
      encodedBodyBytes: Number.isFinite(length) ? length : null,
      requestStartEpochMs: timing.startTime,
    });
  };
  page.on('response', onImageResponse);

  let inactive = false;
  const verifyResume = async () => {
    if (!inactive) return null;
    const before = await page.evaluate(() => window.__profile.state());
    await page.evaluate(() => window.__probe.reset());
    await target.inactive(page, true);
    inactive = false;
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => {
      window.__probe.measure = false;
      return {
        state: window.__profile.state(),
        renders: window.__probe.renders.length,
        previews: window.__probe.previews.length,
      };
    });
    if (
      !(scenario === 'inactive-inspection' ? after.previews : after.renders) ||
      after.state.state !== before.state ||
      after.state.runTime - before.runTime > 0.5
    )
      throw Error('Resume failed or simulation caught up inactive time');
    return {
      method: config.target === 'web' ? 'synthetic visibility' : 'Android Home/activity resume',
      before,
      after,
    };
  };
  try {
    await cdp.send('Performance.enable');
    if (config.httpCache === 'disabled') {
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    }
    if (diagnostic) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.start');
    }
    const url = new URL(origin);
    url.searchParams.set('scenario', scenario);
    url.searchParams.set('seed', String(config.seed));
    url.searchParams.set('httpCache', config.httpCache);
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__profile?.schemaVersion === 1, {}, { timeout: 60000 });
    await page.waitForFunction(
      () => window.__loadingProbe.firstCompleteTitleMs !== null,
      {},
      { timeout: 60000 },
    );
    const startupMs = await page.evaluate(() => window.__profile.readyMs);
    if (diagnostic) {
      const profile = await cdp.send('Profiler.stop');
      await writeFile(
        `${out}/profiles/${scenario}-startup.cpuprofile`,
        JSON.stringify(profile.profile),
      );
    }
    await page.evaluate((name) => window.__loadingProbe.beginPhase(name), scenario);
    await configure(page, scenario);
    if (['combat', 'armoury', 'inspection', 'inactive-inspection'].includes(scenario))
      await page.waitForFunction(
        (name) => window.__loadingProbe.readyPhases[name] != null,
        scenario,
        { timeout: 60000 },
      );
    await page.waitForTimeout(config.warmup);
    if (scenario.startsWith('inactive-')) {
      await page.waitForFunction(
        () => window.__probe.contexts.some((c) => c.state === 'running'),
        {},
        { timeout: 5000 },
      );
      inactive = true;
      await target.inactive(page, false);
      // Audio suspension is asynchronous; exclude the transition from the settled sample.
      await page.waitForTimeout(200);
    }
    const initial = await page.evaluate(() => window.__profile.state());
    await page.evaluate(() => window.__probe.reset());
    const a = metrics(await cdp.send('Performance.getMetrics'));
    if (diagnostic) {
      await cdp.send('HeapProfiler.startSampling', {
        samplingInterval: 32768,
        includeObjectsCollectedByMajorGC: true,
        includeObjectsCollectedByMinorGC: true,
      });
      await cdp.send('Tracing.start', {
        categories: 'devtools.timeline,v8,disabled-by-default-v8.gc,blink,cc,gpu',
        transferMode: 'ReturnAsStream',
      });
      await cdp.send('Profiler.start');
    }
    // Allow a complete cycle, including cold worker composition, at default settings.
    const measurementMs =
      scenario === 'cinematic-transitions' ? Math.max(30000, config.duration) : config.duration;
    await page.waitForTimeout(measurementMs);
    const b = metrics(await cdp.send('Performance.getMetrics'));
    const sample = await page.evaluate(() => {
      const p = window.__probe;
      p.measure = false;
      return {
        frames: p.frames,
        updates: p.updates,
        renders: p.renders,
        previews: p.previews,
        previewFrames: p.previewFrames,
        longTasks: p.longTasks,
        memory: p.memory(),
        resources: p.resourceSnapshot(),
        loading: {
          ...window.__loadingProbe.snapshot(),
          timeOrigin: performance.timeOrigin,
          imageResourceTiming: performance
            .getEntriesByType('resource')
            .filter(
              (entry) =>
                /^https?:/.test(entry.name) && /\.(png|svg|jpe?g|webp)(?:\?|$)/i.test(entry.name),
            )
            .map((entry) => ({
              url: entry.name,
              startTime: entry.startTime,
              duration: entry.duration,
              encodedBodySize: entry.encodedBodySize,
              transferSize: entry.transferSize,
            })),
          paints: performance
            .getEntriesByType('paint')
            .map((entry) => ({ name: entry.name, startTime: entry.startTime })),
        },
        state: window.__profile.state(),
        audio: p.contexts.map((c) => c.state),
        actual: { viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio },
      };
    });
    sample.resources.workerSnapshots = await Promise.all(
      page.workers().map(async (worker) => {
        try {
          const resources = await worker.evaluate(() => ({
            resources: globalThis.__resourceProbe?.snapshot() ?? null,
            timeOrigin: performance.timeOrigin,
            imageResourceTiming: performance
              .getEntriesByType('resource')
              .filter(
                (entry) =>
                  /^https?:/.test(entry.name) && /\.(png|svg|jpe?g|webp)(?:\?|$)/i.test(entry.name),
              )
              .map((entry) => ({
                url: entry.name,
                startTime: entry.startTime,
                duration: entry.duration,
                encodedBodySize: entry.encodedBodySize,
                transferSize: entry.transferSize,
              })),
          }));
          if (!resources.resources && worker.url().includes('compose.worker'))
            throw Error('Composition worker resource probe missing');
          if (
            config.httpCache === 'disabled' &&
            worker.url().includes('compose.worker') &&
            resources.resources?.fetchCachePolicy !== 'worker-no-store'
          )
            throw Error('Composition worker cold-cache policy missing');
          return { instrumented: !!resources.resources, ...resources };
        } catch (error) {
          if (
            /Execution context was destroyed|Target closed|Worker has been closed/.test(
              error.message,
            )
          )
            return { terminated: true };
          throw error;
        }
      }),
    );
    const imageTotals = (rows) => {
      const unique = new Map();
      for (const row of rows)
        if (!unique.has(row.url) || unique.get(row.url) < row.encodedBodyBytes)
          unique.set(row.url, row.encodedBodyBytes);
      return {
        responses: rows.length,
        uniqueAssets: unique.size,
        knownEncodedAssetBytes: [...unique.values()].reduce((sum, value) => sum + (value ?? 0), 0),
        unknownEncodedAssets: [...unique.values()].filter((value) => value === null).length,
      };
    };
    sample.loading.networkImages = {
      all: imageTotals(imageResponses),
      beforeTitle: imageTotals(
        imageResponses.filter(
          (row) =>
            row.requestStartEpochMs <=
            sample.loading.timeOrigin + sample.loading.firstCompleteTitleMs,
        ),
      ),
      responses: imageResponses,
    };
    checkState(scenario, initial, sample.state);
    if (
      scenario.startsWith('inactive-') &&
      (sample.renders.length ||
        sample.updates.length ||
        sample.previews.length ||
        sample.audio.some((s) => s === 'running'))
    )
      throw Error('Inactive application continued rendering/updating/audio');
    checkPresentation(scenario, initial, sample);
    const targetMs = 1000 / 60;
    const row = {
      scenario,
      repetition,
      measurementMs,
      startupMs,
      initial,
      ...sample,
      raw: {
        frames: sample.frames,
        updates: sample.updates,
        renders: sample.renders,
        previews: sample.previews,
        previewFrames: sample.previewFrames,
      },
      frames: stats(sample.frames),
      updates: stats(sample.updates),
      renders: stats(sample.renders),
      previews: stats(sample.previews),
      previewFrames: stats(sample.previewFrames),
      heapStart: a.JSHeapUsedSize,
      heapEnd: b.JSHeapUsedSize,
      taskMs: (b.TaskDuration - a.TaskDuration) * 1000,
      scriptMs: (b.ScriptDuration - a.ScriptDuration) * 1000,
      estimatedMissedSlots: sample.frames.reduce(
        (n, t) => n + Math.max(0, Math.round(t / targetMs) - 1),
        0,
      ),
    };
    if (diagnostic) {
      const cpu = await cdp.send('Profiler.stop');
      const allocations = await cdp.send('HeapProfiler.stopSampling');
      const complete = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
      await cdp.send('Tracing.end');
      const { stream } = await complete;
      let trace = '';
      for (;;) {
        const chunk = await cdp.send('IO.read', { handle: stream });
        trace += chunk.base64Encoded ? Buffer.from(chunk.data, 'base64').toString() : chunk.data;
        if (chunk.eof) break;
      }
      await cdp.send('IO.close', { handle: stream });
      await writeFile(`${out}/traces/${scenario}.json`, trace);
      await writeFile(`${out}/profiles/${scenario}.cpuprofile`, JSON.stringify(cpu.profile));
      await writeFile(
        `${out}/profiles/${scenario}.heapprofile`,
        JSON.stringify(allocations.profile),
      );
      // Allocation-heavy canvas wrappers are restricted to this separate counter window.
      await page.evaluate(() => {
        window.__probe.installCounters();
        window.__probe.reset();
      });
      await page.waitForTimeout(1000);
      const counters = await page.evaluate(() => {
        const p = window.__probe;
        p.measure = false;
        return { draws: p.draws, readbacks: p.reads, gradients: p.gradients, memory: p.memory() };
      });
      const allocationBytes = (n) =>
        n.selfSize + n.children.reduce((sum, c) => sum + allocationBytes(c), 0);
      const events = JSON.parse(trace).traceEvents;
      const details = {
        scenario,
        counterWindowMs: 1000,
        counters,
        cpu: cpuSummary(cpu.profile),
        sampledAllocationBytes: allocationBytes(allocations.profile.head),
        gc: events
          .filter((e) => /^(MinorGC|MajorGC)$/.test(e.name) && e.ph === 'X')
          .map((e) => ({ name: e.name, durationMs: e.dur / 1000 })),
        capabilities: { gpuUtilisation: null, gpuResidentBytes: null, powerWatts: null },
        retention: scenario === 'menu-cycles' ? await cycleMenus(page, cdp) : null,
        lifecycle: await verifyResume(),
      };
      await writeFile(`${out}/profiles/${scenario}.json`, JSON.stringify(details, null, 2));
      if (!inactive) await page.screenshot({ path: `${out}/screenshots/${scenario}.png` });
      if (errors.length) throw Error(errors.join('\n'));
      return details;
    }
    if (errors.length) throw Error(errors.join('\n'));
    row.lifecycle = await verifyResume();
    return row;
  } finally {
    if (inactive) await target.inactive(page, true);
    page.off('pageerror', onError);
    page.off('response', onResponse);
    page.off('response', onImageResponse);
    await close();
  }
}

/** Fresh context: texture wrappers never share headline timing/CPU-trace samples. */
export async function captureTextureCounters(target, origin, config, scenario, out) {
  const { page, cdp, close } = await target.sample();
  let inactive = false;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  try {
    if (config.httpCache === 'disabled') {
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    }
    const url = new URL(origin);
    url.searchParams.set('scenario', scenario);
    url.searchParams.set('seed', String(config.seed));
    url.searchParams.set('textureCounters', '1');
    url.searchParams.set('httpCache', config.httpCache);
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__profile?.schemaVersion === 1, {}, { timeout: 60000 });
    await configure(page, scenario);
    await page.waitForTimeout(config.warmup);
    if (scenario.startsWith('inactive-')) {
      await target.inactive(page, false);
      inactive = true;
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(1000);
    const dom = await page.evaluate(() => window.__textureProbe.snapshot());
    const workers = await Promise.all(
      page.workers().map(async (worker) => {
        const counters = await worker.evaluate(() => globalThis.__textureProbe?.snapshot() ?? null);
        if (worker.url().includes('compose.worker') && !counters?.installed)
          throw Error('Worker texture counters were not installed');
        return { instrumented: !!counters, counters };
      }),
    );
    if (!dom.installed) throw Error('Texture counters were not installed');
    if (errors.length) throw Error(errors.join('\n'));
    const result = {
      scenario,
      independentContext: true,
      counterWindowMs: 1000,
      coverage: 'API calls and declared RGBA extents; not physical GPU memory or execution time',
      dom,
      workers,
    };
    await writeFile(`${out}/profiles/${scenario}-textures.json`, JSON.stringify(result, null, 2));
    return result;
  } finally {
    if (inactive) await target.inactive(page, true);
    await close();
  }
}
