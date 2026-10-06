// Injected only into opt-in performance builds; usable in DOM and worker realms.
export function initResourceProbe() {
  const realm = globalThis;
  if (realm.__resourceProbe) return realm.__resourceProbe;
  const coldWorker =
    !realm.document &&
    realm.location &&
    new URLSearchParams(realm.location.search).get('httpCache') === 'disabled';
  if (coldWorker && realm.fetch) {
    const nativeFetch = realm.fetch;
    realm.fetch = function (input, options) {
      return nativeFetch.call(this, input, { ...options, cache: 'no-store' });
    };
  }
  const bitmaps = new WeakMap(),
    bitmapRecords = [],
    canvases = [];
  const totals = {
    bitmapCreated: 0,
    bitmapReceived: 0,
    bitmapClosed: 0,
    bitmapTransferred: 0,
    createdBitmapPixels: 0,
    receivedBitmapPixels: 0,
    closedBitmapPixels: 0,
    transferredBitmapPixels: 0,
    blobDecodeCalls: 0,
    blobDecodeElapsedMs: 0,
  };
  function bitmap(value, kind = 'created') {
    if (!realm.ImageBitmap || !(value instanceof realm.ImageBitmap) || bitmaps.has(value)) return;
    const record = { ref: new WeakRef(value), pixels: value.width * value.height, state: 'active' };
    bitmaps.set(value, record);
    bitmapRecords.push(record);
    totals[kind === 'received' ? 'bitmapReceived' : 'bitmapCreated']++;
    totals[kind === 'received' ? 'receivedBitmapPixels' : 'createdBitmapPixels'] += record.pixels;
  }
  function receive(value, seen = new Set()) {
    if (!value || typeof value !== 'object' || seen.has(value)) return;
    seen.add(value);
    if (realm.ImageBitmap && value instanceof realm.ImageBitmap) {
      bitmap(value, 'received');
      return;
    }
    if (Array.isArray(value)) value.forEach((entry) => receive(entry, seen));
    else if (
      Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null
    )
      Object.values(value).forEach((entry) => receive(entry, seen));
  }
  function transferred(list) {
    for (const value of list ?? []) {
      const record = bitmaps.get(value);
      if (!record || record.state !== 'active') continue;
      record.state = 'transferred';
      totals.bitmapTransferred++;
      totals.transferredBitmapPixels += record.pixels;
    }
  }
  if (realm.createImageBitmap) {
    const native = realm.createImageBitmap;
    realm.createImageBitmap = function (...args) {
      const decoding = typeof realm.Blob === 'function' && args[0] instanceof realm.Blob;
      const started = decoding ? performance.now() : 0;
      return native.apply(this, args).then((value) => {
        if (decoding) {
          totals.blobDecodeCalls++;
          totals.blobDecodeElapsedMs += performance.now() - started;
        }
        bitmap(value);
        return value;
      });
    };
  }
  if (realm.ImageBitmap) {
    const native = realm.ImageBitmap.prototype.close;
    realm.ImageBitmap.prototype.close = function (...args) {
      const result = native.apply(this, args),
        record = bitmaps.get(this);
      if (record && record.state !== 'closed') {
        record.state = 'closed';
        totals.bitmapClosed++;
        totals.closedBitmapPixels += record.pixels;
      }
      return result;
    };
  }
  if (realm.OffscreenCanvas) {
    const native = realm.OffscreenCanvas;
    realm.OffscreenCanvas = new Proxy(native, {
      construct(target, args, constructor) {
        const canvas = Reflect.construct(target, args, constructor);
        canvases.push(new WeakRef(canvas));
        return canvas;
      },
    });
    const transfer = native.prototype.transferToImageBitmap;
    native.prototype.transferToImageBitmap = function (...args) {
      const result = transfer.apply(this, args);
      bitmap(result);
      return result;
    };
  }
  function snapshot() {
    const active = bitmapRecords.filter((record) => {
      const value = record.ref.deref();
      return value && value.width && value.height && record.state === 'active';
    });
    const liveCanvases = canvases.map((ref) => ref.deref()).filter(Boolean);
    return {
      ...totals,
      fetchCachePolicy: coldWorker ? 'worker-no-store' : 'realm-default',
      activeBitmapObjects: active.length,
      activeBitmapPixels: active.reduce((sum, record) => sum + record.pixels, 0),
      offscreenCanvasObjects: liveCanvases.length,
      offscreenCanvasPixels: liveCanvases.reduce(
        (sum, canvas) => sum + canvas.width * canvas.height,
        0,
      ),
    };
  }
  const probe = (realm.__resourceProbe = { snapshot, receive, transferred });
  if (!realm.document && realm.postMessage) {
    const native = realm.postMessage;
    realm.postMessage = function (...args) {
      const result = native.apply(this, args);
      transferred(Array.isArray(args[1]) ? args[1] : args[1]?.transfer);
      return result;
    };
    realm.addEventListener('message', (event) => receive(event.data));
  }
  return probe;
}
