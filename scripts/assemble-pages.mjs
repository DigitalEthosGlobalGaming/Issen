import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { previewDirectory } from './pages-path.mjs';

export function assemblePages(build, site, branch) {
  build = resolve(build);
  site = resolve(site);
  if (build === site || build.startsWith(site + sep) || site.startsWith(build + sep))
    throw new Error('Build and site must be separate directories.');
  if (!existsSync(join(build, 'index.html'))) throw new Error('Build has no index.html.');
  mkdirSync(site, { recursive: true });
  const manifestFile = join(site, '.issen-previews.json');
  const previews = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : [];
  if (
    !Array.isArray(previews) ||
    previews.some((name) => typeof name !== 'string' || previewDirectory(name) !== name)
  )
    throw new Error('Invalid preview manifest.');
  if (branch === 'main') {
    const entries = readdirSync(build);
    if (entries.some((name) => previews.includes(name)))
      throw new Error('Production files collide with a preview directory.');
    for (const name of readdirSync(site)) {
      if (name !== '.git' && name !== '.issen-previews.json' && !previews.includes(name))
        rmSync(join(site, name), { recursive: true, force: true });
    }
    for (const name of entries) cpSync(join(build, name), join(site, name), { recursive: true });
  } else {
    if (!existsSync(join(site, 'index.html')))
      throw new Error('Seed production before deploying a preview.');
    const directory = previewDirectory(branch);
    if (existsSync(join(site, directory)) && !previews.includes(directory))
      throw new Error('Preview would overwrite production files.');
    rmSync(join(site, directory), { recursive: true, force: true });
    cpSync(build, join(site, directory), { recursive: true });
    if (!previews.includes(directory)) previews.push(directory);
  }
  writeFileSync(manifestFile, JSON.stringify(previews.sort()) + '\n');
  writeFileSync(join(site, '.nojekyll'), '');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [build, site, branch] = process.argv.slice(2);
  if (!build || !site || !branch)
    throw new Error('Usage: node scripts/assemble-pages.mjs <build> <site> <branch>');
  assemblePages(build, site, branch);
}
