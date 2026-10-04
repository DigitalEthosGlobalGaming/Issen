import sevenDawnsSvg from '../ui/assets/crest-seven-dawns.svg?raw';
const dawnPaths: Path2D[] = [];
const ATLAS_URL = new URL('../ui/assets/world-ui-atlas.png', import.meta.url).href;
export type SealMaterial = 'paper' | 'wood' | 'metal' | 'silk' | 'stone';
const frames = {
  paper: [0, 0],
  wood: [192, 0],
  metal: [384, 0],
  silk: [576, 0],
  stone: [0, 192],
} as const;
const crestIds = ['tomoe', 'kikyo', 'juji', 'aoi', 'fuji', 'tsuru', 'rokumon'];
let atlas: HTMLImageElement | null = null;
let ready: Promise<void> | null = null;
const cache = new Map<string, HTMLCanvasElement>();
function load() {
  if (typeof Image === 'undefined') return null;
  if (!atlas) {
    atlas = new Image();
    const source = atlas;
    ready = new Promise<void>((resolve) => {
      source.onload = () => resolve();
      source.onerror = () => resolve();
    });
    source.src = ATLAS_URL;
  }
  return atlas.complete && atlas.naturalWidth ? atlas : null;
}
function tinted(material: SealMaterial, color: string) {
  const image = load();
  if (!image) return null;
  const key = material + color;
  if (cache.has(key)) return cache.get(key)!;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d')!;
  const [x, y] = frames[material];
  ctx.drawImage(image, x, y, 192, 192, 0, 0, 192, 192);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 192, 192);
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(image, x, y, 192, 192, 0, 0, 192, 192);
  if (cache.size >= 40) cache.delete(cache.keys().next().value!);
  cache.set(key, canvas);
  return canvas;
}
/** Fixed corner/edge bands, with a stretched centre; all coordinates are pixels. */
export function drawSeal(
  g: CanvasRenderingContext2D,
  material: SealMaterial,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const source = tinted(material, color);
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
    for (let col = 0; col < 3; col++)
      g.drawImage(
        source,
        src[col]!,
        src[row]!,
        src[col + 1]! - src[col]!,
        src[row + 1]! - src[row]!,
        dx[col]!,
        dy[row]!,
        dx[col + 1]! - dx[col]!,
        dy[row + 1]! - dy[row]!,
      );
}
export function drawCrestSprite(
  g: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  r: number,
) {
  if (id === 'seven-dawns') {
    if (!dawnPaths.length)
      for (const match of sevenDawnsSvg.matchAll(/<path d="([^"]+)"/g))
        dawnPaths.push(new Path2D(match[1]));
    g.save();
    g.translate(x - r * 1.28, y - r * 1.28);
    g.scale((r * 2.56) / 100, (r * 2.56) / 100);
    g.globalAlpha *= 0.88;
    g.fillStyle = '#d6cbb4';
    for (const path of dawnPaths) g.fill(path);
    g.restore();
    return;
  }
  const image = load(),
    index = crestIds.indexOf(id);
  if (!image || index < 0) return;
  g.save();
  g.globalAlpha *= 0.88;
  g.drawImage(
    image,
    (index % 6) * 128,
    384 + Math.floor(index / 6) * 128,
    128,
    128,
    x - r * 1.28,
    y - r * 1.28,
    r * 2.56,
    r * 2.56,
  );
  g.restore();
}
export async function setSealTextures(root: HTMLElement, color: string) {
  root.dataset.sealColor = color;
  load();
  await ready;
  if (!root.isConnected || root.dataset.sealColor !== color) return;
  for (const material of Object.keys(frames) as SealMaterial[]) {
    const source = tinted(material, color);
    if (source) root.style.setProperty('--seal-' + material, `url("${source.toDataURL()}")`);
  }
}
