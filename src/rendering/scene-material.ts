import type { SceneDrawing } from './scene-drawing.ts';
import type { SceneLighting, SceneMaterial, SceneTexture } from './scene-frame.ts';

export interface MaterialStamp {
  texture: SceneTexture;
  material: SceneMaterial;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MaterialSink {
  draw(stamp: MaterialStamp): void;
  lights(lighting: SceneLighting): void;
}
const sinks = new WeakMap<SceneDrawing, MaterialSink>();
export function registerMaterialSink(target: SceneDrawing, sink: MaterialSink): void {
  sinks.set(target, sink);
}
export function setSceneLighting(target: SceneDrawing, lighting: SceneLighting): void {
  sinks.get(target)?.lights(lighting);
}
/** Live material stamps require a registered native scene painter. */
export function drawMaterialStamp(target: SceneDrawing, stamp: MaterialStamp): void {
  const sink = sinks.get(target);
  if (!sink) throw new Error('Material drawing requires a WebGL2 scene painter');
  sink.draw(stamp);
}
