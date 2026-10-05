import type { Leaf } from './ambient.ts';
import { DRIFT_BY_ID } from './drift-catalog.ts';
import type { SceneSprite } from '../scene-frame.ts';
import type { WeatherParticle } from './weather-state.ts';

export interface DriftImage {
  source: HTMLImageElement | HTMLCanvasElement;
  width: number;
  height: number;
}

/** Catalog and pose adapter only. Spawning/motion remain owned by ambient/weather. */
function stamp(
  image: DriftImage,
  id: string,
  size: number,
  opacity: number,
  x: number,
  y: number,
  angle: number,
  flatten = 1,
): SceneSprite | null {
  const sprite = DRIFT_BY_ID.get(id);
  if (!sprite || image.width <= 0 || image.height <= 0) return null;
  const [u, v, w, h] = sprite.frame;
  const sx = Math.round(u * image.width),
    sy = Math.round(v * image.height);
  const sw = Math.round((u + w) * image.width) - sx;
  const sh = Math.round((v + h) * image.height) - sy;
  const width = size * sprite.size,
    height = (width * sh) / sw;
  const a = Math.cos(angle),
    b = Math.sin(angle),
    c = -b * flatten,
    d = a * flatten;
  const px = width * sprite.pivot[0],
    py = height * sprite.pivot[1];
  return {
    kind: 'sprite',
    texture: { source: image.source, revision: 0, frame: [sx, sy, sw, sh] },
    transform: { a, b, c, d, tx: x - a * px - c * py, ty: y - b * px - d * py },
    width,
    height,
    alpha: opacity * sprite.opacity,
    tint: 0xffffff,
    blend: 'normal',
  };
}

export function leafSprite(
  leaf: Readonly<Leaf>,
  images: ReadonlyMap<string, DriftImage>,
  spriteMotion: boolean,
): SceneSprite | null {
  const id = leaf.sprite ?? 'leaves.willow';
  const descriptor = DRIFT_BY_ID.get(id);
  const image = descriptor && images.get(descriptor.atlas);
  if (!image) return null;
  const flutter = spriteMotion ? (leaf.flutter ?? 1) : 1;
  return stamp(
    image,
    id,
    leaf.s * 3,
    leaf.z > 1.25 ? 0.6 : 0.9,
    leaf.x,
    leaf.y,
    leaf.rot,
    1 - flutter + flutter * Math.cos(leaf.fl),
  );
}

export function emberSprite(
  particle: Readonly<WeatherParticle>,
  index: number,
  scale: number,
  images: ReadonlyMap<string, DriftImage>,
): SceneSprite | null {
  const image = images.get('fire');
  if (!image) return null;
  const id = index % 3 === 0 ? 'fire.coal' : index % 3 === 1 ? 'fire.ember' : 'fire.streak';
  return stamp(image, id, (3 + particle.z * 4) * scale, 0.75, particle.x, particle.y, particle.ph);
}
