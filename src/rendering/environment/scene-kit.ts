import type { SceneDrawing } from '../scene-drawing.ts';
import { drawCachedImage } from '../cached-materials.ts';
import type { PackedSceneryAtlas, SceneryAtlas } from './packed-scene-atlas.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
/** Shared cached-composition helper. Source atlases remain untouched. */
export interface SpritePlacement {
  frame?: { x: number; y: number; width: number; height: number };
  /** Packed storage uses a cropped frame while placement stays in logical coordinates. */
  logicalSize?: readonly [number, number];
  trim?: readonly [number, number];
  draw?: typeof drawCachedImage;
  /** Retained detail (1 = close/crisp); opacity only for translucent material. */
  alpha?: number;
  anchorX?: number;
  anchorY?: number;
  angle?: number;
  flip?: boolean;
  columns?: number;
  rows?: number;
  fadeFrom?: number;
  fadeTo?: number;
  /** Haze changes colour, never the opacity of solid scenery. */
  hazeColor?: string;
  /** Only fog, foam and other genuinely translucent material uses alpha. */
  translucent?: boolean;
}

const atmosphere = new WeakMap<SceneDrawing, { color: string; strength: number }>();
type SceneryImage = HTMLImageElement | ImageBitmap;
const cutouts = new WeakMap<SceneryImage, Map<string, HTMLCanvasElement>>();
const retained = new Map<
  HTMLCanvasElement,
  { cache: Map<string, HTMLCanvasElement>; key: string }
>();
let retainedPixels = 0;
function releaseCutout(canvas: HTMLCanvasElement) {
  const entry = retained.get(canvas);
  if (!entry) return;
  entry.cache.delete(entry.key);
  retained.delete(canvas);
  retainedPixels -= canvas.width * canvas.height;
  canvas.width = canvas.height = 0;
}
export function releaseSceneryCutouts(images: Iterable<SceneryImage>) {
  for (const image of images) {
    const cache = cutouts.get(image);
    if (cache) for (const canvas of cache.values()) releaseCutout(canvas);
    cutouts.delete(image);
  }
}
export function setSceneryAtmosphere(ctx: SceneDrawing, color: string, strength = 1) {
  atmosphere.set(ctx, { color, strength });
}

/** Source rectangles retain their authored meaning while pages supply cropped texels. */
export function drawSceneryImage(
  ctx: SceneDrawing,
  source: SceneryAtlas,
  frame: readonly [number, number, number, number],
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (!('resolve' in source)) return drawCachedImage(ctx, source, frame, x, y, width, height);
  const sprite = source.resolve(frame);
  if (sprite.metadata.empty) return;
  const placed = packedSpritePlacement(sprite.metadata, x, y, width, height);
  source.draw(ctx, sprite, sprite.metadata.frame, placed.x, placed.y, placed.width, placed.height);
}

export function drawAtlasSprite(
  ctx: SceneDrawing,
  image: SceneryImage | PackedSceneryAtlas,
  cell: number,
  x: number,
  foot: number,
  width: number,
  placement: SpritePlacement = {},
) {
  const columns = placement.columns ?? 2,
    rows = placement.rows ?? 2;
  const sourceWidth = 'naturalWidth' in image ? image.naturalWidth : image.width,
    sourceHeight = 'naturalHeight' in image ? image.naturalHeight : image.height;
  const sw = placement.frame?.width ?? sourceWidth / columns,
    sh = placement.frame?.height ?? sourceHeight / rows;
  if (!sw || !sh) return;
  const sx = placement.frame?.x ?? (cell % columns) * sw,
    sy = placement.frame?.y ?? Math.floor(cell / columns) * sh;
  if ('resolve' in image) {
    const sprite = image.resolve([sx, sy, sw, sh]);
    if (sprite.metadata.empty) return;
    const [x0, y0, w0, h0] = sprite.metadata.frame;
    drawAtlasSprite(ctx, sprite.colour, 0, x, foot, width, {
      ...placement,
      frame: { x: x0, y: y0, width: w0, height: h0 },
      logicalSize: sprite.metadata.logicalSize,
      trim: sprite.metadata.trim,
      draw: (g, _source, frame, dx, dy, dw, dh, colour) =>
        image.draw(g, sprite, frame, dx, dy, dw, dh, colour),
    });
    return;
  }
  const logicalWidth = placement.logicalSize?.[0] ?? sw,
    logicalHeight = placement.logicalSize?.[1] ?? sh;
  const height = (width * logicalHeight) / logicalWidth;
  const [trimX, trimY] = placement.trim ?? [0, 0];
  // Preserve the full logical frame's ceil-to-canvas sampling grid after trimming.
  const rasterScaleX = Math.ceil(logicalWidth) / logicalWidth,
    rasterScaleY = Math.ceil(logicalHeight) / logicalHeight;
  const rasterX = Math.floor(trimX * rasterScaleX),
    rasterY = Math.floor(trimY * rasterScaleY);
  const rasterWidth = Math.ceil((trimX + sw) * rasterScaleX) - rasterX,
    rasterHeight = Math.ceil((trimY + sh) * rasterScaleY) - rasterY;
  const ax = placement.anchorX ?? 0.5,
    ay = placement.anchorY ?? 0.94;
  let cutout: HTMLCanvasElement | null = null;
  const detail = Math.max(0, Math.min(1, placement.alpha ?? 1));
  const depth = atmosphere.get(ctx);
  const haze = placement.translucent ? 0 : (1 - detail) * 0.88 * (depth?.strength ?? 1);
  const color = placement.hazeColor ?? depth?.color ?? '#878178';
  if (placement.fadeFrom !== undefined || haze > 0) {
    let cache = cutouts.get(image);
    if (!cache) {
      cache = new Map();
      cutouts.set(image, cache);
    }
    const key = [
      sx,
      sy,
      sw,
      sh,
      color,
      haze,
      placement.fadeFrom,
      placement.fadeTo,
      ay,
      placement.translucent,
      logicalHeight,
      logicalWidth,
      trimX,
      trimY,
    ].join(':');
    cutout = cache.get(key) ?? null;
    if (!cutout) {
      cutout = ctx.canvas.ownerDocument.createElement('canvas');
      cutout.width = rasterWidth;
      cutout.height = rasterHeight;
      const g = cutout.getContext('2d');
      if (g) {
        g.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          trimX * rasterScaleX - rasterX,
          trimY * rasterScaleY - rasterY,
          sw * rasterScaleX,
          sh * rasterScaleY,
        );
        if (haze > 0) {
          g.globalCompositeOperation = 'source-atop';
          g.globalAlpha = haze;
          g.fillStyle = color;
          g.fillRect(0, 0, cutout.width, cutout.height);
          g.globalAlpha = 1;
        }
        if (placement.fadeFrom !== undefined) {
          g.globalCompositeOperation = 'destination-in';
          // Dissolve only the narrow contact edge, not the trunk or rock body.
          const end = placement.fadeTo ?? ay;
          const start = placement.translucent
            ? placement.fadeFrom
            : Math.max(placement.fadeFrom, end - 0.045);
          const fade = g.createLinearGradient(
            0,
            logicalHeight * start * rasterScaleY - rasterY,
            0,
            logicalHeight * end * rasterScaleY - rasterY,
          );
          fade.addColorStop(0, 'rgba(0,0,0,1)');
          fade.addColorStop(0.55, 'rgba(0,0,0,.8)');
          fade.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = fade;
          g.fillRect(0, 0, cutout.width, cutout.height);
        }
      } else {
        cutout.width = cutout.height = 0;
        cutout = null;
      }
      if (cutout) {
        if (cache.size >= 64) releaseCutout(cache.values().next().value!);
        cache.set(key, cutout);
        retained.set(cutout, { cache, key });
        retainedPixels += cutout.width * cutout.height;
        while (retainedPixels > 8_000_000 && retained.size > 1)
          releaseCutout(retained.keys().next().value!);
      }
    } else {
      const entry = retained.get(cutout)!;
      retained.delete(cutout);
      retained.set(cutout, entry);
    }
  }
  ctx.save();
  if (placement.translucent) ctx.globalAlpha *= detail;
  else if (haze > 0) ctx.filter = `grayscale(${haze * 0.45}) blur(${haze * 0.65}px)`;
  ctx.translate(x, foot);
  ctx.rotate(placement.angle ?? 0);
  ctx.scale(placement.flip ? -1 : 1, 1);
  const sampleX = cutout ? rasterX / rasterScaleX : trimX,
    sampleY = cutout ? rasterY / rasterScaleY : trimY,
    sampleWidth = cutout ? rasterWidth / rasterScaleX : sw,
    sampleHeight = cutout ? rasterHeight / rasterScaleY : sh;
  (placement.draw ?? drawCachedImage)(
    ctx,
    image,
    [sx + sampleX - trimX, sy + sampleY - trimY, sampleWidth, sampleHeight],
    -width * ax + (sampleX * width) / logicalWidth,
    -height * ay + (sampleY * height) / logicalHeight,
    (sampleWidth * width) / logicalWidth,
    (sampleHeight * height) / logicalHeight,
    cutout ?? undefined,
  );
  ctx.restore();
}
