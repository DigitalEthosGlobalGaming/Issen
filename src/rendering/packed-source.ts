import { packedMaterialFrame, type PackedSprite } from './packed-assets.ts';
import type { SceneMaterial } from './scene-frame.ts';

type Frame = readonly [number, number, number, number];
type Sprite = {
  metadata: PackedSprite;
  colour: HTMLImageElement | ImageBitmap;
  material: SceneMaterial | null;
};
/** Intersect a logical source window with stored pixels, retaining crop offsets.
 * Consumers can stretch each region or compose a logical image without restoring maps.
 */
export function packedSourceRegion(sprite: Sprite, requested: Frame) {
  const source = sprite.metadata.sourceFrame;
  if (!source) throw Error('Packed source window metadata missing');
  if (sprite.metadata.empty) return null;
  const [px, py, pw, ph] = sprite.metadata.frame;
  const left = source[0] + sprite.metadata.trim[0],
    top = source[1] + sprite.metadata.trim[1];
  const x = Math.max(left, requested[0]),
    y = Math.max(top, requested[1]);
  const right = Math.min(left + pw, requested[0] + requested[2]);
  const bottom = Math.min(top + ph, requested[1] + requested[3]);
  if (right <= x || bottom <= y) return null;
  const frame = [px + x - left, py + y - top, right - x, bottom - y] as const;
  return {
    texture: { source: sprite.colour, revision: 0, frame },
    material: packedMaterialFrame(sprite.material, frame),
    x: x - requested[0],
    y: y - requested[1],
    width: frame[2],
    height: frame[3],
  };
}
