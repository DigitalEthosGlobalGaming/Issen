type Sample = (stage: number, quiet: boolean, work: number, budget: number) => void;
const samples = new Set<Sample>();
export function observeAssetBackground(callback: Sample) {
  samples.add(callback);
  return () => {
    samples.delete(callback);
  };
}
export function sampleAssetBackground(stage: number, quiet: boolean, work: number, budget: number) {
  for (const sample of samples) sample(stage, quiet, work, budget);
}
