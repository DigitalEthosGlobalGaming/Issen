import type { SceneMaterial } from './scene-frame.ts';

type MapKind = 'diffuse' | 'normal' | 'surface' | 'emissive';
export type PbrAtlasSources = Record<Exclude<MapKind, 'emissive'>, string> & { emissive?: string };
type Frame = readonly [number, number, number, number];

/** Instance-owned decoded PBR maps. Every part shares aligned atlas UVs. */
export function createPbrAtlas(
  doc: Document,
  sources: PbrAtlasSources,
  width: number,
  height = width,
  options: { colour?: boolean } = {},
) {
  const images = new Map<MapKind, HTMLImageElement>();
  const materials = new Map<string, SceneMaterial>();
  let ready = false,
    disposed = false,
    pending: Promise<boolean> | undefined;
  function prepare(): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    return (pending ??= Promise.all(
      (Object.keys(sources) as MapKind[])
        .filter((kind) => sources[kind] && (kind !== 'diffuse' || options.colour !== false))
        .map(async (kind) => {
          const image = doc.createElement('img');
          images.set(kind, image);
          image.src = sources[kind]!;
          try {
            await image.decode();
            return !disposed && image.naturalWidth === width && image.naturalHeight === height;
          } catch {
            return false;
          }
        }),
    ).then((loaded) => {
      ready = !disposed && loaded.every(Boolean);
      return ready;
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
        const emissive = images.get('emissive');
        material = {
          normal: { source: images.get('normal')!, revision: 0, frame },
          surface: { source: images.get('surface')!, revision: 0, frame },
          ...(emissive ? { emissive: { source: emissive, revision: 0, frame } } : {}),
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
      for (const image of images.values()) {
        image.removeAttribute('src');
        image.width = image.height = 0;
      }
      images.clear();
      materials.clear();
    },
  };
}
