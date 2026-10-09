import type { Random } from '../../shared/random.ts';

export const DRIFT_ATLASES: Readonly<Record<string, string>> = {
  leaves: new URL('../environment/assets/drift-leaves-atlas.webp', import.meta.url).href,
  petals: new URL('../environment/assets/drift-petals-atlas.webp', import.meta.url).href,
  debris: new URL('../environment/assets/drift-debris-atlas.webp', import.meta.url).href,
  fire: new URL('../environment/assets/drift-fire-atlas.webp', import.meta.url).href,
};

/** Frame rectangles and pivots are normalized to the atlas and frame respectively. */
export interface DriftSprite {
  id: string;
  atlas: string;
  frame: readonly [number, number, number, number];
  pivot: readonly [number, number];
  size: number;
  spin: number;
  opacity: number;
  rise: number;
  flutter: number;
}
const families = {
  leaves: [
    'willow',
    'bamboo-pointed',
    'bamboo-curved',
    'oval',
    'heart',
    'maple',
    'ginkgo',
    'curled',
  ],
  petals: ['round', 'notched', 'narrow', 'folded', 'paired', 'winged-seed', 'husk', 'fluff'],
  debris: ['torn', 'skeletal', 'needles', 'bark-strip', 'bark-chip', 'splinter', 'ash', 'charred'],
  fire: [
    'ember',
    'coal',
    'streak',
    'forked',
    'wisp',
    'spectral-flame',
    'spirit-shard',
    'spectral-cinder',
  ],
} as const;
export const DRIFT_SPRITES: readonly DriftSprite[] = Object.entries(families).flatMap(
  ([atlas, names]) =>
    names.map((name, index) => ({
      id: `${atlas}.${name}`,
      atlas: atlas as DriftSprite['atlas'],
      frame: [(index % 4) / 4, Math.floor(index / 4) / 2, 1 / 4, 1 / 2] as const,
      pivot: [0.5, 0.5] as const,
      size: atlas === 'petals' ? 0.85 : 1,
      spin: atlas === 'fire' ? 0.2 : atlas === 'debris' ? 0.7 : 1,
      opacity: name === 'fluff' || name === 'ash' ? 0.65 : 1,
      rise: atlas === 'fire' ? 32 : 0,
      flutter: atlas === 'fire' ? 0.2 : 1,
    })),
);
export const DRIFT_BY_ID = new Map(DRIFT_SPRITES.map((sprite) => [sprite.id, sprite]));
type Mixture = readonly (readonly [string, number])[];
/** Stage order follows STAGES; weights describe cosmetic frequency, never gameplay rolls. */
export const DRIFT_MIXTURES: readonly Mixture[] = [
  [
    ['leaves.willow', 4],
    ['leaves.oval', 3],
    ['petals.winged-seed', 2],
    ['petals.fluff', 1],
    ['leaves.curled', 1],
  ],
  [
    ['leaves.curled', 4],
    ['debris.needles', 3],
    ['debris.bark-strip', 1],
    ['petals.winged-seed', 1],
  ],
  [
    ['petals.round', 4],
    ['petals.notched', 4],
    ['petals.narrow', 2],
    ['petals.folded', 2],
    ['petals.paired', 1],
    ['leaves.oval', 1],
  ],
  [
    ['leaves.oval', 4],
    ['leaves.heart', 4],
    ['debris.torn', 2],
    ['petals.husk', 1],
  ],
  [
    ['leaves.bamboo-pointed', 5],
    ['leaves.bamboo-curved', 5],
    ['debris.splinter', 1],
  ],
  [
    ['debris.needles', 4],
    ['debris.skeletal', 3],
    ['leaves.curled', 2],
    ['debris.bark-chip', 1],
  ],
  [
    ['fire.ember', 4],
    ['fire.coal', 3],
    ['fire.streak', 2],
    ['fire.forked', 1],
    ['fire.wisp', 1],
    ['debris.ash', 2],
    ['debris.charred', 1],
  ],
  [
    ['debris.torn', 3],
    ['leaves.curled', 2],
    ['debris.bark-strip', 3],
    ['debris.bark-chip', 2],
    ['petals.husk', 1],
  ],
  [
    ['leaves.ginkgo', 4],
    ['leaves.maple', 4],
    ['petals.winged-seed', 2],
    ['petals.round', 1],
  ],
  [
    ['fire.spectral-flame', 3],
    ['fire.spirit-shard', 2],
    ['fire.spectral-cinder', 5],
  ],
];
/** Blossom keeps its original abundance; other scenes leave more open space. Index 9 is Demon. */
export const DRIFT_DENSITY = [0.4, 0.3, 1, 0.3, 0.4, 0.15, 0.35, 0.25, 0.25, 0.3] as const;
/** Catalogue preparation remains explicit; runtime scenes need only their mixture's families. */
export function driftAtlasIds(stage?: number): string[] {
  if (stage === undefined) return Object.keys(DRIFT_ATLASES);
  const mixture = DRIFT_MIXTURES[stage] ?? DRIFT_MIXTURES[0]!;
  const selected = new Set(mixture.map(([id]) => DRIFT_BY_ID.get(id)!.atlas));
  return Object.keys(DRIFT_ATLASES).filter((id) => selected.has(id));
}
export function chooseDriftSprite(stage: number, random: Random): DriftSprite {
  const mixture = DRIFT_MIXTURES[stage] ?? DRIFT_MIXTURES[0]!;
  let roll = random() * mixture.reduce((total, entry) => total + entry[1], 0);
  for (const [id, weight] of mixture) {
    roll -= weight;
    if (roll < 0) return DRIFT_BY_ID.get(id)!;
  }
  return DRIFT_BY_ID.get(mixture[mixture.length - 1]![0])!;
}
