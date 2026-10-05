import type { SceneMaterial } from './scene-frame.ts';

export type SurfaceProfile = 'cloth' | 'rock' | 'steel';

/**
 * Small authored surface studies, independent of colour/ink brightness.
 * X points right, Y down, Z out of the artwork; RGB encodes [-1,1].
 * These broad forms are deliberately restrained so painted shading still leads.
 */
export function createSurfaceMapLibrary(doc: Document) {
  const maps = new Map<SurfaceProfile, SceneMaterial>();
  return {
    get(profile: SurfaceProfile): SceneMaterial {
      const existing = maps.get(profile);
      if (existing) return existing;
      const normal = doc.createElement('canvas'),
        mask = doc.createElement('canvas');
      normal.width = normal.height = mask.width = mask.height = 128;
      const ng = normal.getContext('2d')!,
        mg = mask.getContext('2d')!;
      const normals = ng.createImageData(128, 128),
        materials = mg.createImageData(128, 128);
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const u = (x + 0.5) / 128,
            v = (y + 0.5) / 128;
          let nx = 0,
            ny = 0,
            specular = 0,
            gloss = 0;
          if (profile === 'cloth') {
            nx = 0.2 * Math.sin(u * Math.PI * 6 + v * 0.9) + (u - 0.5) * 0.2;
            ny = (v - 0.5) * 0.1;
          } else if (profile === 'steel') {
            nx = 0.04;
            ny = v < 0.46 ? -0.28 : 0.35;
            specular = 0.22;
            gloss = 0.72;
          } else {
            // Broad faceted planes: authored form, not a height-from-luminance map.
            nx = u < 0.36 ? -0.4 : u > 0.7 ? 0.42 : 0.08;
            ny = v < 0.38 + u * 0.2 ? -0.35 : 0.18;
            gloss = 0.08;
          }
          const length = Math.hypot(nx, ny, 1),
            i = (y * 128 + x) * 4;
          normals.data.set(
            [
              ((nx / length) * 0.5 + 0.5) * 255,
              ((ny / length) * 0.5 + 0.5) * 255,
              ((1 / length) * 0.5 + 0.5) * 255,
              255,
            ],
            i,
          );
          materials.data.set([specular * 255, gloss * 255, 0, 255], i);
        }
      ng.putImageData(normals, 0, 0);
      mg.putImageData(materials, 0, 0);
      const material: SceneMaterial = {
        normal: { source: normal, revision: 0 },
        mask: { source: mask, revision: 0 },
        lighting: 1,
        depth: 0,
        fog: 0,
        fogColor: [0.53, 0.51, 0.47],
      };
      maps.set(profile, material);
      return material;
    },
    dispose(): void {
      maps.clear();
    },
  };
}
