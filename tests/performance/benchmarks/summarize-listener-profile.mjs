/** Self-time comparison from the existing opt-in CPU captures; does not launch profiling. */
import { readFile, writeFile } from 'node:fs/promises';
const [before, after] = process.argv.slice(2);
if (!before || !after)
  throw Error('Usage: summarize-listener-profile.mjs baselineFolder afterFolder');
async function selfTime(folder, scenario) {
  const profile = JSON.parse(await readFile(`${folder}/profiles/${scenario}.cpuprofile`, 'utf8'));
  const names = new Map(profile.nodes.map((node) => [node.id, node.callFrame.functionName]));
  let microseconds = 0;
  for (let i = 0; i < profile.samples.length; i++) {
    if (/(?:^|\.)removeListener$/.test(names.get(profile.samples[i]) ?? ''))
      microseconds += profile.timeDeltas[i];
  }
  return microseconds / 1000;
}
const rows = [];
for (const scenario of ['combat', 'demon', 'film-inferno']) {
  rows.push({
    scenario,
    beforeMs: await selfTime(before, scenario),
    afterMs: await selfTime(after, scenario),
  });
}
const report = {
  rows,
  limits: [
    'Sampled self time during the diagnostic window; not inclusive cost or a timing-run measurement.',
  ],
};
await writeFile(`${after}/listener-profile.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
