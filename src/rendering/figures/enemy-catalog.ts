type Frame = readonly [number, number, number, number];
export const BASE_FRAMES = {
  torso: [63, 92, 343, 334],
  head: [510, 101, 230, 319],
  leftPanel: [865, 63, 365, 395],
  rightPanel: [38, 470, 385, 371],
  leftSleeve: [508, 502, 242, 336],
  rightSleeve: [911, 502, 246, 339],
  leftForearm: [157, 875, 139, 314],
  rightForearm: [550, 875, 139, 320],
  hand: [971, 944, 166, 228],
} as const satisfies Record<string, Frame>;
export const HEAD_FRAMES: Record<string, Frame> = {
  kasa: [8, 137, 557, 290],
  kabuto: [582, 64, 458, 419],
  hair: [1105, 54, 400, 450],
  mask: [63, 600, 382, 331],
  jingasa: [490, 588, 576, 301],
  monk: [1110, 527, 396, 452],
};
// Packed windows measured from alpha; clothing rows divide at y440, not half-height.
export const CLOTHING_FRAMES: readonly Frame[] = [
  [85, 34, 367, 378],
  [562, 22, 400, 413],
  [1117, 42, 286, 377],
  [53, 459, 427, 509],
  [538, 460, 481, 532],
  [1102, 459, 377, 522],
];
export const VARIANT_HEAD_FRAMES: readonly Frame[] = [
  [54, 110, 493, 468],
  [653, 79, 577, 522],
  [82, 660, 494, 504],
  [724, 632, 423, 540],
];
export const ENEMY_SOURCE_STEMS = {
  base: 'enemy-ronin-simple',
  heads: 'enemy-headwear-atlas',
  clothing: 'enemy-clothing-variants',
  variationHeads: 'enemy-headwear-variants',
} as const;
export const ENEMY_FRAMES = {
  base: BASE_FRAMES,
  heads: HEAD_FRAMES,
  clothing: CLOTHING_FRAMES,
  variationHeads: VARIANT_HEAD_FRAMES,
} as const;
const enemyIds = new Map(
  Object.entries(ENEMY_FRAMES).flatMap(([family, frames]) =>
    Object.entries(frames).map(([key, frame]) => [
      `${family}:${frame.join()}`,
      `enemy.${family}.${key}`,
    ]),
  ),
);
export function enemySpriteId(family: keyof typeof ENEMY_FRAMES, frame: readonly number[]) {
  return enemyIds.get(`${family}:${frame.join()}`);
}
