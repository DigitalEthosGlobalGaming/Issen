type Frame = readonly [number, number, number, number];
/** Tight source frames in original 1254² atlas; see adjacent provenance metadata. */
export const PLAYER_FRAMES = {
  torso: [45, 54, 382, 358],
  head: [523, 110, 229, 282],
  leftPanel: [864, 45, 366, 392],
  rightPanel: [37, 452, 380, 369],
  leftSleeve: [503, 464, 233, 368],
  rightSleeve: [924, 465, 257, 368],
  leftForearm: [134, 861, 165, 344],
  rightForearm: [554, 861, 155, 344],
  hand: [959, 926, 165, 236],
} as const satisfies Record<string, Frame>;
