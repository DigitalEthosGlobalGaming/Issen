import { createStageVisitSeeds } from '../rendering/environment/stage-variation.ts';
/** Independent live/preview visit ledgers share cosmetic randomness, never combat RNG. */
export function createStageState(random: () => number) {
  const stageVisits = createStageVisitSeeds((random() * 0x100000000) >>> 0);
  const previewVisits = createStageVisitSeeds((random() * 0x100000000) >>> 0);
  return { stageVisits, previewVisits, stageSeed: stageVisits.enter(0) };
}
