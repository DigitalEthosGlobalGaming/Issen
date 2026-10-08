const revisions = new WeakMap<HTMLCanvasElement, number>();
const retirements = new WeakMap<object, Set<() => void>>();

/** GPU consumers release their own textures before an owner closes source pixels. */
export function observeSceneTextureRetirement(source: object, release: () => void): () => void {
  let observers = retirements.get(source);
  if (!observers) retirements.set(source, (observers = new Set()));
  observers.add(release);
  return () => {
    observers.delete(release);
    if (!observers.size && retirements.get(source) === observers) retirements.delete(source);
  };
}

/** Final source disposal is immediate; temporary disuse still uses the renderer's grace period. */
export function retireSceneTexture(source: object): void {
  const observers = retirements.get(source);
  if (!observers) return;
  retirements.delete(source);
  for (const release of [...observers]) release();
}

/** Call after rebuilding a reusable prepared bitmap; GPU uploads then happen once. */
export function invalidateSceneTexture(canvas: HTMLCanvasElement): void {
  revisions.set(canvas, (revisions.get(canvas) ?? 0) + 1);
}
export function sceneTextureRevision(source: HTMLCanvasElement | HTMLImageElement): number {
  return source instanceof HTMLCanvasElement ? (revisions.get(source) ?? 0) : 0;
}
