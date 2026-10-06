/** Adapt the existing owned Canvas composition vocabulary to a worker realm. */
export function createWorkerDocument(): Document {
  class DecodedImage {
    bitmap?: ImageBitmap;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    complete = false;
    decoding = 'async';
    width = 0;
    height = 0;
    private source = '';
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
      this.pending = (async () => {
        try {
          const response = await fetch(value, { signal: controller.signal });
          if (!response.ok) throw Error(`HTTP ${response.status}: ${value}`);
          const decoded = await createImageBitmap(await response.blob());
          let bitmap: ImageBitmap;
          const raster = new OffscreenCanvas(decoded.width, decoded.height);
          try {
            const ctx = raster.getContext('2d');
            if (!ctx) throw Error('Unable to rasterize worker page');
            ctx.drawImage(decoded, 0, 0);
            bitmap = raster.transferToImageBitmap();
          } finally {
            decoded.close();
            raster.width = raster.height = 0;
          }
          if (controller.signal.aborted) {
            bitmap.close();
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
      this.bitmap?.close();
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
            proxy = new Proxy(native, {
              get(target, property) {
                const value = Reflect.get(target, property, target);
                if (typeof value !== 'function') return value;
                return (...args: unknown[]) =>
                  Reflect.apply(
                    value,
                    target,
                    property === 'drawImage' || property === 'createPattern'
                      ? [unwrap(args[0]), ...args.slice(1)]
                      : args,
                  );
              },
              set(target, property, value) {
                return Reflect.set(target, property, value, target);
              },
            });
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
  return doc as unknown as Document;
}
