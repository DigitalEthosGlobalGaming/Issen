import type { SceneDrawing } from './scene-drawing.ts';
import { fillScenePath } from './scene-drawing.ts';
import { SEVEN_DAWNS_PATHS } from './crest-art.ts';
import { renderUiMaterialTexture } from '../ui/material-textures.ts';
import type { UiLease } from '../ui/packed-ui.ts';
import { packedSourceRegion } from './packed-source.ts';
import { drawMaterialStamp } from './scene-material.ts';
const ATLAS_URL = 'issen-ui:world-ui-atlas';
export type SealMaterial = 'paper' | 'wood' | 'metal' | 'silk' | 'stone';
const frames = {
  paper: [0, 0],
  wood: [192, 0],
  metal: [384, 0],
  silk: [576, 0],
  stone: [0, 192],
} as const;
const crestIds = ['tomoe', 'kikyo', 'juji', 'aoi', 'fuji', 'tsuru', 'rokumon'];
type UiArt = {
  disposed: boolean;
  lease?: UiLease;
  cache: Map<string, HTMLCanvasElement>;
  ready: Promise<boolean>;
};
const states = new WeakMap<Document, UiArt>();
function state(doc: Document): UiArt {
  let value = states.get(doc);
  if (!value) {
    const owned: UiArt = { disposed: false, cache: new Map(), ready: Promise.resolve(false) };
    owned.ready = import('../ui/packed-ui.ts')
      .then(async ({ packedUi }) => {
        if (owned.disposed) return false;
        const ids = [
          ...Array.from({ length: 5 }, (_, i) => i),
          ...Array.from({ length: 7 }, (_, i) => i + 8),
        ].map((i) => `ui.world-ui-atlas.${i}`);
        const lease = packedUi(doc).acquire(ids);
        owned.lease = lease;
        await lease.ready;
        if (owned.disposed) {
          lease.release();
          return false;
        }
        return true;
      })
      .catch(() => false);
    value = owned;
    states.set(doc, value);
  }
  return value;
}
function sealSprite(doc: Document, material: SealMaterial) {
  return state(doc).lease?.sprite(`ui.world-ui-atlas.${Object.keys(frames).indexOf(material)}`);
}
export function prepareUiArt(doc: Document): Promise<boolean> {
  return state(doc).ready;
}
export function disposeUiArt(doc: Document) {
  const value = states.get(doc);
  if (!value) return;
  value.disposed = true;
  value.lease?.release();
  for (const canvas of value.cache.values()) canvas.width = canvas.height = 0;
  value.cache.clear();
  states.delete(doc);
}
function tinted(doc: Document, material: SealMaterial, color: string) {
  const sprite = sealSprite(doc, material);
  if (!sprite) return null;
  const cache = state(doc).cache;
  const key = material + color;
  if (cache.has(key)) return cache.get(key)!;
  const canvas = doc.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  const [x, y] = frames[material];
  const region = packedSourceRegion(sprite, [x, y, 192, 192]);
  if (!region) return null;
  const paint = () =>
    ctx.drawImage(
      region.texture.source,
      ...region.texture.frame,
      region.x,
      region.y,
      region.width,
      region.height,
    );
  paint();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 192, 192);
  ctx.globalCompositeOperation = 'destination-in';
  paint();
  if (cache.size >= 40) {
    const key = cache.keys().next().value!;
    const old = cache.get(key)!;
    old.width = old.height = 0;
    cache.delete(key);
  }
  cache.set(key, canvas);
  return canvas;
}
/** Fixed corner/edge bands, with a stretched centre; all coordinates are pixels. */
export function drawSeal(
  g: SceneDrawing,
  material: SealMaterial,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const doc = g.canvas.ownerDocument;
  const source = tinted(doc, material, color);
  if (!source) {
    g.fillStyle = color;
    g.fillRect(x, y, w, h);
    return;
  }
  const edge = Math.min(8, w / 4, h / 4);
  const src = [0, 36, 156, 192],
    dx = [x, x + edge, x + w - edge, x + w],
    dy = [y, y + edge, y + h - edge, y + h];
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++) {
      const crop = [
        src[col]!,
        src[row]!,
        src[col + 1]! - src[col]!,
        src[row + 1]! - src[row]!,
      ] as const;
      const [atlasX, atlasY] = frames[material];
      const sprite = sealSprite(doc, material);
      const region =
        sprite &&
        packedSourceRegion(sprite, [atlasX + crop[0], atlasY + crop[1], crop[2], crop[3]]);
      if (!region?.material) continue;
      const scaleX = (dx[col + 1]! - dx[col]!) / crop[2];
      const scaleY = (dy[row + 1]! - dy[row]!) / crop[3];
      drawMaterialStamp(g, {
        texture: {
          source,
          revision: 0,
          frame: [crop[0] + region.x, crop[1] + region.y, region.width, region.height],
        },
        material: region.material,
        x: dx[col]! + region.x * scaleX,
        y: dy[row]! + region.y * scaleY,
        width: region.width * scaleX,
        height: region.height * scaleY,
      });
    }
}
export function drawCrestSprite(g: SceneDrawing, id: string, x: number, y: number, r: number) {
  if (id === 'seven-dawns') {
    g.save();
    g.translate(x - r * 1.28, y - r * 1.28);
    g.scale((r * 2.56) / 100, (r * 2.56) / 100);
    g.globalAlpha *= 0.88;
    g.fillStyle = '#d6cbb4';
    for (const path of SEVEN_DAWNS_PATHS) fillScenePath(g, path);
    g.restore();
    return;
  }
  const doc = g.canvas.ownerDocument;
  const index = crestIds.indexOf(id);
  if (index < 0) return;
  const sprite = state(doc).lease?.sprite(`ui.world-ui-atlas.${index + 8}`);
  if (!sprite) return;
  g.save();
  g.globalAlpha *= 0.88;
  const frame = [(index % 6) * 128, 384 + Math.floor(index / 6) * 128, 128, 128] as const;
  const region = packedSourceRegion(sprite, frame);
  if (region?.material)
    drawMaterialStamp(g, {
      ...region,
      material: region.material,
      x: x - r * 1.28 + (region.x * r * 2.56) / 128,
      y: y - r * 1.28 + (region.y * r * 2.56) / 128,
      width: (region.width * r * 2.56) / 128,
      height: (region.height * r * 2.56) / 128,
    });
  g.restore();
}
export async function setSealTextures(root: HTMLElement, color: string) {
  root.dataset.sealColor = color;
  const doc = root.ownerDocument;
  const value = state(doc);
  await value.ready;
  if (value.disposed || !root.isConnected || root.dataset.sealColor !== color) return;
  for (const material of Object.keys(frames) as SealMaterial[]) {
    const source = tinted(doc, material, color);
    if (source) {
      const [x, y] = frames[material];
      const image = await renderUiMaterialTexture(
        root.ownerDocument,
        `seal:${material}:${color}`,
        ATLAS_URL,
        source,
        [x, y, 192, 192],
      );
      if (value.disposed || !root.isConnected || root.dataset.sealColor !== color) return;
      root.style.setProperty('--seal-' + material, image ?? `url("${source.toDataURL()}")`);
    }
  }
}
