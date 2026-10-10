import type { EnvironmentFrame } from './local-renderer.ts';
import { retireSceneTexture } from '../texture-revision.ts';

export type ComposedLayer = {
  colour: ImageBitmap;
  normal?: ImageBitmap;
  surface?: ImageBitmap;
  emissive?: ImageBitmap;
};
export type EnvironmentSnapshot = {
  imagePreload?: { key?: string; status: 'none' | 'pending' | 'ready' | 'denied' };
  materialCutouts?: {
    entries: number;
    pixels: number;
    pixelBudget: number;
    scratchPixels: number;
    gpuBakes?: number;
    hits: number;
    misses: number;
    evictions: number;
  };
  foreground: { layers: number; pixels: number };
  backend: 'loading' | 'layered' | 'unavailable';
  builds: number;
  loadedImages: number;
  width: number;
  height: number;
  layers: number;
  pixels: number;
  decodedBytes?: number;
  canvasBytes?: number;
  /** Reserved independent bitmap copies while worker export is in progress. */
  exportBytes?: number;
  canvases?: number;
  decodedLoader?: {
    queued: number;
    decoded: number;
    pinned: number;
    pinnedBytes: number;
    bytes: number;
    reservedBytes?: number;
    peakBytes: number;
    budget: number;
    evictions: number;
  };
  timings?: { assets: number; compose: number; transfer: number };
  texturesWarmed?: boolean;
};
export type ComposeRequest = {
  decodedBudget?: number;
  decodedSizeBudget?: number;
  retainedBytes?: number;
} & (
  | { id: number; kind: 'cancel'; requestId: number }
  | { id: number; kind: 'trim'; stage?: number }
  | { id: number; kind: 'preload'; stage?: number }
  | { id: number; kind: 'prepare'; stage: number }
  | { id: number; kind: 'compose'; key: string; frame: EnvironmentFrame }
);
export type ComposeResponse = {
  id: number;
  ok: boolean;
  key?: string;
  layers: ComposedLayer[];
  foreground: ComposedLayer[];
  snapshot: EnvironmentSnapshot;
  error?: string;
  phase?: 'decode-progress' | 'assets-ready' | 'composed';
};
export type CompositionIdentity = Pick<
  EnvironmentFrame,
  'width' | 'height' | 'dpr' | 'stage' | 'stageSeed' | 'lowQuality' | 'sceneryDetail'
>;
export function compositionKey(frame: CompositionIdentity) {
  const identity: (number | boolean | string)[] = [
    frame.width,
    frame.height,
    frame.dpr,
    frame.stage,
    frame.stageSeed ?? 0,
    frame.lowQuality,
  ];
  if (frame.sceneryDetail) identity.push(frame.sceneryDetail);
  return JSON.stringify(identity);
}
export function closeLayers(layers: readonly ComposedLayer[]) {
  for (const layer of layers)
    for (const bitmap of [layer.colour, layer.normal, layer.surface, layer.emissive])
      if (bitmap) {
        retireSceneTexture(bitmap);
        bitmap.close();
      }
}

/** Transferred pixels are independent copies of the worker's composed canvases. */
export function composedLayerBytes(layers: readonly ComposedLayer[]): number {
  const sources = new Set<ImageBitmap>();
  for (const layer of layers)
    for (const source of [layer.colour, layer.normal, layer.surface, layer.emissive])
      if (source) sources.add(source);
  return [...sources].reduce((bytes, source) => bytes + source.width * source.height * 4, 0);
}
