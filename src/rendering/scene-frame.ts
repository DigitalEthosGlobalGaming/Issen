/** Backend-independent scene data. Coordinates are logical pixels, Y points down. */
export interface SceneTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export const IDENTITY: Readonly<SceneTransform> = Object.freeze({
  a: 1,
  b: 0,
  c: 0,
  d: 1,
  tx: 0,
  ty: 0,
});

export interface SceneTexture {
  source: HTMLImageElement | HTMLCanvasElement;
  /** Increment only when a prepared canvas's pixels change. */
  revision: number;
  frame?: readonly [x: number, y: number, width: number, height: number];
}

export interface SceneMaterial {
  normal?: SceneTexture;
  /** R: specular strength, G: gloss, B: emission. Linear data. */
  mask?: SceneTexture;
  lighting: number;
  depth: number;
  fog: number;
  fogColor: readonly [number, number, number];
}

export interface SceneSprite {
  kind: 'sprite';
  texture: SceneTexture;
  transform: Readonly<SceneTransform>;
  width: number;
  height: number;
  alpha: number;
  tint: number;
  blend: 'normal' | 'add' | 'multiply' | 'screen';
  material?: SceneMaterial;
}

export interface SceneLight {
  x: number;
  y: number;
  z: number;
  radius: number;
  intensity: number;
  color: readonly [number, number, number];
}

export interface SceneLighting {
  ambient: readonly [number, number, number];
  directional: readonly [number, number, number];
  direction: readonly [number, number, number];
  points: readonly SceneLight[];
}

export interface SceneFrame {
  width: number;
  height: number;
  dpr: number;
  time: number;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  /** Already ordered by the compositor; a backend must not reorder transparency. */
  sprites: readonly SceneSprite[];
  lighting: SceneLighting;
}

export interface SceneBackend {
  readonly canvas: HTMLCanvasElement;
  readonly kind: 'canvas' | 'pixi';
  resize(width: number, height: number, dpr: number): void;
  render(frame: SceneFrame): void;
  dispose(): void;
}

/** Inverse transpose of the 2D linear transform; preserves mirrored normals. */
export function normalTransform(t: Readonly<SceneTransform>): Float32Array {
  const det = t.a * t.d - t.b * t.c;
  if (Math.abs(det) < 1e-8) return new Float32Array([1, 0, 0, 1]);
  // Uniform world scaling changes size, not the authored slope relative to Z.
  const scale = Math.sqrt(Math.abs(det)) / det;
  return new Float32Array([t.d * scale, -t.c * scale, -t.b * scale, t.a * scale]);
}
