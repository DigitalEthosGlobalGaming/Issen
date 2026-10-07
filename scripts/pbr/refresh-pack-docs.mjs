import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Refresh runtime map links while preserving authoring settings and provenance. */
export async function refreshPackDocs(root = path.resolve(import.meta.dirname, '../..')) {
  const catalog = JSON.parse(
    await readFile(path.join(root, 'scripts/pbr/asset-packs.json'), 'utf8'),
  );
  const directories = new Map();
  for (const job of [...catalog.assets, ...(catalog.installed ?? [])]) {
    const directory = path.resolve(root, job.output);
    if (!directory.startsWith(path.resolve(root) + path.sep))
      throw new Error('Pack directory must remain inside the repository');
    const families = directories.get(directory) ?? [];
    families.push(job);
    directories.set(directory, families);
  }
  let changed = 0;
  for (const [directory, families] of directories) {
    const readme = path.join(directory, 'README.md');
    let original;
    try {
      original = await readFile(readme, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    const rows = [];
    for (const family of families) {
      const stem = path.basename(family.source, '.png');
      const maps = [];
      for (const kind of ['diffuse', 'normal', 'surface', 'emissive']) {
        let plane;
        for (const ext of ['webp', 'png']) {
          const file = `${stem}_${kind}.${ext}`;
          try {
            await access(path.join(directory, file));
            plane = file;
            break;
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
          }
        }
        if (!plane && kind !== 'emissive')
          throw new Error(`Missing required plane in ${family.output}: ${kind}`);
        if (plane) maps.push(`[${kind}](${plane})`);
      }
      rows.push(`| ${stem} | ${maps.join(', ')} |`);
    }
    const block = [
      '<!-- runtime-planes:start -->',
      '## Runtime plane set',
      '',
      '| Source family | Aligned planes |',
      '| --- | --- |',
      ...rows,
      '',
      'Surface RGB stores roughness, metallic and AO. Missing emissive means zero.',
      'Atlas dimensions, frames and diffuse alpha are preserved. Original artwork,',
      'material recipes and generation provenance remain available for regeneration.',
      '<!-- runtime-planes:end -->',
    ].join('\n');
    let next = original
      .replace(
        /^Six aligned [^\n]+$/m,
        'Runtime planes retain the original atlas dimensions and diffuse alpha.',
      )
      .replace('Each PNG is', 'Each atlas plane is')
      .replace('The six 1254', 'The original six 1254')
      .replace(
        'The runtime packs roughness, metallic and AO',
        'The asset tool packs roughness, metallic and AO',
      );
    if (next.includes('<!-- runtime-planes:start -->'))
      next = next.replace(
        /<!-- runtime-planes:start -->[\s\S]*?<!-- runtime-planes:end -->/,
        block,
      );
    else if (/^Maps: .+$/m.test(next)) next = next.replace(/^Maps: .+$/m, block);
    else next = next.trimEnd() + '\n\n' + block + '\n';
    if (next !== original) {
      await writeFile(readme, next);
      changed++;
    }
  }
  return changed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(`Updated ${await refreshPackDocs()} pack documentation files.`);
