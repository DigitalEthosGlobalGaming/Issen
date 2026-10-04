import { writeFile } from 'node:fs/promises';
import { stats, cpuSummary } from './report.mjs';
import { configure, checkState, cycleMenus } from './scenarios.mjs';

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
      return { state: window.__profile.state(), renders: window.__probe.renders.length };
    });
    if (
      !after.renders ||
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
    if (diagnostic) {
      await cdp.send('Profiler.enable');
      await cdp.send('Profiler.start');
    }
    const url = new URL(origin);
    url.searchParams.set('scenario', scenario);
    url.searchParams.set('seed', String(config.seed));
    await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.__profile?.schemaVersion === 1, {}, { timeout: 60000 });
    const startupMs = await page.evaluate(() => window.__profile.readyMs);
    if (diagnostic) {
      const profile = await cdp.send('Profiler.stop');
      await writeFile(
        `${out}/profiles/${scenario}-startup.cpuprofile`,
        JSON.stringify(profile.profile),
      );
    }
    await configure(page, scenario);
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
    await page.waitForTimeout(config.duration);
    const b = metrics(await cdp.send('Performance.getMetrics'));
    const sample = await page.evaluate(() => {
      const p = window.__probe;
      p.measure = false;
      return {
        frames: p.frames,
        updates: p.updates,
        renders: p.renders,
        previews: p.previews,
        longTasks: p.longTasks,
        memory: p.memory(),
        state: window.__profile.state(),
        audio: p.contexts.map((c) => c.state),
        actual: { viewport: { width: innerWidth, height: innerHeight }, dpr: devicePixelRatio },
      };
    });
    checkState(scenario, initial, sample.state);
    if (
      scenario.startsWith('inactive-') &&
      (sample.renders.length ||
        sample.updates.length ||
        sample.previews.length ||
        sample.audio.some((s) => s === 'running'))
    )
      throw Error('Inactive application continued rendering/updating/audio');
    if (!scenario.startsWith('inactive-') && !sample.renders.length)
      throw Error('Active scenario produced no render callbacks');
    const targetMs = [
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
      raw: {
        frames: sample.frames,
        updates: sample.updates,
        renders: sample.renders,
        previews: sample.previews,
      },
      frames: stats(sample.frames),
      updates: stats(sample.updates),
      renders: stats(sample.renders),
      previews: stats(sample.previews),
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
    await close();
  }
}
