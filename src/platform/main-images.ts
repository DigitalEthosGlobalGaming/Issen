import {
  createDecodedImageLoader,
  decodedImageBudget,
  type ImagePriority,
} from './decoded-images.ts';
import { readCompressedAsset } from './compressed-assets.ts';
import { runtimeAssets } from './runtime-assets.ts';

type Resource = { image: HTMLImageElement; width: number; height: number; close(): void };
type Pool = { loader: ReturnType<typeof createDecodedImageLoader<Resource>>; owners: number };
const pools = new WeakMap<Document, Pool>();
const dimensions = new Map<string, number>(
  runtimeAssets.map((asset) => [asset.url, asset.width * asset.height * 4]),
);

async function decode(doc: Document, url: string, signal: AbortSignal): Promise<Resource> {
  const response = await readCompressedAsset(url, signal);
  const blob = await response.blob();
  if (signal.aborted) throw new DOMException('Image decode aborted', 'AbortError');
  const objectUrl = URL.createObjectURL(blob);
  const image = doc.createElement('img');
  image.decoding = 'async';
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
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
    const navigator = doc.defaultView?.navigator as
      (Navigator & { deviceMemory?: number }) | undefined;
    pool = {
      owners: 0,
      loader: createDecodedImageLoader<Resource>({
        budget: decodedImageBudget({
          mobile: /Android|iPhone|iPad/.test(navigator?.userAgent ?? ''),
          deviceMemory: navigator?.deviceMemory,
        }),
        expectedBytes: (url) => dimensions.get(url),
        decode: (url, signal) => decode(doc, url, signal),
      }),
    };
    pools.set(doc, pool);
  }
  const shared = pool;
  shared.owners++;
  const releases = new Set<() => void>();
  let disposed = false;
  return {
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
    policy: shared.loader.policy,
    snapshot: shared.loader.snapshot,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const release of releases) release();
      if (--shared.owners === 0) {
        shared.loader.dispose();
        pools.delete(doc);
      }
    },
  };
}
export type MainImageOwner = ReturnType<typeof createMainImageOwner>;
