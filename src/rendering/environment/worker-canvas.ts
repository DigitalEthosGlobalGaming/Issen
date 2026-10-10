import { createDecodedImageLoader, decodedImageBudget } from '../../platform/decoded-images.ts';
import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import { readCompressedAsset } from '../../platform/compressed-assets.ts';
import { createPixelMemory } from '../../platform/pixel-memory.ts';
import { workerDecodeSize } from './decode-size.ts';

/** Cache native bindings; only image consumers need decoded-source adaptation. */
export function createWorkerContextProxy(
  native: OffscreenCanvasRenderingContext2D,
  unwrap: (source: unknown) => unknown,
  sourceSize?: (source: unknown) => { width: number; height: number } | undefined,
): OffscreenCanvasRenderingContext2D {
  const methods = new Map<PropertyKey, (...args: unknown[]) => unknown>();
  return new Proxy(native, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      let method = methods.get(property);
      if (!method) {
        method =
          property === 'drawImage' || property === 'createPattern'
            ? (...args: unknown[]) => {
                const source = unwrap(args[0]);
                const nominal = sourceSize?.(args[0]);
                const bitmap = source as { width: number; height: number } | undefined;
                const scaled =
                  nominal &&
                  bitmap &&
                  (nominal.width !== bitmap.width || nominal.height !== bitmap.height);
                const adapted = [source, ...args.slice(1)];
                if (scaled && property === 'drawImage') {
                  if (args.length === 3) adapted.push(nominal.width, nominal.height);
                  else if (args.length === 9) {
                    for (const index of [1, 3])
                      adapted[index] = (Number(args[index]) * bitmap.width) / nominal.width;
                    for (const index of [2, 4])
                      adapted[index] = (Number(args[index]) * bitmap.height) / nominal.height;
                  }
                }
                const result = Reflect.apply(value, target, adapted);
                if (scaled && property === 'createPattern' && result)
                  (result as CanvasPattern).setTransform(
                    new DOMMatrix().scale(
                      nominal.width / bitmap.width,
                      nominal.height / bitmap.height,
                    ),
                  );
                return result;
              }
            : value.bind(target);
        methods.set(property, method!);
      }
      return method;
    },
    set(target, property, value) {
      return Reflect.set(target, property, value, target);
    },
  });
}

/** Adapt the existing owned Canvas composition vocabulary to a worker realm. */
export function createWorkerDocument(
  decodedBudget?: number,
  decodedSizeBudget?: number,
): Document & {
  readonly imageRasterBudget: number;
  setDecodedBudget(budget: number): void;
  prefetchImages(
    urls: readonly string[],
  ): ReturnType<ReturnType<typeof createDecodedImageLoader<ImageBitmap>>['prefetch']>;
  stopImagePreload(): void;
  decodedSnapshot(): ReturnType<
    ReturnType<typeof createDecodedImageLoader<ImageBitmap>>['snapshot']
  > & { images: number };
  canvasSnapshot(): { canvasBytes: number; canvases: number };
  releaseUnusedImages(targetBytes?: number, keep?: readonly string[]): number;
  observeMemory(listener: () => void): () => void;
} {
  const memory = createPixelMemory();
  const memoryListeners = new Set<() => void>();
  const dimensions = new Map(
    assetMaterialCatalog.flatMap((pack) =>
      [pack.source, ...Object.values(pack.maps)].map((url) => [url, pack.dimensions] as const),
    ),
  );
  const budget =
    decodedSizeBudget ??
    decodedBudget ??
    decodedImageBudget({
      mobile: typeof navigator !== 'undefined' && /Android|iPhone|iPad/.test(navigator.userAgent),
      deviceMemory:
        typeof navigator === 'undefined'
          ? 8
          : (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    });
  const loader = createDecodedImageLoader({
    concurrency: 2,
    onMemoryChange: () => {
      for (const listener of memoryListeners) listener();
    },
    expectedBytes: (url) => {
      const size = dimensions.get(url);
      if (!size) return;
      const decoded = workerDecodeSize(...size, budget);
      return decoded.width * decoded.height * 4;
    },
    budget: decodedBudget ?? budget,
    async decode(url, signal) {
      const response = await readCompressedAsset(url, signal);
      const size = dimensions.get(url);
      const decoded = size && workerDecodeSize(...size, budget);
      return createImageBitmap(
        await response.blob(),
        decoded && size && (decoded.width !== size[0] || decoded.height !== size[1])
          ? {
              resizeWidth: decoded.width,
              resizeHeight: decoded.height,
              resizeQuality: 'high',
            }
          : undefined,
      );
    },
  });
  class DecodedImage {
    bitmap?: ImageBitmap;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    complete = false;
    decoding = 'async';
    width = 0;
    height = 0;
    private source = '';
    private releasePin?: () => void;
    private controller?: AbortController;
    private pending: Promise<void> = Promise.resolve();
    get naturalWidth() {
      return this.bitmap ? this.width : 0;
    }
    get naturalHeight() {
      return this.bitmap ? this.height : 0;
    }
    get src() {
      return this.source;
    }
    set src(value: string) {
      this.clear();
      this.source = value;
      if (!value) return;
      const controller = new AbortController();
      this.controller = controller;
      this.releasePin = loader.pin(value);
      this.pending = (async () => {
        try {
          const bitmap = await loader.load(value, 'now');
          if (controller.signal.aborted) {
            return;
          }
          this.bitmap = bitmap;
          const nominal = dimensions.get(value);
          this.width = nominal?.[0] ?? bitmap.width;
          this.height = nominal?.[1] ?? bitmap.height;
          this.complete = true;
          this.onload?.();
        } catch (error) {
          if (!controller.signal.aborted) {
            this.complete = true;
            this.onerror?.();
          }
          throw error;
        }
      })();
      // Sprite loaders use onerror; map loaders await decode. Both settle cleanly.
      void this.pending.catch(() => {});
    }
    decode() {
      return this.pending;
    }
    private clear() {
      this.controller?.abort();
      this.releasePin?.();
      this.releasePin = undefined;
      this.bitmap = undefined;
      this.complete = false;
      this.width = this.height = 0;
    }
    removeAttribute(name: string) {
      if (name === 'src') {
        this.clear();
        this.source = '';
      }
    }
  }
  const contexts = new WeakMap<
    OffscreenCanvasRenderingContext2D,
    OffscreenCanvasRenderingContext2D
  >();
  const unwrap = (value: unknown) => (value instanceof DecodedImage ? value.bitmap : value);
  const doc = {
    observeMemory(listener: () => void) {
      memoryListeners.add(listener);
      return () => {
        memoryListeners.delete(listener);
      };
    },
    releaseUnusedImages(targetBytes = 0, keep: readonly string[] = []) {
      const pins = keep.map((url) => loader.pin(url));
      try {
        return loader.trim(targetBytes);
      } finally {
        for (const release of pins) release();
      }
    },
    canvasSnapshot() {
      const { canvasBytes, canvases } = memory.snapshot();
      return { canvasBytes, canvases };
    },
    prefetchImages(urls: readonly string[]) {
      loader.policy({ busy: false });
      return loader.prefetch(urls);
    },
    stopImagePreload() {
      loader.policy({ busy: true });
    },
    decodedSnapshot() {
      const snapshot = loader.snapshot();
      return { ...snapshot, images: snapshot.decoded };
    },
    imageRasterBudget: budget,
    setDecodedBudget: loader.setBudget,
    createElement(kind: string) {
      if (kind === 'img') return new DecodedImage();
      if (kind !== 'canvas') throw Error(`Unsupported worker element: ${kind}`);
      const canvas = memory.track(new OffscreenCanvas(1, 1), 'canvas');
      Object.defineProperty(canvas, 'ownerDocument', { value: doc });
      const getContext = canvas.getContext.bind(canvas);
      Object.defineProperty(canvas, 'getContext', {
        value(type: '2d', options?: CanvasRenderingContext2DSettings) {
          const native = getContext(type, options);
          if (!native) return null;
          let proxy = contexts.get(native);
          if (!proxy) {
            proxy = createWorkerContextProxy(native, unwrap, (source) =>
              source instanceof DecodedImage ? source : undefined,
            );
            contexts.set(native, proxy);
          }
          return proxy;
        },
      });
      return canvas;
    },
  };
  Object.defineProperties(globalThis, {
    document: { value: doc },
    HTMLImageElement: { value: DecodedImage },
    HTMLCanvasElement: { value: OffscreenCanvas },
  });
  return doc as unknown as Document & {
    readonly imageRasterBudget: number;
    setDecodedBudget: typeof loader.setBudget;
    prefetchImages: typeof doc.prefetchImages;
    stopImagePreload: typeof doc.stopImagePreload;
    decodedSnapshot(): ReturnType<typeof loader.snapshot> & { images: number };
    canvasSnapshot: typeof doc.canvasSnapshot;
    releaseUnusedImages: typeof doc.releaseUnusedImages;
    observeMemory: typeof doc.observeMemory;
  };
}
