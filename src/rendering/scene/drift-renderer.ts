import type { SceneDrawing } from '../scene-drawing.ts';
import { DRIFT_BY_ID } from './drift-catalog.ts';
import type { WeatherParticle } from './weather-state.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { drawInstancedLeaves } from '../scene-leaves.ts';
import type { LeafFrame } from '../scene-leaves.ts';
import type { PixiScenePainter } from '../pixi/scene-painter.ts';
import { createDriftImages } from './drift-images.ts';

/** Incoming families prepare independently while the last submitted leaves remain drawable. */
export function createDriftRenderer(doc: Document = document) {
  const consumers = new Set<SceneDrawing>();
  const inputs = createDriftImages(doc, (sources, preserveFrame) => {
    for (const g of consumers) releaseSources(g, sources, preserveFrame);
  });
  let disposed = false;
  let lastLeaves: LeafFrame['leaves'] | undefined;
  let heldLeaves: LeafFrame['leaves'] | undefined;
  function releaseSources(
    g: SceneDrawing,
    sources: ReturnType<typeof inputs.sources>,
    preserveFrame = false,
  ) {
    if ('releaseTextureSources' in g)
      (g as SceneDrawing & Pick<PixiScenePainter, 'releaseTextureSources'>).releaseTextureSources(
        sources,
        preserveFrame,
      );
  }
  function releaseCanvas(g: SceneDrawing) {
    releaseSources(g, inputs.sources());
    consumers.delete(g);
  }
  function paint(g: SceneDrawing, id: string, size: number, opacity: number) {
    const sprite = DRIFT_BY_ID.get(id)!;
    const image = inputs.image(sprite.atlas);
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
    const material = inputs.material(sprite.atlas, frame);
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
      return inputs.ready;
    },
    prepare(stage?: number) {
      if (disposed) return Promise.resolve(false);
      const pending = inputs.prepare(stage);
      if (!inputs.ready) heldLeaves ??= lastLeaves;
      return pending.then((ready) => {
        if (inputs.ready) heldLeaves = undefined;
        return ready;
      });
    },
    drawLeaves(g: SceneDrawing, frame: Omit<LeafFrame, 'atlases'>) {
      if (disposed || !inputs.atlases.length) return;
      consumers.add(g);
      const leaves = heldLeaves ?? frame.leaves;
      lastLeaves = leaves;
      drawInstancedLeaves(g, { ...frame, leaves, atlases: inputs.atlases });
    },
    drawEmber(g: SceneDrawing, p: WeatherParticle, index: number, scale: number) {
      if (disposed || !inputs.image('fire')) return;
      consumers.add(g);
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
    releaseCanvas,
    snapshot: inputs.snapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      lastLeaves = heldLeaves = undefined;
      for (const g of consumers) releaseCanvas(g);
      inputs.dispose();
    },
  };
}
