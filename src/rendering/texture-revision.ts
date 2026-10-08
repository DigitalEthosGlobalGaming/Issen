const revisions = new WeakMap<HTMLCanvasElement, number>();
const retirements = new WeakMap<object, Set<(preserveFrame: boolean) => void>>();

/** Notify GPU consumers before an owner closes pixels; cache eviction can preserve frame replay. */
export function observeSceneTextureRetirement(
  source: object,
  release: (preserveFrame: boolean) => void,
): () => void {
  let observers = retirements.get(source);
  if (!observers) retirements.set(source, (observers = new Set()));
  observers.add(release);
  return () => {
    observers.delete(release);
    if (!observers.size && retirements.get(source) === observers) retirements.delete(source);
  };
}

/** Cache eviction may preserve a queued frame; final disposal remains immediate. */
export function retireSceneTexture(source: object, preserveFrame = false): void {
  const observers = retirements.get(source);
  if (!observers) return;
  retirements.delete(source);
  for (const release of [...observers]) release(preserveFrame);
}

/** Call after rebuilding a reusable prepared bitmap; GPU uploads then happen once. */
export function invalidateSceneTexture(canvas: HTMLCanvasElement): void {
  revisions.set(canvas, (revisions.get(canvas) ?? 0) + 1);
}
export function sceneTextureRevision(source: HTMLCanvasElement | HTMLImageElement): number {
  return source instanceof HTMLCanvasElement ? (revisions.get(source) ?? 0) : 0;
}
