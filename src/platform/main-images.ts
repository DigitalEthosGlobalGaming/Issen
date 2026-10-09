import {
  createDecodedImageLoader,
  decodedImageBudget,
  type ImagePriority,
} from './decoded-images.ts';
import { readCompressedAsset } from './compressed-assets.ts';
import { runtimeAssets } from './runtime-assets.ts';
import { observeAssetBackground } from './asset-background.ts';
import { retireSceneTexture } from '../rendering/texture-revision.ts';
import { trackPixelSource } from './pixel-memory.ts';

type Resource = { image: HTMLImageElement; width: number; height: number; close(): void };
type Pool = {
  loader: ReturnType<typeof createDecodedImageLoader<Resource>>;
  owners: number;
  stopScheduling(): void;
};
const pools = new WeakMap<Document, Pool>();
const dimensions = new Map<string, number>(
  runtimeAssets.map((asset) => [asset.url, asset.width * asset.height * 4]),
);

/** Thread-independent policy comes from the renderer's owning document. */
export function documentImageBudget(doc: Document): number {
  const navigator = doc.defaultView?.navigator as
    (Navigator & { deviceMemory?: number }) | undefined;
  return decodedImageBudget({
    mobile: /Android|iPhone|iPad/.test(navigator?.userAgent ?? ''),
    deviceMemory: navigator?.deviceMemory,
  });
}

/** Reclaim only unpinned cached images; live/preview leases remain authoritative. */
export function trimMainImages(doc: Document, bytesToRelease: number): number {
  const loader = pools.get(doc)?.loader;
  if (!loader || !(bytesToRelease > 0)) return 0;
  return loader.trim(Math.max(0, loader.snapshot().bytes - bytesToRelease));
}

/** Pending decode estimates are separate from pixels already visible in the registry. */
export function mainImageReservation(doc: Document): number {
  return pools.get(doc)?.loader.snapshot().reservedBytes ?? 0;
}

async function decode(doc: Document, url: string, signal: AbortSignal): Promise<Resource> {
  const response = await readCompressedAsset(url, signal);
  const blob = await response.blob();
  if (signal.aborted) throw new DOMException('Image decode aborted', 'AbortError');
  const objectUrl = URL.createObjectURL(blob);
  const image = trackPixelSource(doc, doc.createElement('img'), 'decoded');
  image.decoding = 'async';
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    retireSceneTexture(image);
    image.removeAttribute('src');
    URL.revokeObjectURL(objectUrl);
  };
  const abort = () => close();
  signal.addEventListener('abort', abort, { once: true });
  try {
    image.src = objectUrl;
    await image.decode();
    if (signal.aborted) throw new DOMException('Image decode aborted', 'AbortError');
    return { image, width: image.naturalWidth, height: image.naturalHeight, close };
  } catch (error) {
    close();
    throw error;
  } finally {
    signal.removeEventListener('abort', abort);
  }
}

/** Native HTML images retain browser decode semantics; only the shared pool clears them. */
export function createMainImageOwner(doc: Document) {
  let pool = pools.get(doc);
  if (!pool) {
    const loader = createDecodedImageLoader<Resource>({
      budget: documentImageBudget(doc),
      expectedBytes: (url) => dimensions.get(url),
      decode: (url, signal) => decode(doc, url, signal),
    });
    // Future/idle requests wait for a visible quiet frame; required artwork bypasses this.
    let hidden = doc.hidden,
      busy = true,
      overFrameBudget = false;
    loader.policy({ hidden, busy });
    const policy = (nextHidden: boolean, nextBusy: boolean, nextOverBudget: boolean) => {
      if (hidden === nextHidden && busy === nextBusy && overFrameBudget === nextOverBudget) return;
      hidden = nextHidden;
      busy = nextBusy;
      overFrameBudget = nextOverBudget;
      loader.policy({ hidden, busy, overFrameBudget });
    };
    const stop = observeAssetBackground((_stage, quiet, work, budget) => {
      policy(doc.hidden, !quiet || work > budget * 0.75, work > budget);
    });
    const visibility = () => policy(doc.hidden, true, overFrameBudget);
    doc.addEventListener('visibilitychange', visibility);
    pool = {
      owners: 0,
      loader,
      stopScheduling() {
        stop();
        doc.removeEventListener('visibilitychange', visibility);
      },
    };
    pools.set(doc, pool);
  }
  const shared = pool;
  shared.owners++;
  const releases = new Set<() => void>();
  let disposed = false;
  return {
    prefetch(urls: readonly string[]) {
      if (disposed || urls.some((url) => !dimensions.has(url))) return undefined;
      const preload = shared.loader.prefetch(urls);
      if (!preload) return undefined;
      const release = () => {
        preload.release();
        releases.delete(release);
      };
      releases.add(release);
      return { ready: preload.ready, release, active: preload.active };
    },
    acquire(url: string, priority: ImagePriority = 'now') {
      if (disposed) throw Error('Main image owner disposed');
      if (!dimensions.has(url)) throw Error(`Runtime image dimensions unavailable: ${url}`);
      const unpin = shared.loader.pin(url);
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        unpin();
        releases.delete(release);
      };
      releases.add(release);
      return {
        ready: shared.loader.load(url, priority).then((resource) => {
          if (released) throw new DOMException('Image lease released', 'AbortError');
          return resource.image;
        }),
        release,
      };
    },
    snapshot: shared.loader.snapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of releases) release();
      if (--shared.owners === 0) {
        shared.stopScheduling();
        shared.loader.dispose();
        pools.delete(doc);
      }
    },
  };
}
export type MainImageOwner = ReturnType<typeof createMainImageOwner>;
