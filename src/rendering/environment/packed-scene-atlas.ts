import type { PackedSprite } from '../packed-assets.ts';
import type { SceneMaterial } from '../scene-frame.ts';
import type { SceneDrawing } from '../scene-drawing.ts';

export type SourceFrame = readonly [number, number, number, number];
export type PackedScenerySprite = {
  metadata: PackedSprite;
  colour: HTMLImageElement | ImageBitmap;
  material: SceneMaterial | null;
};
export interface PackedSceneryAtlas {
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  readonly complete: boolean;
  resolve(frame: SourceFrame): PackedScenerySprite;
  draw(
    ctx: SceneDrawing,
    sprite: PackedScenerySprite,
    frame: SourceFrame,
    x: number,
    y: number,
    width: number,
    height: number,
    colour?: HTMLCanvasElement,
  ): void;
}
export type SceneryAtlas = HTMLImageElement | PackedSceneryAtlas;
