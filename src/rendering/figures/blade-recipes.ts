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
export function supportsInkBlade(id?: string): boolean {
  return !!id && Object.hasOwn(BLADE_RECIPES, id);
}
