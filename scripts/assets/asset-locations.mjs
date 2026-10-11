import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

/** Catalogue regeneration keeps archived, unused colour maps out of runtime output. */
export async function loadRuntimeAliases(root) {
  try {
    const cleanup = JSON.parse(
      await readFile(path.join(root, 'scripts/assets/asset-cleanup.json'), 'utf8'),
    );
    const aliases = cleanup.runtimeAliases ?? {};
    for (const [original, canonical] of Object.entries(aliases)) {
      for (const file of [original, canonical]) {
        const resolved = path.resolve(root, file);
        if (!resolved.startsWith(path.resolve(root) + path.sep))
          throw new Error('Asset aliases must remain inside the repository');
      }
      await access(path.join(root, canonical));
    }
    return aliases;
  } catch (error) {
    if (
      error.code === 'ENOENT' &&
      error.path === path.join(root, 'scripts/assets/asset-cleanup.json')
    )
      return {};
    throw error;
  }
}
