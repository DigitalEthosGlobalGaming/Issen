import { createDecodedImageLoader, decodedImageBudget } from '../../platform/decoded-images.ts';
import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import { readCompressedAsset } from '../../platform/compressed-assets.ts';

/** Cache native bindings; only image consumers need decoded-source adaptation. */
export function createWorkerContextProxy(
  native: OffscreenCanvasRenderingContext2D,
  unwrap: (source: unknown) => unknown,
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
            ? (...args: unknown[]) =>
                Reflect.apply(value, target, [unwrap(args[0]), ...args.slice(1)])
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
export function createWorkerDocument(decodedBudget?: number): Document & {
  prefetchImages(
    urls: readonly string[],
  ): ReturnType<ReturnType<typeof createDecodedImageLoader<ImageBitmap>>['prefetch']>;
  stopImagePreload(): void;
  decodedSnapshot(): ReturnType<
    ReturnType<typeof createDecodedImageLoader<ImageBitmap>>['snapshot']
  > & { images: number };
} {
  const expectedBytes = new Map(
    assetMaterialCatalog.flatMap((pack) =>
      [pack.source, ...Object.values(pack.maps)].map(
        (url) => [url, pack.dimensions[0] * pack.dimensions[1] * 4] as const,
      ),
    ),
  );
  const loader = createDecodedImageLoader({
    expectedBytes: (url) => expectedBytes.get(url),
    budget:
      decodedBudget ??
      decodedImageBudget({
        mobile: typeof navigator !== 'undefined' && /Android|iPhone|iPad/.test(navigator.userAgent),
        deviceMemory:
          typeof navigator === 'undefined'
            ? 8
            : (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
      }),
    async decode(url, signal) {
      const response = await readCompressedAsset(url, signal);
      // Preserve the existing worker decode interpretation. Data-map options
      // must change only after the complete material-plane parity check.
      return createImageBitmap(await response.blob());
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
      return this.bitmap?.width ?? 0;
    }
    get naturalHeight() {
      return this.bitmap?.height ?? 0;
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
          this.width = bitmap.width;
          this.height = bitmap.height;
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
    createElement(kind: string) {
      if (kind === 'img') return new DecodedImage();
      if (kind !== 'canvas') throw Error(`Unsupported worker element: ${kind}`);
      const canvas = new OffscreenCanvas(1, 1);
      Object.defineProperty(canvas, 'ownerDocument', { value: doc });
      const getContext = canvas.getContext.bind(canvas);
      Object.defineProperty(canvas, 'getContext', {
        value(type: '2d', options?: CanvasRenderingContext2DSettings) {
          const native = getContext(type, options);
          if (!native) return null;
          let proxy = contexts.get(native);
          if (!proxy) {
            proxy = createWorkerContextProxy(native, unwrap);
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
    prefetchImages: typeof doc.prefetchImages;
    stopImagePreload: typeof doc.stopImagePreload;
    decodedSnapshot(): ReturnType<typeof loader.snapshot> & { images: number };
  };
}
