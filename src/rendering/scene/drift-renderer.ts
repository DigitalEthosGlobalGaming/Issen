import type { SceneDrawing } from '../scene-drawing.ts';
import type { Leaf } from './ambient.ts';
import { DRIFT_ATLASES as urls, DRIFT_BY_ID } from './drift-catalog.ts';
import type { WeatherParticle } from './weather-state.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';

/** One retained path and decoded atlas images per runtime; no per-frame image processing. */
export function createDriftRenderer(doc: Document = document) {
  const materials = createAssetMaterials(doc, urls);
  const images = new Map<string, HTMLImageElement>();
  let disposed = false;
  let pending: Promise<void> | undefined;
  function paint(g: SceneDrawing, id: string, size: number, opacity: number) {
    const sprite = DRIFT_BY_ID.get(id)!;
    const image = images.get(sprite.atlas);
    if (!image) return;
    const [x, y, w, h] = sprite.frame;
    const sx = Math.round(x * image.naturalWidth),
      sy = Math.round(y * image.naturalHeight);
    const sw = Math.round((x + w) * image.naturalWidth) - sx;
    const sh = Math.round((y + h) * image.naturalHeight) - sy;
    const width = size * sprite.size,
      height = (width * sh) / sw;
    g.globalAlpha *= opacity * sprite.opacity;
    const frame = [sx, sy, sw, sh] as const;
    const material = materials.material(sprite.atlas, frame);
    const dx = -width * sprite.pivot[0],
      dy = -height * sprite.pivot[1];
    if (material)
      drawMaterialStamp(g, {
        texture: { source: image, revision: 0, frame },
        material,
        x: dx,
        y: dy,
        width,
        height,
      });
    else g.drawImage(image, ...frame, dx, dy, width, height);
  }
  return {
    get ready() {
      return images.size === Object.keys(urls).length && Object.keys(urls).every(materials.ready);
    },
    prepare() {
      return (pending ??= Promise.all(
        Object.entries(urls).map(async ([id, url]) => {
          const image = doc.createElement('img');
          image.src = url;
          try {
            await image.decode();
            if (!disposed && image.naturalWidth > 0) images.set(id, image);
          } catch {
            /* Runtime startup reports missing artwork and offers retry. */
          }
        }),
      ).then(async () => {
        await materials.prepare();
      }));
    },
    draw(g: SceneDrawing, leaf: Leaf) {
      paint(g, leaf.sprite ?? 'leaves.willow', leaf.s * 3, leaf.z > 1.25 ? 0.6 : 0.9);
    },
    drawEmber(g: SceneDrawing, p: WeatherParticle, index: number, scale: number) {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.ph);
      paint(
        g,
        index % 3 === 0 ? 'fire.coal' : index % 3 === 1 ? 'fire.ember' : 'fire.streak',
        (3 + p.z * 4) * scale,
        0.75,
      );
      g.restore();
    },
    dispose() {
      disposed = true;
      materials.dispose();
      for (const image of images.values()) image.removeAttribute('src');
      images.clear();
    },
  };
}
