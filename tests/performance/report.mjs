import { writeFile } from 'node:fs/promises';

export function stats(values) {
  const a = values.filter(Number.isFinite).sort((x, y) => x - y);
  if (!a.length) return { count: 0, median: null, p95: null, min: null, max: null };
  const m = a.length >> 1;
  return {
    count: a.length,
    median: a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2,
    p95: a[Math.max(0, Math.ceil(a.length * 0.95) - 1)],
    min: a[0],
    max: a.at(-1),
  };
}
export function summarize(samples) {
  return [...new Set(samples.map((s) => s.scenario))].map((scenario) => {
    const rows = samples.filter((s) => s.scenario === scenario);
    const render = stats(rows.map((s) => s.renders.median));
    return {
      scenario,
      samples: rows.length,
      renderMs: render,
      frameP95Ms: stats(rows.map((s) => s.frames.p95)),
      taskMs: stats(rows.map((s) => s.taskMs)),
      heapEndBytes: stats(rows.map((s) => s.heapEnd)),
      startupMs: stats(rows.map((s) => s.startupMs)),
      noisy: render.median > 0 && (render.max - render.min) / render.median > 0.25,
    };
  });
}
export function comparison(current, baseline) {
  if (baseline.status !== 'passed') throw Error('Baseline must be a completed, passing run');
  const keys = [
    'schemaVersion',
    'target',
    'browser',
    'viewport',
    'dpr',
    'buildMode',
    'quality',
    'seed',
    'warmup',
    'duration',
    'repeats',
    'headed',
    'platform',
    'cpu',
    'graphics',
    'deviceIdentity',
    'instrumentation',
  ];
  const mismatches = keys.filter(
    (key) => JSON.stringify(current.manifest[key]) !== JSON.stringify(baseline.manifest[key]),
  );
  if (mismatches.length) throw Error(`Incompatible baseline: ${mismatches.join(', ')}`);
  const rows = summarize(current.samples).map((now) => {
    const before = summarize(baseline.samples).find((s) => s.scenario === now.scenario);
    if (!before) throw Error(`Baseline lacks scenario ${now.scenario}`);
    const deltas = Object.fromEntries(
      ['renderMs', 'frameP95Ms', 'taskMs', 'heapEndBytes', 'startupMs'].map((key) => {
        const b = before[key].median,
          a = now[key].median;
        return [
          key,
          {
            before: b,
            after: a,
            delta: b === null || a === null ? null : a - b,
            deltaPercent: b > 0 && a !== null ? (a / b - 1) * 100 : null,
          },
        ];
      }),
    );
    return {
      scenario: now.scenario,
      ...deltas,
      noisy: before.noisy || now.noisy,
    };
  });
  return rows;
}
export function cpuSummary(profile) {
  const self = new Map();
  for (let i = 0; i < (profile.samples || []).length; i++)
    self.set(
      profile.samples[i],
      (self.get(profile.samples[i]) || 0) + (profile.timeDeltas[i] || 0) / 1000,
    );
  return profile.nodes
    .map((n) => ({
      function: n.callFrame.functionName || '(anonymous)',
      url: n.callFrame.url,
      line: n.callFrame.lineNumber + 1,
      selfMs: self.get(n.id) || 0,
    }))
    .sort((a, b) => b.selfMs - a.selfMs)
    .slice(0, 20);
}
const number = (n) => (n === null || n === undefined ? '—' : n.toFixed(2));
const escape = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export async function writeReport(out, results) {
  results.summary = summarize(results.samples);
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
  const lines = [
    `# Issen performance report`,
    ``,
    `Status: **${results.status}**. Target: ${results.manifest.target}. Build: ${results.manifest.buildMode}.`,
    ``,
    `Sequential samples; render time measures CPU submission, not total GPU execution. No battery/thermal estimate.`,
    ``,
    `| Scenario | Samples | Render median ms | Frame p95 ms | Task ms/window | Heap end MB |`,
    `|---|---:|---:|---:|---:|---:|`,
    ...results.summary.map(
      (s) =>
        `| ${s.scenario}${s.noisy ? ' (variable)' : ''} | ${s.samples} | ${number(s.renderMs.median)} | ${number(s.frameP95Ms.median)} | ${number(s.taskMs.median)} | ${number(s.heapEndBytes.median / 1e6)} |`,
    ),
    ``,
    `Stress-100 uses 100 animated waiting actors through real update/render systems, not 100 simultaneous fights.`,
    `menu-cycles timing covers its settled title; retained-memory cycling is a separate diagnostic.`,
    `Startup is fresh-context navigation-to-artwork-ready, not a cold OS/browser-process launch.`,
    `Frame intervals come from game callbacks. Estimated missed slots are not compositor-confirmed drops.`,
    `Canvas/image bytes are nominal RGBA sizes, not resident graphics memory. GPU utilisation, resident GPU bytes and watts are unsupported.`,
    `Empty callback samples mean no observed callbacks; they are not zero-duration frames.`,
    `Variable marks a >25% render-median range between repetitions; inspect individual samples and rerun before drawing conclusions.`,
    ``,
    `## Diagnostic artifacts`,
    ``,
    ...results.diagnostics.map(
      (d) =>
        `- ${d.scenario}: [CPU](profiles/${d.scenario}.cpuprofile), [allocations](profiles/${d.scenario}.heapprofile), [trace](traces/${d.scenario}.json), [details](profiles/${d.scenario}.json)`,
    ),
    ``,
    `## Comparison`,
    ``,
    results.comparison
      ? JSON.stringify(results.comparison, null, 2)
      : 'No baseline comparison requested.',
    ``,
    `## Errors`,
    ``,
    ...results.errors.map((e) => `- ${e}`),
    ``,
    `Full metadata and individual sample arrays: [results.json](results.json). Source maps are retained in build/assets.`,
  ];
  await writeFile(`${out}/report.md`, lines.join('\n') + '\n');
  const rows = results.summary
    .map(
      (s) =>
        `<tr><td>${escape(s.scenario)}${s.noisy ? ' ⚠ variable' : ''}</td><td>${s.samples}</td><td>${number(s.renderMs.median)}</td><td>${number(s.frameP95Ms.median)}</td><td>${number(s.taskMs.median)}</td><td>${number(s.heapEndBytes.median === null ? null : s.heapEndBytes.median / 1e6)}</td></tr>`,
    )
    .join('');
  const diagnostics = results.diagnostics
    .map(
      (d) =>
        `<details><summary>${escape(d.scenario)} — ${(d.sampledAllocationBytes / 1e6).toFixed(2)} MB sampled allocation; ${d.gc.length} GC events</summary><p><a href="profiles/${d.scenario}.cpuprofile">CPU profile</a> · <a href="profiles/${d.scenario}.heapprofile">Allocation profile</a> · <a href="traces/${d.scenario}.json">Trace</a> · <a href="profiles/${d.scenario}.json">All counters</a></p><table><tr><th>Function (generated code; source maps retained)</th><th>Sampled self ms</th></tr>${d.cpu
          .slice(0, 10)
          .map((f) => `<tr><td>${escape(f.function)}</td><td>${number(f.selfMs)}</td></tr>`)
          .join(
            '',
          )}</table>${d.retention ? `<p>Forced-GC retained-heap series: ${d.retention.map((r) => (r.usedSize / 1e6).toFixed(2)).join(' → ')} MB. Growth is a diagnostic signal, not proof of a leak.</p>` : ''}</details>`,
    )
    .join('');
  await writeFile(
    `${out}/report.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Issen performance report</title><style>body{max-width:1100px;margin:2rem auto;padding:1rem;background:#181816;color:#eee5d2;font:15px/1.6 system-ui}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#edc788}table{border-collapse:collapse;width:100%;margin:1rem 0}td,th{text-align:left;padding:.5rem;border-bottom:1px solid #514b41}details{padding:1rem;background:#24221e;margin:1rem 0}summary{cursor:pointer;font-weight:600}.scroll{overflow:auto}.muted{color:#c6baa6}</style><h1>Issen performance report</h1><p><strong>${escape(results.status)}</strong> · ${escape(results.manifest.target)} · ${escape(results.manifest.browser || 'not launched')}</p><p class="muted">${escape(results.manifest.buildMode)}. Sequential samples with separate diagnostics. Render time measures CPU command submission, not total GPU execution.</p><p><a href="results.json">Raw results</a> · <a href="manifest.json">Run manifest</a> · <a href="report.md">Markdown report</a></p><div class="scroll"><table><thead><tr><th>Scenario</th><th>Samples</th><th>Render median ms</th><th>Frame p95 ms</th><th>Task ms/window</th><th>Heap end MB</th></tr></thead><tbody>${rows}</tbody></table></div><p>⚠ Variable means the range of repetition medians exceeds 25% of their median. Inspect samples before drawing conclusions. — means no observations.</p><h2>Profiles and allocation diagnostics</h2>${diagnostics || '<p>No diagnostic captures in this run.</p>'}<h2>Comparison</h2><pre>${escape(results.comparison ? JSON.stringify(results.comparison, null, 2) : 'No baseline comparison requested.')}</pre><h2>Interpretation</h2><p>Stress-100 represents 100 animated waiting actors, separately from normal combat. menu-cycles times its settled title and records retained-memory cycles separately. Startup measures fresh-context navigation to artwork readiness, not cold device startup. Estimated missed slots are not confirmed display drops. Canvas/image bytes are nominal RGBA storage; GPU utilisation, resident GPU bytes, power and battery life are not measured.</p><h2>Errors</h2><pre>${escape(results.errors.join('\n') || 'None')}</pre></html>`,
  );
}
