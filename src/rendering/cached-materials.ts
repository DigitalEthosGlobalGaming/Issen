import type { SceneDrawing } from './scene-drawing.ts';
import type { SceneMaterial, SceneTexture } from './scene-frame.ts';
import { normalTransform } from './scene-frame.ts';
import { drawMaterialStamp, supportsSceneMaterials } from './scene-material.ts';

type Frame = readonly [number, number, number, number];
type Layer = {
  owner: Owner;
  normal: HTMLCanvasElement;
  surface: HTMLCanvasElement;
  emissive: HTMLCanvasElement;
  revision: number;
};
type Owner = { layers: Set<HTMLCanvasElement>; images: Set<HTMLImageElement> };
const sources = new WeakMap<
  HTMLImageElement,
  { owner: Owner; material: (frame: Frame) => SceneMaterial | null }
>();
const layers = new WeakMap<HTMLCanvasElement, Layer>();
// A reused colour canvas must never repeat a previous revision after its maps
// are rebuilt. Per-layer draw counts can coincide across different stages.
let revisionSequence = 0;
type PathCall = { name: string; args: unknown[]; transform: DOMMatrix };
type Clip = { path: PathCall[]; args: unknown[] };
const contextState = new WeakMap<SceneDrawing, { path: PathCall[]; clips: Clip[] }>();
const pathMethods = new Set([
  'closePath',
  'moveTo',
  'lineTo',
  'quadraticCurveTo',
  'bezierCurveTo',
  'arc',
  'ellipse',
  'rect',
]);
function replayPath(g: CanvasRenderingContext2D, path: PathCall[]) {
  g.beginPath();
  for (const call of path) {
    g.setTransform(call.transform);
    Reflect.apply(Reflect.get(g, call.name), g, call.args);
  }
}
function mapContext(ctx: SceneDrawing, g: CanvasRenderingContext2D, draw: () => void) {
  g.save();
  for (const clip of contextState.get(ctx)?.clips ?? []) {
    replayPath(g, clip.path);
    Reflect.apply(g.clip, g, clip.args);
  }
  g.setTransform(ctx.getTransform());
  g.globalAlpha = ctx.globalAlpha;
  draw();
  g.restore();
}

/** Preserve clipping and erase covered material pixels when procedural art draws above them. */
export function cachedMaterialContext(native: CanvasRenderingContext2D): SceneDrawing {
  const state = { path: [] as PathCall[], clips: [] as Clip[] };
  const stack: Clip[][] = [];
  const proxy = new Proxy(native, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        const name = String(property);
        if (name === 'beginPath') state.path = [];
        if (pathMethods.has(name))
          state.path.push({ name, args, transform: target.getTransform() });
        if (name === 'save') stack.push([...state.clips]);
        if (name === 'restore') state.clips = stack.pop() ?? [];
        if (name === 'clip') state.clips.push({ path: [...state.path], args });
        const result = Reflect.apply(value, target, args);
        const layer = layers.get(target.canvas);
        if (layer && ['fill', 'fillRect', 'stroke', 'strokeRect', 'clearRect'].includes(name)) {
          const operation = target.globalCompositeOperation;
          if (
            name === 'clearRect' ||
            operation === 'source-over' ||
            operation === 'destination-in'
          ) {
            for (const map of [layer.normal, layer.surface, layer.emissive]) {
              const g = map.getContext('2d')!;
              mapContext(proxy, g, () => {
                g.globalCompositeOperation =
                  operation === 'destination-in' ? 'destination-in' : 'destination-out';
                g.fillStyle = target.fillStyle;
                g.strokeStyle = target.strokeStyle;
                g.lineWidth = target.lineWidth;
                g.lineCap = target.lineCap;
                g.lineJoin = target.lineJoin;
                if (name === 'fill' || name === 'stroke') {
                  replayPath(g, state.path);
                  g.setTransform(target.getTransform());
                }
                Reflect.apply(Reflect.get(g, name), g, args);
              });
            }
            layer.revision = ++revisionSequence;
          }
        }
        return result;
      };
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    },
  });
  contextState.set(proxy, state);
  return proxy;
}

/** Material data follows the same placement and compositing order as cached colour. */
export function createCachedMaterials() {
  const owner: Owner = { layers: new Set(), images: new Set() };
  return {
    bind(image: HTMLImageElement, material: (frame: Frame) => SceneMaterial | null) {
      owner.images.add(image);
      sources.set(image, { owner, material });
    },
    dispose() {
      for (const image of owner.images) sources.delete(image);
      for (const canvas of owner.layers) clearCachedMaterial(canvas);
      owner.images.clear();
      owner.layers.clear();
    },
  };
}
export function clearCachedMaterial(canvas: HTMLCanvasElement) {
  const layer = layers.get(canvas);
  if (!layer) return;
  for (const map of [layer.normal, layer.surface, layer.emissive]) map.width = map.height = 0;
  layer.owner.layers.delete(canvas);
  layers.delete(canvas);
}
function materialLayer(canvas: HTMLCanvasElement, owner: Owner): Layer {
  let layer = layers.get(canvas);
  if (layer && (layer.normal.width !== canvas.width || layer.normal.height !== canvas.height)) {
    clearCachedMaterial(canvas);
    layer = undefined;
  }
  if (!layer) {
    const map = () => {
      const c = canvas.ownerDocument.createElement('canvas');
      c.width = canvas.width;
      c.height = canvas.height;
      return c;
    };
    layer = { owner, normal: map(), surface: map(), emissive: map(), revision: ++revisionSequence };
    layers.set(canvas, layer);
    owner.layers.add(canvas);
  }
  return layer;
}
function layerMaterial(layer: Layer): SceneMaterial {
  return {
    normal: { source: layer.normal, revision: layer.revision },
    surface: { source: layer.surface, revision: layer.revision },
    emissive: { source: layer.emissive, revision: layer.revision },
    surfaceCoverage: true,
    normalY: -1,
    lighting: 1,
    depth: 0,
    fog: 0,
    fogColor: [0, 0, 0],
  };
}

/** Read an owned completed layer for off-thread composition transfer. */
export function getCachedMaterial(canvas: HTMLCanvasElement): SceneMaterial | null {
  const layer = layers.get(canvas);
  return layer ? layerMaterial(layer) : null;
}

/** Draw a source crop or an already composed layer, retaining aligned PBR channels. */
export function drawCachedImage(
  ctx: SceneDrawing,
  source: HTMLImageElement | HTMLCanvasElement,
  frame: Frame,
  x: number,
  y: number,
  width: number,
  height: number,
  colour?: HTMLCanvasElement,
) {
  const entry = source instanceof HTMLImageElement ? sources.get(source) : undefined;
  const cached = source instanceof HTMLCanvasElement ? layers.get(source) : undefined;
  const material = entry?.material(frame) ?? (cached ? layerMaterial(cached) : null);
  const texture: SceneTexture = {
    source: colour ?? source,
    revision: cached?.revision ?? 0,
    frame: colour ? undefined : frame,
  };
  if (material && supportsSceneMaterials(ctx)) {
    drawMaterialStamp(ctx, { texture, material, x, y, width, height });
    return;
  }
  if (material && (entry || cached) && width && height) {
    const owner = entry?.owner ?? cached!.owner;
    const destination = materialLayer(ctx.canvas, owner);
    const transform = ctx.getTransform();
    const normalMatrix = normalTransform(
      {
        a: transform.a,
        b: transform.b,
        c: transform.c,
        d: transform.d,
        tx: transform.e,
        ty: transform.f,
      },
      undefined,
      width / frame[2],
      height / frame[3],
    );
    const scratch = ctx.canvas.ownerDocument.createElement('canvas');
    // Baking finer than the destination backing pixels adds readback work and
    // loses that detail again when the maps are composited into the scene cache.
    scratch.width = Math.max(
      1,
      Math.min(
        Math.ceil(frame[2]),
        Math.ceil(Math.abs(width) * Math.hypot(transform.a, transform.b)),
      ),
    );
    scratch.height = Math.max(
      1,
      Math.min(
        Math.ceil(frame[3]),
        Math.ceil(Math.abs(height) * Math.hypot(transform.c, transform.d)),
      ),
    );
    const g = scratch.getContext('2d', { willReadFrequently: true })!;
    const alignedNormal =
      (material.normalY ?? 1) === -1 &&
      Math.abs(normalMatrix[0]! - 1) < 1e-6 &&
      Math.abs(normalMatrix[1]!) < 1e-6 &&
      Math.abs(normalMatrix[2]!) < 1e-6 &&
      Math.abs(normalMatrix[3]! - 1) < 1e-6;
    for (const kind of ['normal', 'surface', 'emissive'] as const) {
      const map = material[kind];
      if (!map) continue;
      g.clearRect(0, 0, scratch.width, scratch.height);
      const crop = map.frame ?? frame;
      g.drawImage(map.source, ...crop, 0, 0, scratch.width, scratch.height);
      if (kind === 'normal' && !alignedNormal) {
        const pixels = g.getImageData(0, 0, scratch.width, scratch.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const nx = pixels.data[i]! / 127.5 - 1;
          const ny = (pixels.data[i + 1]! / 127.5 - 1) * (material.normalY ?? 1);
          const nz = pixels.data[i + 2]! / 127.5 - 1;
          const tx = normalMatrix[0]! * nx + normalMatrix[2]! * ny;
          const ty = normalMatrix[1]! * nx + normalMatrix[3]! * ny;
          const length = Math.sqrt(tx * tx + ty * ty + nz * nz) || 1;
          pixels.data[i] = (tx / length + 1) * 127.5;
          pixels.data[i + 1] = (-ty / length + 1) * 127.5;
          pixels.data[i + 2] = (nz / length + 1) * 127.5;
        }
        g.putImageData(pixels, 0, 0);
      }
      g.globalCompositeOperation = 'destination-in';
      if (colour) g.drawImage(colour, 0, 0, scratch.width, scratch.height);
      else g.drawImage(source, ...frame, 0, 0, scratch.width, scratch.height);
      g.globalCompositeOperation = 'source-over';
      const output = destination[kind].getContext('2d')!;
      mapContext(ctx, output, () => {
        output.globalCompositeOperation = ctx.globalCompositeOperation;
        output.drawImage(scratch, x, y, width, height);
      });
    }
    scratch.width = scratch.height = 0;
    destination.revision = ++revisionSequence;
  }
  if (colour) ctx.drawImage(colour, x, y, width, height);
  else ctx.drawImage(source, ...frame, x, y, width, height);
}
