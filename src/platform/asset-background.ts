type Sample = (stage: number, quiet: boolean, work: number, budget: number) => void;
let sample: Sample | undefined;
export function observeAssetBackground(callback: Sample) {
  sample = callback;
  return () => {
    if (sample === callback) sample = undefined;
  };
}
export function sampleAssetBackground(stage: number, quiet: boolean, work: number, budget: number) {
  sample?.(stage, quiet, work, budget);
}
