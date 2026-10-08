export type ImagePriority = 'now' | 'soon' | 'idle';
export type DecodedResource = { width: number; height: number; close(): void };
const rank: Record<ImagePriority, number> = { now: 0, soon: 1, idle: 2 };

/** One serial decode queue per thread; callers separately pin their live sources. */
export function createDecodedImageLoader<T extends DecodedResource>(options: {
  budget: number;
  decode(url: string, signal: AbortSignal): Promise<T>;
  expectedBytes?: (url: string) => number | undefined;
  yield?: () => Promise<void>;
}) {
  if (!Number.isFinite(options.budget) || options.budget <= 0)
    throw RangeError('Invalid decoded image budget');
  type Entry = {
    url: string;
    priority: ImagePriority;
    promise: Promise<T>;
    resolve(value: T): void;
    reject(error: unknown): void;
    resource?: T;
    bytes: number;
    touched: number;
  };
  const entries = new Map<string, Entry>();
  const pins = new Map<string, number>();
  const controller = new AbortController();
  let reservedBytes = 0;
  let bytes = 0,
    peakBytes = 0,
    evictions = 0,
    sequence = 0;
  let running = false,
    disposed = false,
    hidden = false,
    busy = false,
    overFrameBudget = false;
  const yieldTask = options.yield ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  function evict(entry: Entry) {
    entry.resource!.close();
    bytes -= entry.bytes;
    entries.delete(entry.url);
    evictions++;
  }
  function makeRoom(size: number) {
    for (const entry of [...entries.values()]
      .filter((entry) => entry.resource && !pins.has(entry.url))
      .sort((a, b) => a.touched - b.touched)) {
      if (bytes + size <= options.budget) break;
      evict(entry);
    }
    return bytes + size <= options.budget;
  }
  async function pump() {
    if (running || disposed) return;
    running = true;
    try {
      while (!disposed) {
        const entry = [...entries.values()]
          .filter(
            (entry) =>
              !entry.resource &&
              (entry.priority === 'now' || (!hidden && !busy && !overFrameBudget)),
          )
          .sort((a, b) => rank[a.priority] - rank[b.priority] || a.touched - b.touched)[0];
        if (!entry) break;
        try {
          const expected = options.expectedBytes?.(entry.url) ?? 0;
          if (expected > options.budget || (expected > 0 && !makeRoom(expected)))
            throw Error(`Decoded image budget exhausted: ${entry.url}`);
          reservedBytes = expected;
          peakBytes = Math.max(peakBytes, bytes + reservedBytes);
          const resource = await options.decode(entry.url, controller.signal);
          const size = resource.width * resource.height * 4;
          if (
            disposed ||
            !Number.isFinite(size) ||
            size <= 0 ||
            (expected && expected !== size) ||
            size > options.budget ||
            !makeRoom(size)
          ) {
            resource.close();
            throw Error(
              disposed
                ? 'Decoded image loader disposed'
                : expected && expected !== size
                  ? `Decoded image dimensions changed: ${entry.url}`
                  : `Decoded image budget exhausted: ${entry.url}`,
            );
          }
          entry.resource = resource;
          reservedBytes = 0;
          entry.bytes = size;
          entry.touched = ++sequence;
          bytes += size;
          peakBytes = Math.max(peakBytes, bytes);
          entry.resolve(resource);
        } catch (error) {
          reservedBytes = 0;
          entries.delete(entry.url);
          entry.reject(error);
        }
        if (!disposed) await yieldTask();
      }
    } finally {
      running = false;
    }
  }
  return {
    load(url: string, priority: ImagePriority = 'now'): Promise<T> {
      if (disposed) return Promise.reject(Error('Decoded image loader disposed'));
      let entry = entries.get(url);
      if (entry) {
        entry.touched = ++sequence;
        if (rank[priority] < rank[entry.priority]) entry.priority = priority;
      } else {
        let resolve!: (value: T) => void, reject!: (error: unknown) => void;
        const promise = new Promise<T>((yes, no) => {
          resolve = yes;
          reject = no;
        });
        entry = { url, priority, promise, resolve, reject, bytes: 0, touched: ++sequence };
        entries.set(url, entry);
      }
      void pump();
      return entry.promise;
    },
    pin(url: string) {
      if (disposed) return () => {};
      pins.set(url, (pins.get(url) ?? 0) + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        const count = pins.get(url) ?? 0;
        if (count <= 1) pins.delete(url);
        else pins.set(url, count - 1);
      };
    },
    policy(next: { hidden?: boolean; busy?: boolean; overFrameBudget?: boolean }) {
      hidden = next.hidden ?? hidden;
      busy = next.busy ?? busy;
      overFrameBudget = next.overFrameBudget ?? overFrameBudget;
      void pump();
    },
    snapshot() {
      return {
        queued: [...entries.values()].filter((entry) => !entry.resource).length,
        decoded: [...entries.values()].filter((entry) => entry.resource).length,
        pinned: [...entries.values()].filter((entry) => entry.resource && pins.has(entry.url))
          .length,
        pinnedBytes: [...entries.values()].reduce(
          (total, entry) => total + (entry.resource && pins.has(entry.url) ? entry.bytes : 0),
          0,
        ),
        bytes: bytes + reservedBytes,
        peakBytes,
        budget: options.budget,
        evictions,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      for (const entry of entries.values()) {
        if (entry.resource) entry.resource.close();
        else entry.reject(Error('Decoded image loader disposed'));
      }
      entries.clear();
      pins.clear();
      bytes = 0;
      reservedBytes = 0;
    },
  };
}

export function decodedImageBudget({
  mobile = false,
  lowQuality = false,
  deviceMemory = 8,
}: {
  mobile?: boolean;
  lowQuality?: boolean;
  deviceMemory?: number;
} = {}) {
  return (lowQuality || deviceMemory <= 2 ? 256 : mobile ? 384 : 512) * 1024 * 1024;
}
