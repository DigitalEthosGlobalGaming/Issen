import { createMainImageOwner } from '../../platform/main-images.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import type { SceneTexture } from '../scene-frame.ts';
import type { LeafAtlas } from '../scene-leaves.ts';
import { DRIFT_ATLASES, driftAtlasIds } from './drift-catalog.ts';

type Frame = readonly [number, number, number, number];
type Kit = {
  image?: HTMLImageElement;
  materials: ReturnType<typeof createAssetMaterials<string>>;
  lease: ReturnType<ReturnType<typeof createMainImageOwner>['acquire']>;
  pending: Promise<boolean>;
  live: boolean;
};

/** Prepare incoming families without dropping the drawable set; superseded inputs can unpin. */
export function createDriftImages(
  doc: Document,
  retire: (sources: SceneTexture['source'][], preserveFrame: boolean) => void,
  warm?: (atlases: readonly LeafAtlas[], signal: AbortSignal) => Promise<(() => void) | false>,
) {
  const images = createMainImageOwner(doc);
  const kits = new Map<string, Kit>();
  let selected: string[] = [],
    requested: string[] = [],
    generation = 0,
    disposed = false;
  let selectedKey = '',
    requestedKey = '';
  let pending: Promise<boolean> | undefined;
  let atlases: readonly LeafAtlas[] = [];
  let controller: AbortController | undefined;
  let releaseWarm: (() => void) | undefined;
  let published = false;
  const ready = () => !disposed && published && selected.length > 0 && selectedKey === requestedKey;
  function sources(id: string, kit: Kit): SceneTexture['source'][] {
    const image = kit.image;
    const material =
      image && kit.materials.material(id, [0, 0, image.naturalWidth, image.naturalHeight]);
    return [
      image,
      material?.normal?.source,
      material?.surface?.source,
      material?.emissive?.source,
    ].filter((source) => !!source);
  }
  function release(id: string, preserveFrame: boolean) {
    const kit = kits.get(id)!;
    kit.live = false;
    retire(sources(id, kit), preserveFrame);
    kit.materials.dispose();
    kit.lease.release();
    kits.delete(id);
  }
  function acquire(id: string): Kit {
    const existing = kits.get(id);
    if (existing) return existing;
    const materials = createAssetMaterials(doc, { [id]: DRIFT_ATLASES[id]! }, images);
    const lease = images.acquire(DRIFT_ATLASES[id]!);
    const kit: Kit = { materials, lease, live: true, pending: Promise.resolve(false) };
    kits.set(id, kit);
    kit.pending = lease.ready
      .then(async (image) => {
        if (!kit.live || disposed) return false;
        kit.image = image;
        await materials.prepare();
        return kit.live && !disposed && materials.ready(id);
      })
      .catch(() => false);
    return kit;
  }
  function prepare(stage?: number): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    const next = driftAtlasIds(stage);
    const key = next.join(':');
    if (key === requestedKey && pending) return pending;
    controller?.abort();
    const incoming = (controller = new AbortController());
    published = false;
    requestedKey = key;
    requested = next;
    const request = ++generation;
    for (const id of kits.keys())
      if (!selected.includes(id) && !next.includes(id)) release(id, true);
    return (pending = Promise.all(next.map((id) => acquire(id).pending))
      .then(async (loaded) => {
        if (disposed || request !== generation || !loaded.every(Boolean)) return false;
        const prepared = next.map((id) => {
          const kit = kits.get(id)!,
            image = kit.image!,
            width = image.naturalWidth,
            height = image.naturalHeight;
          return {
            id,
            texture: { source: image, revision: 0 },
            material: kit.materials.material(id, [0, 0, width, height])!,
            width,
            height,
          };
        });
        const releaseIncoming = warm ? await warm(prepared, incoming.signal) : undefined;
        if (disposed || request !== generation || releaseIncoming === false) {
          if (releaseIncoming) releaseIncoming();
          return false;
        }
        releaseWarm?.();
        releaseWarm = releaseIncoming || undefined;
        for (const id of kits.keys()) if (!next.includes(id)) release(id, true);
        selected = next;
        selectedKey = key;
        atlases = prepared;
        published = true;
        return true;
      })
      .then((ready) => {
        if (!ready && !disposed && request === generation) {
          for (const id of kits.keys()) if (!selected.includes(id)) release(id, true);
          pending = undefined;
        }
        return ready;
      }));
  }
  return {
    prepare,
    get ready() {
      return ready();
    },
    get atlases() {
      return atlases;
    },
    image: (id: string) => (selected.includes(id) ? kits.get(id)?.image : undefined),
    material: (id: string, frame: Frame) =>
      selected.includes(id) ? (kits.get(id)?.materials.material(id, frame) ?? null) : null,
    sources: () => [...kits].flatMap(([id, kit]) => sources(id, kit)),
    snapshot: () => ({
      ...images.snapshot(),
      selected: [...selected],
      requested: [...requested],
      ready: ready(),
    }),
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      controller?.abort();
      releaseWarm?.();
      releaseWarm = undefined;
      for (const id of kits.keys()) release(id, false);
      selected = requested = [];
      selectedKey = requestedKey = '';
      atlases = [];
      images.dispose();
    },
  };
}
