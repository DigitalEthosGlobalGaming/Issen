/** Shared scene texture, material and lighting data. Coordinates are logical pixels, Y points down. */
export interface SceneTransform {
  a: number;
  b: number;
  c: number;
  d: number;
  tx: number;
  ty: number;
}

export interface SceneTexture {
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  /** Increment only when a prepared canvas's pixels change. */
  revision: number;
  frame?: readonly [x: number, y: number, width: number, height: number];
}

export interface SceneMaterial {
  /** Minimum effective alpha written to the geometry buffer; default 0.5. */
  alphaCutoff?: number;
  normal?: SceneTexture;
  /** PBR data: R roughness, G metallic, B ambient occlusion, A opaque by default. */
  surface?: SceneTexture;
  /** Cached mixed layers use surface alpha to preserve unlit procedural pixels. */
  surfaceCoverage?: boolean;
  emissive?: SceneTexture;
  /** OpenGL maps use -1 to convert authored Y-up normals to scene Y-down. */
  normalY?: 1 | -1;
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
  /** Screen-plane reach; height changes direction, not the radius footprint. */
  radius: number;
  intensity: number;
  /** Display-space sRGB colour, decoded to linear radiance by the material backend. */
  color: readonly [number, number, number];
}

export interface SceneLighting {
  /** Full or half resolution HDR accumulation; geometry remains full resolution. */
  lightResolution?: 1 | 0.5;
  /** Debug comparison; omitted means authored material lighting. */
  materialLighting?: number;
  /** Linear RGB radiance, shared by PBR and mask materials. */
  ambient: readonly [number, number, number];
  directional: readonly [number, number, number];
  direction: readonly [number, number, number];
  /** Global viewport budget: at most 16 lights, ranked by visible footprint × intensity. */
  points: readonly SceneLight[];
}

/** Inverse transpose of the 2D linear transform; preserves mirrored normals. */
export function normalTransform(
  t: Readonly<SceneTransform>,
  out = new Float32Array(4),
  scaleX = 1,
  scaleY = 1,
): Float32Array {
  const a = t.a * scaleX,
    b = t.b * scaleX,
    c = t.c * scaleY,
    d = t.d * scaleY;
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-8) {
    out[0] = out[3] = 1;
    out[1] = out[2] = 0;
    return out;
  }
  // Uniform world scaling changes size, not the authored slope relative to Z.
  const scale = Math.sqrt(Math.abs(det)) / det;
  out[0] = d * scale;
  out[1] = -c * scale;
  out[2] = -b * scale;
  out[3] = a * scale;
  return out;
}
