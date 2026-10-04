import { readFile, writeFile } from 'node:fs/promises';
const root = process.argv[2] || '.verification-build-profile';
const output = process.argv[3] || `${root}/summary.json`;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (n) => Math.round(n * 100) / 100;
const summary = {};
for (const label of [
  'baseline',
  'inspection',
  'shared-artwork',
  'film-copy',
  'opaque',
  'final',
  'paired-baseline-a',
  'paired-optimized-a',
  'paired-optimized-b',
  'paired-baseline-b',
  'stress-fixed-baseline',
  'stress-fixed-final',
]) {
  let data;
  try {
    data = JSON.parse(await readFile(`${root}/${label}/results.json`, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const m = data.metadata;
  summary[label] = {
    metadata: {
      date: m.date,
      revision: m.revision,
      browser: m.browser,
      viewport: m.viewport,
      dpr: m.dpr,
      build: m.build,
      warmupMs: m.warmupMs,
      sampleMs: m.sampleMs,
      repeats: m.repeats,
    },
    scenarios: {},
  };
  for (const scenario of new Set(data.samples.map((s) => s.scenario))) {
    const rows = data.samples.filter((s) => s.scenario === scenario);
    const med = (fn) => round(median(rows.map(fn)));
    const result = {
      startupMs: med((r) => r.startupMs),
      renderMedianMs: med((r) => r.renders.median),
      renderP95Ms: med((r) => r.renders.p95),
      updateMedianMs: med((r) => r.updates.median),
      previewMedianMs: med((r) => r.previews.median),
      frameMedianMs: med((r) => r.frames.median),
      frameP95Ms: med((r) => r.frames.p95),
      estimatedMissedSlots: rows.reduce((n, r) => n + r.estimatedMissedSlots, 0),
      taskMs: med((r) => r.taskMs),
      scriptMs: med((r) => r.scriptMs),
      heapEndMB: med((r) => r.heapEnd / 1e6),
      canvasMB: med((r) => r.memory.canvasBytes / 1e6),
      imageObjects: med((r) => r.memory.imageObjects),
      uniqueImageMB: med((r) => r.memory.uniqueImageBytes / 1e6),
      sampleEndStates: rows.map((r) => r.state),
    };
    try {
      const diagnosticLabel = label === 'baseline' ? 'baseline-clean' : label;
      const d = JSON.parse(
        await readFile(`${root}/${diagnosticLabel}/${scenario}-diagnostic.json`, 'utf8'),
      );
      result.diagnostic = {
        sampledAllocationsMB: round(d.sampledAllocationBytes / 1e6),
        gcCount: d.gc.length,
        gcMs: round(d.gc.reduce((n, e) => n + e.ms, 0)),
        counterWindowMs: d.counterWindowMs || m.sampleMs,
        draws: d.draws,
        reads: d.reads,
        gradients: d.gradients,
        cpuInclusive: d.cpu.inclusive.slice(0, 12).map((r) => ({
          ...r,
          url: r.url.split('?')[0].replace(/^\//, ''),
          selfMs: round(r.selfMs),
          inclusiveMs: round(r.inclusiveMs),
        })),
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    summary[label].scenarios[scenario] = result;
  }
}
await writeFile(output, JSON.stringify(summary, null, 2) + '\n');
for (const [label, group] of Object.entries(summary)) {
  console.log(label);
  for (const [scenario, row] of Object.entries(group.scenarios))
    console.log(
      `${scenario.padEnd(16)} render ${row.renderMedianMs.toFixed(2)} ms | task ${row.taskMs.toFixed(1)} ms | canvas ${row.canvasMB.toFixed(2)} MB`,
    );
}
