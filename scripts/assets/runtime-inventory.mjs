import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';
import {
  environmentAssetUrls,
  sceneAssetIndices,
} from '../../src/rendering/environment/asset-sources.ts';

const root = path.resolve(import.meta.dirname, '../..');
const relative = (value) => path.relative(root, value).replaceAll('\\', '/');
const imagePattern = /\.(?:png|webp|svg|jpg|jpeg|gif|avif)$/i;
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) => {
        const name = path.join(directory, entry.name);
        return entry.isDirectory() ? files(name) : [name];
      }),
    )
  ).flat();
}

/** Intrinsic dimensions only: nominal RGBA bytes are not resident GPU memory. */
export function imageDimensions(bytes, extension) {
  if (extension === '.png') return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  if (extension === '.webp') {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const kind = bytes.toString('ascii', offset, offset + 4),
        size = bytes.readUInt32LE(offset + 4),
        start = offset + 8;
      if (kind === 'VP8X')
        return [bytes.readUIntLE(start + 4, 3) + 1, bytes.readUIntLE(start + 7, 3) + 1];
      if (kind === 'VP8L') {
        const bits = bytes.readUInt32LE(start + 1);
        return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
      }
      if (kind === 'VP8 ')
        return [bytes.readUInt16LE(start + 6) & 0x3fff, bytes.readUInt16LE(start + 8) & 0x3fff];
      offset = start + size + (size & 1);
    }
  }
  if (extension === '.svg') {
    const header = bytes.toString('utf8').match(/<svg\b[^>]*>/)?.[0] ?? '';
    const dimension = (name) =>
      Number(header.match(new RegExp(`\\b${name}=["']([\\d.]+)(?:px)?["']`))?.[1]);
    const view = header
      .match(/\bviewBox=["']([^"']+)["']/)?.[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    return [dimension('width') || view?.[2], dimension('height') || view?.[3]];
  }
  throw Error(`Unsupported image dimensions: ${extension}`);
}

export async function runtimeInventory() {
  const sourceFiles = await files(path.join(root, 'src'));
  const publicFiles = await files(path.join(root, 'public'));
  const all = new Set([...sourceFiles, ...publicFiles].map(relative));
  const rows = new Map();
  const add = (name, consumer, role) => {
    if (!all.has(name)) throw Error(`Missing inventory source ${name}`);
    let row = rows.get(name);
    if (!row)
      rows.set(
        name,
        (row = { path: name, consumers: new Set(), roles: new Set(), stages: new Set() }),
      );
    row.consumers.add(consumer);
    row.roles.add(role);
    return row;
  };
  // Record the actual startup glob separately so accidental startup-only source
  // images are visible, rather than silently counting them as gameplay assets.
  for (const file of [...sourceFiles, ...publicFiles]) {
    const name = relative(file);
    if (/\.(?:webp|svg|jpg|jpeg|avif|gif)$/i.test(name) || name.endsWith('.compact.png')) {
      if (!/\/(?:pbr|[^/]+-pbr)\//.test(name)) add(name, 'src/main-game.ts', 'startup-glob');
    }
  }
  for (const file of sourceFiles.filter(
    (name) => /\.(?:ts|css|html)$/.test(name) && !name.endsWith('asset-material-catalog.ts'),
  )) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(
      /["']([^"'\r\n]+\.(?:png|webp|svg|jpg|jpeg|avif|gif))["']/gi,
    )) {
      const url = match[1];
      const name = url.startsWith('/src/')
        ? url.slice(1)
        : relative(path.resolve(path.dirname(file), url));
      if (all.has(name)) add(name, relative(file), 'direct-reference');
    }
  }
  const diffuseConsumers = new Set();
  for (const file of sourceFiles.filter((name) => name.endsWith('.ts'))) {
    const text = await readFile(file, 'utf8');
    if (!/\.diffuse\b/.test(text)) continue;
    for (const match of text.matchAll(/pack\.sourcePath\s*===\s*['"]([^'"]+\.png)['"]/g))
      diffuseConsumers.add(path.basename(match[1], '.png'));
  }
  const pairs = [];
  for (const pack of assetMaterialCatalog) {
    const source = relative(fileURLToPath(pack.source));
    const sourceRow = add(source, 'src/ui/lighting-debug.ts', 'material-preview');
    const consumers = [...sourceRow.consumers].filter(
      (name) => name !== 'src/main-game.ts' && name !== 'src/ui/lighting-debug.ts',
    );
    const stageIds = Array.from({ length: 9 }, (_, stage) => stage).filter((stage) =>
      sceneAssetIndices(stage).some((index) => environmentAssetUrls[index] === pack.source),
    );
    if (stageIds.length) {
      sourceRow.consumers.add('src/rendering/environment/local-renderer.ts');
      consumers.push('src/rendering/environment/local-renderer.ts');
    }
    for (const stage of stageIds) sourceRow.stages.add(stage);
    const family = path.basename(pack.sourcePath, '.png');
    const usesDiffuse =
      diffuseConsumers.has(family) ||
      rows.get(relative(fileURLToPath(pack.maps.diffuse)))?.roles.has('direct-reference') === true;
    for (const [kind, url] of Object.entries(pack.maps)) {
      const row = add(
        relative(fileURLToPath(url)),
        'src/rendering/pbr-atlas.ts',
        kind === 'diffuse' && !usesDiffuse ? 'unused-decoded-diffuse' : kind,
      );
      row.consumers.add(
        source.startsWith('src/ui/')
          ? 'src/ui/material-lighting.ts'
          : 'src/rendering/asset-materials.ts',
      );
      if (stageIds.length && kind !== 'diffuse')
        row.consumers.add('src/rendering/cached-materials.ts');
      for (const consumer of consumers) row.consumers.add(consumer);
      for (const stage of stageIds) row.stages.add(stage);
    }
    pairs.push({
      source,
      diffuse: relative(fileURLToPath(pack.maps.diffuse)),
      usesDiffuse,
      stages: stageIds,
      consumers,
    });
  }
  const assets = [];
  for (const row of [...rows.values()].sort((a, b) => a.path.localeCompare(b.path))) {
    const data = await readFile(path.join(root, row.path));
    const [width, height] = imageDimensions(data, path.extname(row.path));
    if (!(width > 0 && height > 0)) throw Error(`Missing intrinsic dimensions: ${row.path}`);
    assets.push({
      path: row.path,
      width,
      height,
      encodedBytes: data.length,
      decodedBytes: width * height * 4,
      consumers: [...row.consumers].sort(),
      roles: [...row.roles].sort(),
      stages: [...row.stages].sort(),
    });
  }
  const sum = (selected, key) => selected.reduce((total, row) => total + row[key], 0);
  const unused = assets.filter((row) => row.roles.includes('unused-decoded-diffuse'));
  const startupOnly = assets.filter(
    (row) => row.roles.length === 1 && row.roles[0] === 'startup-glob',
  );
  const stages = Array.from({ length: 9 }, (_, stage) => {
    const selected = assets.filter((row) => row.stages.includes(stage));
    return {
      stage,
      decodedBytesBefore: sum(selected, 'decodedBytes'),
      unusedDiffuseBytes: sum(
        selected.filter((row) => row.roles.includes('unused-decoded-diffuse')),
        'decodedBytes',
      ),
    };
  });
  return {
    version: 1,
    limits: [
      'Generated from runtime references/catalog and startup glob inputs; startup-only matches are excluded by the runtime manifest.',
      'Decoded bytes are nominal width×height×4; SVG bytes describe intrinsic raster size, not browser residency.',
      'Stage totals describe local compose kits; separate fog, figures, UI and canvas caches add memory.',
    ],
    totals: {
      files: assets.length,
      encodedBytes: sum(assets, 'encodedBytes'),
      decodedBytes: sum(assets, 'decodedBytes'),
      unusedDiffuseBytes: sum(unused, 'decodedBytes'),
      startupOnlyBytes: sum(startupOnly, 'decodedBytes'),
    },
    stages,
    duplicatePairs: pairs,
    startupOnly: startupOnly.map((row) => row.path),
    assets,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2] ?? 'scripts/assets/runtime-inventory.json';
  const inventory = await runtimeInventory();
  await writeFile(output, JSON.stringify(inventory, null, 2) + '\n');
  console.log(
    JSON.stringify({ output, totals: inventory.totals, stages: inventory.stages }, null, 2),
  );
}
