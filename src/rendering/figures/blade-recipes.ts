export type BladeRecipe = {
  profile: number;
  hilt: number;
  guard: number;
  tint?: string;
  hiltTint?: string;
  special?: 'beam' | 'pan';
};
const r = (
  profile: number,
  hilt: number,
  guard: number,
  tint?: string,
  hiltTint?: string,
): BladeRecipe => ({ profile, hilt, guard, tint, hiltTint });
/** Primary catalog only. Runtime style still owns length, alpha, glow and awakenings. */
export const BLADE_RECIPES: Readonly<Record<string, BladeRecipe>> = {
  steel: r(0, 0, 0),
  kuro: r(0, 0, 2, '#35383d'),
  beni: r(0, 1, 0, '#b28f88'),
  tsuki: r(1, 2, 0, '#c9d6de'),
  oboro: r(1, 2, 2, '#b3b9be'),
  mura: r(4, 1, 2, '#985951'),
  raijin: r(1, 0, 2, '#93a8c2', '#636a9b'),
  sakura: r(0, 1, 1, '#c6a2a4', '#a37480'),
  kage: r(0, 0, 2, '#58596d'),
  bokken: r(5, 0, 0, undefined, '#755038'),
  kodachi: r(2, 0, 2),
  doji: r(4, 1, 1, '#a99472'),
  kiku: r(0, 2, 1, '#b6ada0'),
  yuki: r(1, 2, 2, '#b3d2de'),
  masamune: r(0, 2, 0, '#b1c0bd'),
  orochi: r(3, 0, 2, '#6c8e76', '#486655'),
  onikiri: r(4, 1, 0, '#a47768'),
  tsubame: r(1, 2, 2, '#99acc6'),
  koken: { ...r(0, 0, 0), special: 'beam' },
  pan: { ...r(0, 0, 0), special: 'pan' },
};
export const BLADE_PROFILE_FRAMES = [
  { frame: [152, 111, 955, 92], root: [154, 154], tip: [1104, 113] },
  { frame: [50, 300, 1179, 88], root: [52, 352], tip: [1226, 302] },
  { frame: [159, 486, 947, 116], root: [161, 537], tip: [1103, 488] },
  { frame: [110, 696, 1045, 95], root: [112, 733], tip: [1152, 698] },
  { frame: [94, 892, 1091, 89], root: [96, 937], tip: [1182, 894] },
  { frame: [107, 1080, 1043, 78], root: [109, 1113], tip: [1147, 1098] },
] as const;
export const HILT_FRAMES = [
  [53, 145, 758, 226],
  [53, 551, 758, 221],
  [53, 915, 758, 224],
] as const;
export const GUARD_PARTS = [
  { frame: [949, 47, 186, 406], pivot: [1020, 260] },
  { frame: [912, 471, 283, 378], pivot: [1038, 665] },
  { frame: [914, 869, 270, 314], pivot: [1051, 1028] },
] as const;
export const SPECIAL_FRAMES = { beam: [329, 96, 1102, 195], pan: [95, 336, 1589, 498] } as const;
export const WEAPON_FRAMES = {
  blades: BLADE_PROFILE_FRAMES.map((profile) => profile.frame),
  hilts: [...HILT_FRAMES, ...GUARD_PARTS.map((guard) => guard.frame)],
  special: SPECIAL_FRAMES,
} as const;
const weaponIds = new Map(
  Object.entries(WEAPON_FRAMES).flatMap(([family, frames]) =>
    Object.entries(frames).map(([key, frame]) => [
      `${family}:${frame.join()}`,
      `weapon.${family}.${key}`,
    ]),
  ),
);
export function weaponSpriteId(family: keyof typeof WEAPON_FRAMES, frame: readonly number[]) {
  return weaponIds.get(`${family}:${frame.join()}`);
}
export function supportsInkBlade(id?: string): boolean {
  return !!id && Object.hasOwn(BLADE_RECIPES, id);
}

/** Source-pixel centerlines sampled from the visible steel/wood, including the serpent bends.
 * The same root-to-tip similarity transform as ink-sword.ts keeps every effect on its artwork.
 */
const PROFILE_CENTERLINES = [
  [154, 166, 176, 180, 176, 163, 142, 113],
  [352, 360, 368, 370, 365, 350, 334, 302],
  [537, 548, 558, 563, 560, 550, 528, 488],
  [733, 739, 727, 738, 760, 760, 747, 698],
  [937, 937, 937, 937, 936, 934, 929, 894],
  [1113, 1119, 1123, 1123, 1120, 1118, 1114, 1098],
] as const;
export function bladeEffectPoint(
  id: string,
  length: number,
  fraction: number,
): readonly [number, number] {
  const t = Math.max(0, Math.min(1, fraction));
  const recipe = BLADE_RECIPES[id] ?? BLADE_RECIPES.steel!;
  if (recipe.special) return [0.016 + (length - 0.016) * t, 0];
  const profile = BLADE_PROFILE_FRAMES[recipe.profile]!;
  const samples = PROFILE_CENTERLINES[recipe.profile]!;
  const section = Math.min(samples.length - 2, Math.floor(t * (samples.length - 1)));
  const mix = t * (samples.length - 1) - section;
  const dx = profile.tip[0] - profile.root[0],
    dy = profile.tip[1] - profile.root[1];
  const x = dx * t,
    y = samples[section]! + (samples[section + 1]! - samples[section]!) * mix - profile.root[1];
  const tx = length - 0.016,
    ty = -length * 0.05;
  const denominator = dx * dx + dy * dy;
  const a = (tx * dx + ty * dy) / denominator,
    b = (ty * dx - tx * dy) / denominator;
  return [0.016 + a * x - b * y, b * x + a * y];
}
