export type ImagePriority = 'now' | 'soon' | 'idle';
export type DecodedResource = { width: number; height: number; close(): void };
const rank: Record<ImagePriority, number> = { now: 0, soon: 1, idle: 2 };

/** Priority decode queue; callers separately pin their live sources. */
export function createDecodedImageLoader<T extends DecodedResource>(options: {
  budget: number;
  decode(url: string, signal: AbortSignal): Promise<T>;
  expectedBytes?: (url: string) => number | undefined;
  yield?: () => Promise<void>;
  onMemoryChange?: () => void;
  concurrency?: number;
}) {
  if (!Number.isFinite(options.budget) || options.budget <= 0)
    throw RangeError('Invalid decoded image budget');
  let budget = options.budget;
  const concurrency = options.concurrency ?? 1;
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 4 ||
    (concurrency > 1 && !options.expectedBytes)
  )
    throw RangeError('Concurrent decoding requires known sizes and one to four slots');
  type Entry = {
    url: string;
    priority: ImagePriority;
    promise: Promise<T>;
    resolve(value: T): void;
    reject(error: unknown): void;
    resource?: T;
    bytes: number;
    reservedBytes: number;
    touched: number;
    queued: number;
    speculativeOnly: boolean;
    controller?: AbortController;
  };
  const entries = new Map<string, Entry>();
  const pins = new Map<string, number>();
  const preloads = new Set<() => void>();
  let reservedBytes = 0;
  let bytes = 0,
    peakBytes = 0,
    evictions = 0,
    sequence = 0;
  let running = 0;
  let disposed = false,
    hidden = false,
    busy = false,
    overFrameBudget = false;
  const yieldTask = options.yield ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  function pin(url: string) {
    if (disposed) return () => {};
    pins.set(url, (pins.get(url) ?? 0) + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const count = pins.get(url) ?? 0;
      if (count <= 1) pins.delete(url);
      else pins.set(url, count - 1);
      if (bytes + reservedBytes > budget) {
        const before = bytes;
        makeRoom(0);
        if (before !== bytes) options.onMemoryChange?.();
      }
    };
  }
  function cancelPreloads() {
    for (const release of preloads) release();
  }
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
      if (bytes + reservedBytes + size <= budget) break;
      evict(entry);
    }
    return bytes + reservedBytes + size <= budget;
  }
  async function pump() {
    if (running >= concurrency || disposed) return;
    running++;
    try {
      while (!disposed) {
        const entry = [...entries.values()]
          .filter(
            (entry) =>
              !entry.resource &&
              !entry.controller &&
              (entry.priority === 'now' || (!hidden && !busy && !overFrameBudget)),
          )
          .sort((a, b) => rank[a.priority] - rank[b.priority] || a.queued - b.queued)[0];
        if (!entry) break;
        let reservation = 0;
        let admittedBudget = budget;
        const unreserve = () => {
          reservedBytes = Math.max(0, reservedBytes - reservation);
          entry.reservedBytes = 0;
          reservation = 0;
        };
        try {
          const expected = options.expectedBytes?.(entry.url) ?? 0;
          if (concurrency > 1 && !(expected > 0 && Number.isFinite(expected)))
            throw Error(`Unknown decoded image size: ${entry.url}`);
          // Another pending decode can own the last free bytes. Wait for that
          // slot rather than failing a request which fits after it settles.
          if (expected <= budget && expected > 0 && !makeRoom(expected) && reservedBytes > 0) break;
          if (expected > budget || (expected > 0 && !makeRoom(expected)))
            throw Error(`Decoded image budget exhausted: ${entry.url}`);
          admittedBudget = budget;
          reservation = expected;
          reservedBytes += reservation;
          entry.reservedBytes = reservation;
          entry.controller = new AbortController();
          peakBytes = Math.max(peakBytes, bytes + reservedBytes);
          options.onMemoryChange?.();
          const pending = options.decode(entry.url, entry.controller.signal);
          void pump();
          const resource = await pending;
          unreserve();
          const size = resource.width * resource.height * 4;
          // A lower live budget cannot revoke required pixels already admitted
          // for a pinned consumer. Reclaim them when that consumer releases.
          const retainedAdmission =
            budget < admittedBudget && entry.priority === 'now' && pins.has(entry.url);
          if (
            disposed ||
            entry.controller.signal.aborted ||
            !Number.isFinite(size) ||
            size <= 0 ||
            (expected && expected !== size) ||
            (!retainedAdmission && size > budget) ||
            (!makeRoom(size) && !retainedAdmission)
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
          entry.bytes = size;
          if (!entry.speculativeOnly) entry.touched = ++sequence;
          bytes += size;
          peakBytes = Math.max(peakBytes, bytes + reservedBytes);
          options.onMemoryChange?.();
          entry.resolve(resource);
        } catch (error) {
          unreserve();
          options.onMemoryChange?.();
          if (entries.get(entry.url) === entry) entries.delete(entry.url);
          entry.reject(error);
        }
        if (!disposed) await yieldTask();
      }
    } finally {
      running--;
    }
  }
  function request(url: string, priority: ImagePriority = 'now', speculative = false): Promise<T> {
    if (disposed) return Promise.reject(Error('Decoded image loader disposed'));
    let entry = entries.get(url);
    if (entry) {
      // Queue priority is independent of residency age. Prediction is not use.
      if (!entry.resource) entry.queued = ++sequence;
      if (!speculative) {
        if (entry.resource && entry.speculativeOnly) {
          // Match a cold batch: fresh requests complete after its cached hits.
          // A microtask retains that ordering without another decode or task.
          const promoted = entry;
          queueMicrotask(() => {
            if (!disposed && entries.get(url) === promoted) promoted.touched = ++sequence;
          });
        } else entry.touched = ++sequence;
        entry.speculativeOnly = false;
      }
      if (rank[priority] < rank[entry.priority]) entry.priority = priority;
    } else {
      let resolve!: (value: T) => void, reject!: (error: unknown) => void;
      const promise = new Promise<T>((yes, no) => {
        resolve = yes;
        reject = no;
      });
      const queued = ++sequence;
      entry = {
        url,
        priority,
        promise,
        resolve,
        reject,
        bytes: 0,
        reservedBytes: 0,
        queued,
        touched: speculative ? 0 : queued,
        speculativeOnly: speculative,
      };
      entries.set(url, entry);
    }
    // A required consumer wins over speculation, including a shared queued URL.
    if (priority === 'now') cancelPreloads();
    void pump();
    return entry.promise;
  }
  return {
    /** Lowering a budget retires unused pixels, never the current frame's inputs. */
    setBudget(next: number) {
      if (!Number.isFinite(next) || next <= 0) throw RangeError('Invalid decoded image budget');
      if (disposed || next === budget) return;
      budget = next;
      cancelPreloads();
      makeRoom(0);
      options.onMemoryChange?.();
      void pump();
    },
    load: (url: string, priority: ImagePriority = 'now') => request(url, priority),
    /** Storage already accounted for by the pool, including active decodes. */
    bytesFor(urls: readonly string[]) {
      return [...new Set(urls)].reduce((total, url) => {
        const entry = entries.get(url);
        return total + (entry ? entry.bytes + entry.reservedBytes : 0);
      }, 0);
    },
    /** Cancel abandoned requests only after all consumers have released their pins. */
    cancelUnused(urls: readonly string[]) {
      for (const url of new Set(urls)) {
        const entry = entries.get(url);
        if (!entry || entry.resource || pins.has(url)) continue;
        entries.delete(url);
        entry.controller?.abort();
        entry.reject(new DOMException('Image request cancelled', 'AbortError'));
      }
    },
    pin,
    /** Explicit headroom reclamation never closes pinned pixels or pending required work. */
    trim(targetBytes = 0) {
      if (!Number.isFinite(targetBytes) || targetBytes < 0)
        throw RangeError('Invalid image trim target');
      const before = bytes;
      for (const entry of [...entries.values()]
        .filter((entry) => entry.resource && !pins.has(entry.url))
        .sort((a, b) => a.touched - b.touched)) {
        if (bytes <= targetBytes) break;
        evict(entry);
      }
      if (before !== bytes) options.onMemoryChange?.();
      return before - bytes;
    },
    /** Hold one admitted future image set without mutating renderer bindings. */
    prefetch(urls: readonly string[]) {
      if (disposed || hidden || busy || overFrameBudget) return undefined;
      const required = new Set([...pins.keys(), ...urls]);
      let mandatory = 0;
      for (const url of required) {
        const size = entries.get(url)?.bytes || options.expectedBytes?.(url);
        if (!size || !Number.isFinite(size) || size <= 0) return undefined;
        mandatory += size;
      }
      if (mandatory > budget) return undefined;
      const unique = [...new Set(urls)],
        releases = unique.map(pin);
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        preloads.delete(release);
        for (const unpin of releases) unpin();
        for (const url of unique) {
          const entry = entries.get(url);
          if (!entry || entry.resource || entry.priority === 'now' || pins.has(url)) continue;
          entries.delete(url);
          entry.controller?.abort();
          entry.reject(new DOMException('Image preload cancelled', 'AbortError'));
        }
      };
      preloads.add(release);
      const ready = Promise.all(unique.map((url) => request(url, 'soon', true))).then(
        () => !released,
        () => {
          release();
          return false;
        },
      );
      return { ready, release, active: () => !released };
    },
    policy(next: { hidden?: boolean; busy?: boolean; overFrameBudget?: boolean }) {
      hidden = next.hidden ?? hidden;
      busy = next.busy ?? busy;
      overFrameBudget = next.overFrameBudget ?? overFrameBudget;
      if (hidden || busy || overFrameBudget) cancelPreloads();
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
        reservedBytes,
        peakBytes,
        budget,
        evictions,
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelPreloads();
      for (const entry of entries.values()) {
        entry.controller?.abort();
        if (entry.resource) entry.resource.close();
        else entry.reject(Error('Decoded image loader disposed'));
      }
      entries.clear();
      pins.clear();
      bytes = 0;
      reservedBytes = 0;
      options.onMemoryChange?.();
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
