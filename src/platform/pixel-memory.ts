type Pixels = {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
};
type Kind = 'decoded' | 'canvas';
type GpuMemory = {
  readonly memorySnapshot: { sources: number; bytes: number; browserReserveBytes?: number };
  readonly admissionMemorySnapshot?: GpuMemory['memorySnapshot'];
};

export function rgbaMipBytes(width: number, height: number, mipmaps = false): number {
  if (!(width > 0 && height > 0)) return 0;
  let bytes = width * height * 4;
  if (mipmaps)
    while (width > 1 || height > 1) {
      width = Math.max(1, Math.floor(width / 2));
      height = Math.max(1, Math.floor(height / 2));
      bytes += width * height * 4;
    }
  return bytes;
}

/** Nominal RGBA backing sizes; weak observation never extends resource lifetime. */
export function createPixelMemory() {
  const seen = new WeakSet<Pixels>();
  type Entry = { source: WeakRef<Pixels>; kind: Kind; bytes: number };
  const sources = new Set<Entry>();
  const totals = { decodedBytes: 0, canvasBytes: 0, decoded: 0, canvases: 0 };
  function setBytes(entry: Entry, bytes: number) {
    const bytesKey = entry.kind === 'decoded' ? 'decodedBytes' : 'canvasBytes';
    const countKey = entry.kind === 'decoded' ? 'decoded' : 'canvases';
    totals[bytesKey] += bytes - entry.bytes;
    totals[countKey] += Number(bytes > 0) - Number(entry.bytes > 0);
    entry.bytes = bytes;
  }
  function refresh(entry: Entry) {
    const source = entry.source.deref();
    if (!source) {
      setBytes(entry, 0);
      sources.delete(entry);
      return;
    }
    const width = source.naturalWidth ?? source.width;
    const height = source.naturalHeight ?? source.height;
    setBytes(entry, width > 0 && height > 0 ? width * height * 4 : 0);
  }
  // Observe writes on owned sources, delegating native canvas setters unchanged.
  // Attribute writes and sources without configurable setters reconcile periodically.
  function observe(entry: Entry, source: Pixels) {
    for (const key of ['width', 'height', 'naturalWidth', 'naturalHeight'] as const) {
      let prototype: object | null = source,
        descriptor: PropertyDescriptor | undefined;
      while (prototype && !descriptor) {
        descriptor = Object.getOwnPropertyDescriptor(prototype, key);
        prototype = Object.getPrototypeOf(prototype);
      }
      if (
        !descriptor ||
        descriptor.configurable === false ||
        (!descriptor.set && !descriptor.writable)
      )
        continue;
      let value = descriptor.value;
      const original = descriptor;
      try {
        Object.defineProperty(source, key, {
          configurable: true,
          enumerable: original.enumerable,
          get() {
            return original.get ? original.get.call(this) : value;
          },
          set(next: number) {
            if (original.set) original.set.call(this, next);
            else value = next;
            refresh(entry);
          },
        });
      } catch {
        /* Exact reconciliation covers non-extensible browser objects. */
      }
    }
    if ('addEventListener' in source && typeof source.addEventListener === 'function') {
      const update = () => refresh(entry);
      source.addEventListener('load', update);
      source.addEventListener('error', update);
    }
  }
  const gpuSeen = new WeakSet<GpuMemory>();
  const gpuOwners = new Set<WeakRef<GpuMemory>>();
  return {
    trackGpu(owner: GpuMemory) {
      if (gpuSeen.has(owner)) return;
      gpuSeen.add(owner);
      gpuOwners.add(new WeakRef(owner));
    },
    track<T extends Pixels>(source: T, kind: Kind): T {
      if (!seen.has(source)) {
        seen.add(source);
        const entry = { source: new WeakRef(source), kind, bytes: 0 };
        sources.add(entry);
        observe(entry, source);
        refresh(entry);
      }
      return source;
    },
    snapshot(incremental = false) {
      if (!incremental) for (const entry of sources) refresh(entry);
      let gpuBytes = 0,
        gpuSources = 0,
        browserReserveBytes = 0;
      for (const entry of gpuOwners) {
        const owner = entry.deref();
        if (!owner) {
          gpuOwners.delete(entry);
          continue;
        }
        const gpu = incremental
          ? (owner.admissionMemorySnapshot ?? owner.memorySnapshot)
          : owner.memorySnapshot;
        gpuBytes += gpu.bytes;
        gpuSources += gpu.sources;
        browserReserveBytes += gpu.browserReserveBytes ?? 0;
      }
      return {
        ...totals,
        gpuBytes,
        gpuSources,
        browserReserveBytes,
      };
    },
  };
}

const documents = new WeakMap<Document, ReturnType<typeof createPixelMemory>>();
export function documentPixelMemory(doc: Document) {
  let memory = documents.get(doc);
  if (!memory) documents.set(doc, (memory = createPixelMemory()));
  return memory;
}
export function trackPixelSource<T extends Pixels>(doc: Document, source: T, kind: Kind): T {
  return documentPixelMemory(doc).track(source, kind);
}
