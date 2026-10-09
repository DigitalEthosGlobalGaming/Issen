import { createMainImageOwner } from '../../platform/main-images.ts';
import type { SceneTexture, SceneMaterial } from '../scene-frame.ts';
import type { LeafAtlas } from '../scene-leaves.ts';
import { DRIFT_COLOUR, DRIFT_EMISSIVE, driftAtlasIds } from './drift-catalog.ts';

type Frame = readonly [number, number, number, number];

/** All families share two small planes; selections change without new decodes. */
export function createDriftImages(
  doc: Document,
  retire: (sources: SceneTexture['source'][], preserveFrame: boolean) => void,
  warm?: (atlases: readonly LeafAtlas[], signal: AbortSignal) => Promise<(() => void) | false>,
) {
  const images = createMainImageOwner(doc);
  let colour: HTMLImageElement | undefined, emission: HTMLImageElement | undefined;
  let selected: string[] = [],
    requested: string[] = [];
  let generation = 0,
    disposed = false,
    published = false;
  let requestedKey = '',
    selectedKey = '';
  let pending: Promise<boolean> | undefined;
  let decoded: Promise<boolean> | undefined;
  let leases: ReturnType<typeof images.acquire>[] = [];
  let atlases: readonly LeafAtlas[] = [];
  let controller: AbortController | undefined;
  let releaseWarm: (() => void) | undefined;
  const ready = () => !disposed && published && selectedKey === requestedKey;
  const sources = () => [colour, emission].filter((source): source is HTMLImageElement => !!source);
  const material = (frame?: Frame): SceneMaterial => ({
    lighting: 1,
    depth: 0,
    fog: 0,
    fogColor: [0, 0, 0],
    emissive: emission ? { source: emission, revision: 0, frame, mipmaps: true } : undefined,
  });
  function decode(): Promise<boolean> {
    if (decoded) return decoded;
    leases = [images.acquire(DRIFT_COLOUR), images.acquire(DRIFT_EMISSIVE)];
    return (decoded = Promise.all(leases.map((lease) => lease.ready))
      .then(([c, e]) => {
        if (disposed) return false;
        colour = c;
        emission = e;
        return true;
      })
      .catch(() => {
        for (const lease of leases) lease.release();
        leases = [];
        decoded = undefined;
        return false;
      }));
  }
  function prepare(stage?: number): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    const next = driftAtlasIds(stage),
      key = next.join(':');
    if (key === requestedKey && pending) return pending;
    controller?.abort();
    const incoming = (controller = new AbortController());
    const request = ++generation;
    requested = next;
    requestedKey = key;
    published = false;
    return (pending = decode()
      .then(async (loaded) => {
        if (!loaded || disposed || request !== generation || !colour) return false;
        // Shared pixels cover every family, including leaves surviving a stage change.
        const prepared = driftAtlasIds().map((id) => ({
          id,
          texture: { source: colour!, revision: 0, mipmaps: true },
          material: material(),
          width: colour!.naturalWidth,
          height: colour!.naturalHeight,
        }));
        const releaseIncoming = warm ? await warm(prepared, incoming.signal) : undefined;
        if (disposed || request !== generation || releaseIncoming === false) {
          if (releaseIncoming) releaseIncoming();
          return false;
        }
        releaseWarm?.();
        releaseWarm = releaseIncoming || undefined;
        selected = next;
        selectedKey = key;
        atlases = prepared;
        published = true;
        return true;
      })
      .catch(() => false)
      .then((success) => {
        if (!success && !disposed && request === generation) pending = undefined;
        return success;
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
    image: (id: string) => (selected.includes(id) ? colour : undefined),
    material: (id: string, frame: Frame) => (selected.includes(id) ? material(frame) : null),
    sources,
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
      retire(sources(), false);
      for (const lease of leases) lease.release();
      images.dispose();
      leases = [];
      colour = emission = undefined;
      selected = requested = [];
      atlases = [];
    },
  };
}
