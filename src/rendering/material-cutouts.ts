import type { SceneTexture } from './scene-frame.ts';

type Frame = readonly [number, number, number, number];
export type CutoutRequest = {
  gpu?: boolean;
  kind: 'normal' | 'surface' | 'emissive';
  map?: SceneTexture;
  frame: Frame;
  mask: object;
  maskRevision: number | string;
  maskFrame?: Frame;
  width: number;
  height: number;
  normalY: number;
  normalMatrix: ArrayLike<number>;
};

/** Quantise rotation only; retain reflection, anisotropy and shear of the normal basis. */
export function cutoutNormalTransform(matrix: ArrayLike<number>, stepDegrees = 2): Float32Array {
  if (!stepDegrees) return new Float32Array(Array.from(matrix));
  const x = Math.hypot(matrix[0]!, matrix[1]!);
  if (!x) return new Float32Array(Array.from(matrix));
  const angle = Math.atan2(matrix[1]!, matrix[0]!);
  const step = (stepDegrees * Math.PI) / 180;
  const rounded = Math.round(angle / step) * step;
  const stable = (value: number) => Math.round(value * 1e6) / 1e6;
  const shear = stable((matrix[0]! * matrix[2]! + matrix[1]! * matrix[3]!) / x);
  const y = stable((matrix[0]! * matrix[3]! - matrix[1]! * matrix[2]!) / x);
  const scale = stable(x),
    c = Math.cos(rounded),
    s = Math.sin(rounded);
  return new Float32Array([
    stable(c * scale),
    stable(s * scale),
    stable(c * shear - s * y),
    stable(s * shear + c * y),
  ]);
}

/** All pixel-affecting crop/mask/source revisions participate in cache identity. */
export function materialCutoutKey(request: CutoutRequest, identity: (source: object) => number) {
  const m = request.normalMatrix;
  return JSON.stringify([
    request.kind,
    request.gpu ?? false,
    request.map ? identity(request.map.source) : 0,
    request.map?.revision ?? 0,
    request.map?.frame ?? request.frame,
    identity(request.mask),
    request.maskRevision,
    request.maskFrame ?? null,
    request.width,
    request.height,
    request.normalY,
    m[0]! * m[3]! - m[1]! * m[2]! < 0,
    request.kind === 'normal' ? Array.from(m) : null,
  ]);
}

/** Small per-document scratch pool and pixel-bounded LRU of immutable masked maps. */
export function createMaterialCutouts(doc: Document, pixelBudget = 4_000_000) {
  let identities = new WeakMap<object, number>(),
    sequence = 0;
  const identity = (source: object) => {
    let id = identities.get(source);
    if (id === undefined) identities.set(source, (id = ++sequence));
    return id;
  };
  const entries = new Map<string, { canvas: HTMLCanvasElement; dependencies: number[] }>();
  let scratch: HTMLCanvasElement | undefined;
  const gpuCanvases = new WeakSet<HTMLCanvasElement>();
  let pixels = 0,
    hits = 0,
    misses = 0,
    evictions = 0;
  let gpuBakes = 0;
  function release(key: string) {
    const entry = entries.get(key)!;
    pixels -= entry.canvas.width * entry.canvas.height;
    entry.canvas.width = entry.canvas.height = 0;
    entries.delete(key);
    return entry.canvas;
  }
  return {
    get(request: CutoutRequest, bake: (g: CanvasRenderingContext2D) => void) {
      const key = materialCutoutKey(request, identity);
      const existing = entries.get(key);
      if (existing) {
        hits++;
        entries.delete(key);
        entries.set(key, existing);
        return existing.canvas;
      }
      misses++;
      const size = request.width * request.height;
      const cacheable = size <= pixelBudget && pixelBudget > 0;
      let reusable: HTMLCanvasElement | undefined;
      while (cacheable && pixels + size > pixelBudget && entries.size) {
        reusable = release(entries.keys().next().value!);
        evictions++;
      }
      const gpu = request.gpu ?? false;
      if (reusable && gpuCanvases.has(reusable) !== gpu) reusable = undefined;
      if (!cacheable && scratch && gpuCanvases.has(scratch) !== gpu) {
        scratch.width = scratch.height = 0;
        scratch = undefined;
      }
      // Bake directly into the retained entry. Copying a freshly baked canvas
      // forces its pending rasterization and costs more than the cache saves.
      const working = cacheable
        ? (reusable ?? doc.createElement('canvas'))
        : (scratch ??= doc.createElement('canvas'));
      if (working.width !== request.width) working.width = request.width;
      if (working.height !== request.height) working.height = request.height;
      // Atlas downsampling retains software rasterization. Owners may opt into
      // GPU baking only for aligned full-layer copies at identical pixel sizes.
      if (gpu) gpuCanvases.add(working);
      const g = working.getContext('2d', { willReadFrequently: !gpu })!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, working.width, working.height);
      bake(g);
      if (gpu) gpuBakes++;
      if (!cacheable) return working;
      const dependencies = [
        identity(request.mask),
        ...(request.map ? [identity(request.map.source)] : []),
      ];
      entries.set(key, {
        canvas: working,
        dependencies,
      });
      pixels += size;
      return working;
    },
    invalidate(source: object) {
      const id = identities.get(source);
      if (id === undefined) return;
      for (const [key, entry] of entries) if (entry.dependencies.includes(id)) release(key);
    },
    clear() {
      for (const key of entries.keys()) release(key);
      if (scratch) scratch.width = scratch.height = 0;
      scratch = undefined;
      identities = new WeakMap();
    },
    snapshot: () => ({
      entries: entries.size,
      pixels,
      pixelBudget,
      hits,
      misses,
      evictions,
      gpuBakes,
      scratchPixels: scratch ? scratch.width * scratch.height : 0,
    }),
  };
}
