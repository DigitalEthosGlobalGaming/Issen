/** Source-mapped allocation samples from existing opt-in captures; launches no browser. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const folders = process.argv.slice(2);
if (!folders.length)
  throw Error('Usage: summarize-allocations.mjs captureFolder [captureFolder...]');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function decode(segment) {
  const values = [];
  let value = 0,
    shift = 0;
  for (const char of segment) {
    const digit = alphabet.indexOf(char);
    value += (digit & 31) * 2 ** shift;
    if (digit & 32) shift += 5;
    else {
      values.push(value & 1 ? -(value >> 1) : value >> 1);
      value = shift = 0;
    }
  }
  return values;
}
function sourceLines(map) {
  let source = 0,
    line = 0,
    column = 0,
    name = 0;
  return map.mappings.split(';').map((text) => {
    let generated = 0;
    return text
      .split(',')
      .filter(Boolean)
      .map((segment) => {
        const values = decode(segment);
        generated += values[0];
        if (values.length < 4) return { generated };
        source += values[1];
        line += values[2];
        column += values[3];
        if (values.length > 4) name += values[4];
        return {
          generated,
          source: map.sources[source],
          line: line + 1,
          name: values.length > 4 ? map.names[name] : undefined,
        };
      });
  });
}
for (const folder of folders) {
  const profile = JSON.parse(
    await readFile(path.join(folder, 'profiles/combat.heapprofile'), 'utf8'),
  );
  const cpu = JSON.parse(await readFile(path.join(folder, 'profiles/combat.cpuprofile'), 'utf8'));
  const diagnostic = JSON.parse(await readFile(path.join(folder, 'profiles/combat.json'), 'utf8'));
  const maps = new Map(),
    totals = new Map();
  async function position(frame) {
    if (!frame.url || frame.lineNumber < 0)
      return { source: '(native)', line: 0, name: frame.functionName };
    const filename = new URL(frame.url).pathname.replace(/^\//, '');
    if (!maps.has(filename)) {
      try {
        maps.set(
          filename,
          sourceLines(
            JSON.parse(await readFile(path.join(folder, 'build', filename + '.map'), 'utf8')),
          ),
        );
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        maps.set(filename, []);
      }
    }
    let found;
    for (const entry of maps.get(filename)[frame.lineNumber] ?? []) {
      if (entry.generated > frame.columnNumber) break;
      if (entry.source) found = entry;
    }
    return {
      source: found?.source ?? filename,
      line: found?.line ?? frame.lineNumber + 1,
      name: found?.name ?? frame.functionName,
    };
  }
  async function visit(node) {
    if (node.selfSize) {
      const location = await position(node.callFrame);
      const key = `${location.source}:${location.line}:${location.name}`;
      const row = totals.get(key) ?? { ...location, bytes: 0 };
      row.bytes += node.selfSize;
      totals.set(key, row);
    }
    for (const child of node.children) await visit(child);
  }
  await visit(profile.head);
  const seconds = (cpu.endTime - cpu.startTime) / 1e6;
  const rows = [...totals.values()].sort((a, b) => b.bytes - a.bytes);
  const projectRows = rows.filter(
    (row) => /\/src\//.test(row.source) && !row.source.includes('node_modules/'),
  );
  const report = {
    folder,
    seconds,
    sampledBytes: diagnostic.sampledAllocationBytes,
    sampledBytesPerSecond: diagnostic.sampledAllocationBytes / seconds,
    gc: diagnostic.gc,
    top: rows.slice(0, 20),
    projectBytes: projectRows.reduce((sum, row) => sum + row.bytes, 0),
    project: projectRows.slice(0, 25),
    limits:
      'Sampling includes collected objects; short diagnostic windows guide allocation fixes, not FPS or mobile performance claims.',
  };
  await writeFile(path.join(folder, 'allocation-summary.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
