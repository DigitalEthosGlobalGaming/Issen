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
export function supportsSceneMaterials(target: SceneDrawing): boolean {
  return sinks.has(target);
}

/** Draw an explicitly selected material; the retained Canvas path uses its colour art. */
export function drawMaterialStamp(target: SceneDrawing, stamp: MaterialStamp): void {
  const sink = sinks.get(target);
  if (sink) {
    sink.draw(stamp);
    return;
  }
  const { texture, x, y, width, height } = stamp;
  if (texture.frame) target.drawImage(texture.source, ...texture.frame, x, y, width, height);
  else target.drawImage(texture.source, x, y, width, height);
}
