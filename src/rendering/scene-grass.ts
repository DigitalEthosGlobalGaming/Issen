import type { SceneDrawing } from './scene-drawing.ts';
import type { GrassBlade } from './scene/ambient.ts';
export interface GrassFrame {
  readonly blades: readonly GrassBlade[];
  readonly time: number;
  readonly wind: number;
  readonly depth: number;
  readonly density: number;
}
const sinks = new WeakMap<SceneDrawing, (frame: GrassFrame) => void>();
export function registerGrassSink(target: SceneDrawing, sink: (frame: GrassFrame) => void): void {
  sinks.set(target, sink);
}
export function drawInstancedGrass(target: SceneDrawing, frame: GrassFrame): void {
  const sink = sinks.get(target);
  if (!sink) throw new Error('Grass drawing requires a WebGL2 scene painter');
  sink(frame);
}
