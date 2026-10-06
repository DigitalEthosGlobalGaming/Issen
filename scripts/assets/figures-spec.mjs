import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';
import { CHARM_FRAMES } from '../../src/rendering/figures/charm-catalog.ts';
import { PLAYER_FRAMES } from '../../src/rendering/figures/player-catalog.ts';
import { OUTFIT_FRAMES, OUTFIT_SOURCE_STEMS } from '../../src/rendering/figures/outfit-catalog.ts';
import { WEAPON_FRAMES } from '../../src/rendering/figures/blade-recipes.ts';
import { ENEMY_FRAMES, ENEMY_SOURCE_STEMS } from '../../src/rendering/figures/enemy-catalog.ts';
import { INK_COMPANION_FRAMES } from '../../src/rendering/figures/companion-catalog.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
function extract(prefix, stem, frames, diffuse = false) {
  const pack = assetMaterialCatalog.find((pack) => pack.sourcePath.endsWith(`/${stem}.png`));
  if (!pack) throw Error(`Missing figure materials ${stem}`);
  return Object.entries(frames).map(([cell, frame]) => ({
    id: `${prefix}.${cell}`,
    frame,
    pivot: [frame[2] / 2, 0],
    maps: {
      colour: diffuse
        ? path.relative(root, fileURLToPath(pack.maps.diffuse)).replaceAll('\\', '/')
        : pack.sourcePath,
      ...Object.fromEntries(
        ['normal', 'surface', 'emissive']
          .filter((kind) => pack.maps[kind])
          .map((kind) => [
            kind,
            path.relative(root, fileURLToPath(pack.maps[kind])).replaceAll('\\', '/'),
          ]),
      ),
    },
  }));
}
const charms = extract('charm', 'charm-atlas', CHARM_FRAMES);
const player = extract('player', 'player-ronin-simple', PLAYER_FRAMES, true);
const outfits = Object.entries(OUTFIT_SOURCE_STEMS).flatMap(([key, stem]) =>
  extract(`outfit.${key}`, stem, OUTFIT_FRAMES[key]),
);
const weapons = Object.entries({
  blades: 'blade-profile-atlas',
  hilts: 'handle-guard-atlas',
  special: 'special-weapons-atlas',
}).flatMap(([family, stem]) =>
  extract(`weapon.${family}`, stem, WEAPON_FRAMES[family], family === 'blades'),
);
const enemies = Object.entries(ENEMY_SOURCE_STEMS).flatMap(([family, stem]) =>
  extract(`enemy.${family}`, stem, ENEMY_FRAMES[family], true),
);
const companions = [
  ...extract('companion.parts', 'companion-parts-atlas', INK_COMPANION_FRAMES),
  ...extract('companion', 'mystic-rock', { rock: [0, 0, 1145, 1373] }),
];
const sprites = [...charms, ...player, ...outfits, ...weapons, ...enemies, ...companions];
const dependencies = {
  charms: charms.map((sprite) => sprite.id),
  player: player.map((sprite) => sprite.id),
  outfits: outfits.map((sprite) => sprite.id),
  weapons: weapons.map((sprite) => sprite.id),
  enemies: enemies.map((sprite) => sprite.id),
  companions: companions
    .filter((sprite) => sprite.id === 'companion.rock' || Number(sprite.id.split('.').at(-1)) < 12)
    .map((sprite) => sprite.id),
  'companion-preview': companions.map((sprite) => sprite.id),
  ...Object.fromEntries(
    Object.keys(OUTFIT_SOURCE_STEMS).map((key) => [
      `outfit-${key}`,
      outfits.filter((sprite) => sprite.id.startsWith(`outfit.${key}.`)).map((sprite) => sprite.id),
    ]),
  ),
};
await mkdir('tmp/asset-pipeline', { recursive: true });
await writeFile(
  'tmp/asset-pipeline/figures.json',
  JSON.stringify(
    {
      version: 1,
      sprites,
      dependencies,
      packingGroups: Object.keys(dependencies).filter(
        (group) => !['outfits', 'companion-preview'].includes(group),
      ),
      configurationSources: [
        'scripts/assets/figures-spec.mjs',
        'scripts/assets/pack.py',
        'src/rendering/figures/charm-catalog.ts',
        'src/rendering/figures/player-catalog.ts',
        'src/rendering/figures/outfit-catalog.ts',
        'src/rendering/figures/blade-recipes.ts',
        'src/rendering/figures/enemy-catalog.ts',
        'src/rendering/figures/companion-catalog.ts',
        'src/rendering/asset-material-catalog.ts',
      ],
    },
    null,
    2,
  ),
);
console.log(`Extracted ${sprites.length} figure sprites.`);
