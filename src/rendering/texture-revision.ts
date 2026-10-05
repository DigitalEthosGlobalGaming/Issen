const revisions = new WeakMap<HTMLCanvasElement, number>();

/** Call after rebuilding a reusable prepared bitmap; GPU uploads then happen once. */
export function invalidateSceneTexture(canvas: HTMLCanvasElement): void {
  revisions.set(canvas, (revisions.get(canvas) ?? 0) + 1);
}
export function sceneTextureRevision(source: HTMLCanvasElement | HTMLImageElement): number {
  return source instanceof HTMLCanvasElement ? (revisions.get(source) ?? 0) : 0;
}
