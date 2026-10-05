import type { EnvironmentFrame } from './local-renderer.ts';

export type ComposedLayer = {
  colour: ImageBitmap;
  normal?: ImageBitmap;
  surface?: ImageBitmap;
  emissive?: ImageBitmap;
};
export type EnvironmentSnapshot = {
  foreground: { layers: number; pixels: number };
  backend: 'loading' | 'layered' | 'unavailable';
  builds: number;
  loadedImages: number;
  width: number;
  height: number;
  layers: number;
  pixels: number;
};
export type ComposeRequest =
  | { id: number; kind: 'prepare'; stage: number }
  | { id: number; kind: 'compose'; key: string; frame: EnvironmentFrame };
export type ComposeResponse = {
  id: number;
  ok: boolean;
  key?: string;
  layers: ComposedLayer[];
  foreground: ComposedLayer[];
  snapshot: EnvironmentSnapshot;
  error?: string;
};
export function compositionKey(frame: EnvironmentFrame) {
  return JSON.stringify([
    frame.width,
    frame.height,
    frame.dpr,
    frame.stage,
    frame.stageSeed ?? 0,
    frame.lowQuality,
  ]);
}
export function closeLayers(layers: readonly ComposedLayer[]) {
  for (const layer of layers)
    for (const bitmap of [layer.colour, layer.normal, layer.surface, layer.emissive])
      bitmap?.close();
}
