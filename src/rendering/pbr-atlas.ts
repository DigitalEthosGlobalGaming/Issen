import type { SceneMaterial } from './scene-frame.ts';

type MapKind = 'diffuse' | 'normal' | 'roughness' | 'metallic' | 'ao' | 'emissive';
type Frame = readonly [number, number, number, number];

/** Instance-owned decoded PBR maps. Every part shares aligned atlas UVs. */
export function createPbrAtlas(
  doc: Document,
  sources: Record<MapKind, string>,
  width: number,
  height = width,
) {
  const images = new Map<MapKind, HTMLImageElement>();
  const materials = new Map<string, SceneMaterial>();
  const surface = doc.createElement('canvas');
  surface.width = surface.height = 0;
  let ready = false,
    disposed = false,
    pending: Promise<boolean> | undefined;
  function prepare(): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    return (pending ??= Promise.all(
      (Object.keys(sources) as MapKind[]).map(async (kind) => {
        const image = doc.createElement('img');
        images.set(kind, image);
        image.src = sources[kind];
        try {
          await image.decode();
          return !disposed && image.naturalWidth === width && image.naturalHeight === height;
        } catch {
          return false;
        }
      }),
    ).then((loaded) => {
      if (disposed || loaded.some((value) => !value)) return false;
      surface.width = width;
      surface.height = height;
      const g = surface.getContext('2d')!;
      const channels = (['roughness', 'metallic', 'ao'] as const).map((kind) => {
        g.clearRect(0, 0, width, height);
        g.drawImage(images.get(kind)!, 0, 0);
        return g.getImageData(0, 0, width, height).data;
      });
      const packed = g.createImageData(width, height);
      for (let i = 0; i < packed.data.length; i += 4) {
        packed.data[i] = channels[0]![i]!;
        packed.data[i + 1] = channels[1]![i]!;
        packed.data[i + 2] = channels[2]![i]!;
        packed.data[i + 3] = 255;
      }
      g.putImageData(packed, 0, 0);
      ready = true;
      return true;
    }));
  }
  return {
    prepare,
    get ready() {
      return ready;
    },
    get diffuse() {
      return ready ? images.get('diffuse')! : null;
    },
    material(frame: Frame): SceneMaterial | null {
      if (!ready) return null;
      const key = frame.join(',');
      let material = materials.get(key);
      if (!material) {
        material = {
          normal: { source: images.get('normal')!, revision: 0, frame },
          surface: { source: surface, revision: 0, frame },
          emissive: { source: images.get('emissive')!, revision: 0, frame },
          normalY: -1,
          lighting: 1,
          depth: 0,
          fog: 0,
          fogColor: [0.53, 0.51, 0.47],
        };
        materials.set(key, material);
      }
      return material;
    },
    dispose() {
      disposed = true;
      ready = false;
      for (const image of images.values()) image.removeAttribute('src');
      images.clear();
      materials.clear();
      surface.width = surface.height = 0;
    },
  };
}
