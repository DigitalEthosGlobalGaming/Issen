import type { SceneDrawing } from './scene-drawing.ts';
import type { Leaf } from './scene/ambient.ts';
import type { LeafMotion } from './scene/leaf-motion.ts';
import type { SceneTexture, SceneMaterial } from './scene-frame.ts';
export interface LeafAtlas {
  readonly id: string;
  readonly texture: SceneTexture;
  readonly material: SceneMaterial;
  readonly width: number;
  readonly height: number;
}
export interface LeafFrame {
  readonly leaves: readonly Leaf[];
  readonly front: boolean;
  readonly motion: LeafMotion;
  readonly spriteMotion: boolean;
  readonly scale: number;
  readonly width: number;
  readonly height: number;
  readonly atlases: readonly LeafAtlas[];
}
const sinks = new WeakMap<SceneDrawing, (frame: LeafFrame) => void>();
export function registerLeafSink(target: SceneDrawing, sink: (frame: LeafFrame) => void): void {
  sinks.set(target, sink);
}
export function drawInstancedLeaves(target: SceneDrawing, frame: LeafFrame): void {
  const sink = sinks.get(target);
  if (!sink) throw new Error('Leaf drawing requires a WebGL2 scene painter');
  sink(frame);
}
