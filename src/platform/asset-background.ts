import type { CompositionIdentity } from '../rendering/environment/worker-types.ts';
type Sample = (
  stage: number,
  quiet: boolean,
  work: number,
  budget: number,
  nextStage?: number,
  nextScene?: Readonly<CompositionIdentity>,
) => void;
const samples = new Set<Sample>();
export function observeAssetBackground(callback: Sample) {
  samples.add(callback);
  return () => {
    samples.delete(callback);
  };
}
export function sampleAssetBackground(
  stage: number,
  quiet: boolean,
  work: number,
  budget: number,
  nextStage?: number,
  nextScene?: Readonly<CompositionIdentity>,
) {
  for (const sample of samples) sample(stage, quiet, work, budget, nextStage, nextScene);
}
