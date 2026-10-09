type Pixels = {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
};
type Kind = 'decoded' | 'canvas';
type GpuMemory = {
  readonly memorySnapshot: { sources: number; bytes: number; browserReserveBytes?: number };
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
  const sources = new Set<{ source: WeakRef<Pixels>; kind: Kind }>();
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
        sources.add({ source: new WeakRef(source), kind });
      }
      return source;
    },
    snapshot() {
      let decodedBytes = 0,
        canvasBytes = 0,
        decoded = 0,
        canvases = 0;
      for (const entry of sources) {
        const source = entry.source.deref();
        if (!source) {
          sources.delete(entry);
          continue;
        }
        const width = source.naturalWidth ?? source.width;
        const height = source.naturalHeight ?? source.height;
        if (!(width > 0 && height > 0)) continue;
        const bytes = width * height * 4;
        if (entry.kind === 'decoded') {
          decodedBytes += bytes;
          decoded++;
        } else {
          canvasBytes += bytes;
          canvases++;
        }
      }
      let gpuBytes = 0,
        gpuSources = 0,
        browserReserveBytes = 0;
      for (const entry of gpuOwners) {
        const owner = entry.deref();
        if (!owner) {
          gpuOwners.delete(entry);
          continue;
        }
        const gpu = owner.memorySnapshot;
        gpuBytes += gpu.bytes;
        gpuSources += gpu.sources;
        browserReserveBytes += gpu.browserReserveBytes ?? 0;
      }
      return {
        decodedBytes,
        canvasBytes,
        decoded,
        canvases,
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
