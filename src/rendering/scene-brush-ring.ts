import type { SceneDrawing } from './scene-drawing.ts';

type BrushRingSink = (radius: number, colour: string) => boolean;
const sinks = new WeakMap<SceneDrawing, BrushRingSink>();
const arrows = new WeakMap<SceneDrawing, (radius: number, ghost: boolean) => boolean>();

export function registerGlyphArrowSink(
  target: SceneDrawing,
  sink: (radius: number, ghost: boolean) => boolean,
): void {
  arrows.set(target, sink);
}
export function drawCachedGlyphArrow(target: SceneDrawing, radius: number, ghost = false): boolean {
  return arrows.get(target)?.(radius, ghost) ?? false;
}

export function registerBrushRingSink(target: SceneDrawing, sink: BrushRingSink): void {
  sinks.set(target, sink);
}

/** Optional retained geometry for the immutable outer direction-marker ring.
 * Keep overlapping translucent strokes separate so figure opacity still blends
 * each mark, just as it does in Canvas.
 */
export function drawCachedBrushRing(target: SceneDrawing, radius: number, colour: string): boolean {
  const sink = sinks.get(target);
  if (!sink) return false;
  return sink(radius, colour);
}
