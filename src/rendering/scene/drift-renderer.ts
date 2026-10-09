import type { SceneDrawing } from '../scene-drawing.ts';
import type { WeatherParticle } from './weather-state.ts';
import { createLeafMotion } from './leaf-motion.ts';
import { drawInstancedLeaves } from '../scene-leaves.ts';
import type { LeafFrame } from '../scene-leaves.ts';
import type { PixiScenePainter } from '../pixi/scene-painter.ts';
import { createDriftImages } from './drift-images.ts';
import type { TextureUpload } from '../texture-upload.ts';
import type { SceneTexture } from '../scene-frame.ts';

/** Incoming families prepare independently while the last submitted leaves remain drawable. */
export function createDriftRenderer(doc: Document = document, painter?: () => PixiScenePainter) {
  const consumers = new Set<SceneDrawing>();
  const inputs = createDriftImages(
    doc,
    (sources, preserveFrame) => {
      for (const g of consumers) releaseSources(g, sources, preserveFrame);
    },
    painter
      ? async (atlases, signal) => {
          const g = painter();
          const uploads: TextureUpload[] = atlases.flatMap((atlas) => [
            { texture: atlas.texture },
            ...(atlas.material.emissive ? [{ texture: atlas.material.emissive }] : []),
          ]);
          consumers.add(g);
          const release = g.retainTextureSources(uploads.map((upload) => upload.texture.source));
          try {
            if (await g.warmScene(uploads, signal)) return release;
            release();
            return false;
          } catch {
            release();
            return false;
          }
        }
      : undefined,
  );
  let disposed = false;
  let lastLeaves: LeafFrame['leaves'] | undefined;
  let heldLeaves: LeafFrame['leaves'] | undefined;
  function releaseSources(
    g: SceneDrawing,
    sources: SceneTexture['source'][],
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
  const emberMotion = createLeafMotion();
  const emberLeaves = [
    {
      x: 0,
      y: 0,
      z: 1,
      s: 1,
      rot: 0,
      vr: 0,
      fl: 0,
      vf: 0,
      vy: 0,
      ph: 0,
      col: '#fff',
      sprite: 'fire.ember',
      flutter: 0,
    },
  ];
  emberMotion.register(emberLeaves[0]!);
  function paint(g: SceneDrawing, id: string, size: number, opacity: number) {
    emberLeaves[0]!.sprite = id;
    emberLeaves[0]!.s = size / 3;
    emberMotion.invalidate();
    g.globalAlpha *= opacity / 0.9;
    drawInstancedLeaves(g, {
      leaves: emberLeaves,
      front: false,
      motion: emberMotion,
      spriteMotion: true,
      scale: 1,
      width: 1,
      height: 1,
      atlases: inputs.atlases,
    });
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
