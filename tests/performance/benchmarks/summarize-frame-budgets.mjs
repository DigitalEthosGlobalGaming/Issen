/** Add 120 Hz tail metrics to an unchanged legacy run's retained raw samples. */
import { readFile, writeFile } from 'node:fs/promises';
import { frameStats } from './scene-metrics.mjs';
const folder = process.argv[2];
if (!folder) throw Error('Usage: node summarize-frame-budgets.mjs tmp/performance/run');
const results = JSON.parse(await readFile(folder + '/results.json', 'utf8'));
if (results.status !== 'passed') throw Error('The baseline must be complete and passed');
const rows = [...new Set(results.samples.map((sample) => sample.scenario))].map((scenario) => {
  const samples = results.samples.filter((sample) => sample.scenario === scenario);
  return {
    scenario,
    samples: samples.length,
    intervals: frameStats(samples.flatMap((sample) => sample.raw.frames)),
    render: frameStats(samples.flatMap((sample) => sample.raw.renders)),
    update: frameStats(samples.flatMap((sample) => sample.raw.updates)),
    startup: frameStats(samples.map((sample) => sample.startupMs)),
    sampledHeapPeakBytes: Math.max(
      ...samples.flatMap((sample) => [sample.heapStart, sample.heapEnd]),
    ),
    estimatedMainDecodedPeakBytes: Math.max(
      ...samples.map((sample) => sample.memory.uniqueImageBytes),
    ),
  };
});
const report = {
  sourceFingerprint: results.manifest.sourceFingerprint,
  instrumentation: results.manifest.instrumentation,
  rows,
  limits: [
    'Intervals measure callbacks with the original 60 fps cap.',
    'Heap peaks are endpoint samples, not continuous process peaks.',
    'Decoded estimates exclude CSS, worker and GPU storage; use the scene probe for worker estimates.',
  ],
};
await writeFile(folder + '/frame-budgets.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
