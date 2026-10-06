type AtlasKey = 'armour' | 'headwear' | 'cloth' | 'masks' | 'special';
type Frame = readonly [number, number, number, number];
export const OUTFIT_SOURCE_STEMS = {
  masks: 'player-mask-atlas',
  special: 'player-special-headwear-atlas',
  armour: 'armour-plates-atlas',
  headwear: 'outfit-headwear-atlas',
  cloth: 'outfit-cloth-atlas',
} as const;
export const OUTFIT_FRAMES: Record<AtlasKey, readonly Frame[]> = {
  masks: [
    [150, 40, 436, 535],
    [692, 79, 525, 497],
    [144, 589, 458, 555],
    [733, 654, 381, 497],
  ],
  special: [
    [147, 92, 357, 501],
    [703, 85, 494, 507],
    [101, 702, 458, 411],
    [690, 783, 526, 369],
  ],
  armour: [
    [77, 72, 588, 538],
    [847, 114, 349, 476],
    [62, 693, 380, 484],
    [620, 729, 584, 412],
  ],
  headwear: [
    [85, 126, 488, 450],
    [630, 204, 605, 322],
    [141, 653, 399, 522],
    [747, 872, 399, 220],
  ],
  cloth: [
    [146, 53, 408, 551],
    [718, 53, 394, 552],
    [64, 663, 746, 532],
    [927, 692, 208, 481],
  ],
};
