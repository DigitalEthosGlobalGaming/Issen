import type { SceneDrawing } from '../scene-drawing.ts';
import {
  drawCachedImage,
  clearCachedMaterial,
  cachedMaterialContext,
} from '../cached-materials.ts';
import { drawAtlasSprite } from './scene-kit.ts';
import { STAGES } from '../../game/content/stages.ts';
import type { EnvironmentFrame } from './index.ts';

/** Reuses the accepted bamboo atlas; these planes belong in front of figures, before film/HUD. */
export function createBambooForegroundRenderer(doc: Document) {
  let layers: HTMLCanvasElement[] = [];
  let key = '';
  let source: HTMLImageElement | undefined;
  let disposed = false;
  function release() {
    for (const layer of layers) {
      clearCachedMaterial(layer);
      layer.width = layer.height = 0;
    }
    layers = [];
    key = '';
    source = undefined;
  }
  function prepare(atlas: HTMLImageElement, frame: EnvironmentFrame): boolean {
    const { width, height } = frame;
    if (
      disposed ||
      frame.stage !== 4 ||
      !atlas?.naturalWidth ||
      !atlas.naturalHeight ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    )
      return false;
    // Narrower tablet planes leave all central encounter silhouettes unobstructed.
    const edge = width * (height >= width * 0.9 ? 0.2 : 0.24);
    const density = Math.min(
      frame.lowQuality ? 1 : 1.5,
      Math.sqrt(2_000_000 / (2 * edge * height)),
    );
    const next = `${width}:${height}:${density}`;
    if (key !== next || source !== atlas) {
      release();
      for (let side = 0; side < 2; side++) {
        const canvas = doc.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(edge * density));
        canvas.height = Math.max(1, Math.floor(height * density));
        const nativeContext = canvas.getContext('2d');
        if (!nativeContext) {
          canvas.width = canvas.height = 0;
          release();
          return false;
        }
        const g = cachedMaterialContext(nativeContext);
        layers.push(canvas);
        g.scale(canvas.width / edge, canvas.height / height);
        // Draw one whole clump per side. Its root is below the viewport; no ground plate.
        const cell = side ? 3 : 0;
        const sw = atlas.naturalWidth / 2,
          sh = atlas.naturalHeight / 2;
        const tall = height * 1.18;
        const wide = (tall * sw) / sh;
        g.save();
        if (side) {
          g.translate(edge, 0);
          g.scale(-1, 1);
        }
        drawAtlasSprite(g, atlas, cell, edge * 0.22, height * 1.13, wide, {
          anchorX: side ? 0.35 : 0.5,
          anchorY: 1,
          alpha: 0.95,
          hazeColor: `rgb(${STAGES[4]!.fog.join(',')})`,
        });
        g.restore();
        // Alpha mask only affects this private plane, never the already drawn player.
        g.globalCompositeOperation = 'destination-in';
        const fade = g.createLinearGradient(side ? edge : 0, 0, side ? 0 : edge, 0);
        fade.addColorStop(0, '#fff');
        fade.addColorStop(0.94, '#fff');
        fade.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = fade;
        g.fillRect(0, 0, edge, height);
      }
      key = next;
      source = atlas;
    }
    return true;
  }
  function draw(ctx: SceneDrawing, atlas: HTMLImageElement, frame: EnvironmentFrame): boolean {
    if (!prepare(atlas, frame)) return false;
    const { width, height } = frame;
    const edge = width * (height >= width * 0.9 ? 0.2 : 0.24);
    const time = frame.reducedMotion || frame.reducedFlashes ? 0 : frame.time;
    ctx.save();
    // Tiny outer-edge breathing; no RNG, gameplay clock or weather state changes.
    for (let side = 0; side < 2; side++) {
      const outward = Math.sin(time * 0.48 + side * 1.4) * Math.min(width * 0.002, 2);
      const layer = layers[side]!;
      drawCachedImage(
        ctx,
        layer,
        [0, 0, layer.width, layer.height],
        side ? width - edge + outward : -outward,
        0,
        edge,
        height,
      );
    }
    ctx.restore();
    return true;
  }
  return {
    draw,
    prepare,
    release,
    get layers() {
      return layers;
    },
    snapshot: () => ({
      layers: layers.length,
      pixels: layers.reduce((n, c) => n + c.width * c.height, 0),
    }),
    dispose() {
      disposed = true;
      release();
    },
  };
}
