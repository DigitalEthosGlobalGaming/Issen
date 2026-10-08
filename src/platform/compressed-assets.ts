export const COMPRESSED_ASSET_CACHE = 'issen.assets.v1:' + (import.meta.env?.BASE_URL ?? '/');

/** Compressed responses are shared across main/worker realms; decoding stays separate. */
export function createCompressedAssetStore(
  options: {
    storage?: Pick<CacheStorage, 'open'>;
    fetch?: typeof fetch;
    cache?: boolean;
  } = {},
) {
  const fetchAsset = options.fetch ?? globalThis.fetch.bind(globalThis);
  const storage = options.cache === false ? undefined : (options.storage ?? globalThis.caches);
  let cache: Promise<Cache | null> | undefined;
  let hits = 0,
    network = 0,
    failures = 0;
  const open = () =>
    (cache ??= storage
      ? storage.open(COMPRESSED_ASSET_CACHE).catch(() => {
          failures++;
          return null;
        })
      : Promise.resolve(null));
  return {
    async read(url: string, signal?: AbortSignal, priority: RequestPriority = 'auto') {
      if (signal?.aborted) throw new DOMException('Asset request aborted', 'AbortError');
      const stored = await open();
      let response: Response | undefined;
      try {
        response = await stored?.match(url);
      } catch {
        failures++;
      }
      if (signal?.aborted) throw new DOMException('Asset request aborted', 'AbortError');
      if (response) {
        hits++;
        return response;
      }
      network++;
      response = await fetchAsset(url, { signal, priority });
      if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`);
      try {
        await stored?.put(url, response.clone());
      } catch {
        failures++;
      }
      return response;
    },
    async retainOnly(urls: readonly string[]) {
      const stored = await open();
      if (!stored) return;
      const keep = new Set(urls);
      try {
        for (const request of await stored.keys())
          if (!keep.has(request.url)) await stored.delete(request);
      } catch {
        failures++;
      }
    },
    snapshot: () => ({ hits, network, failures }),
  };
}

const shared = createCompressedAssetStore({ cache: import.meta.env?.MODE !== 'android' });
export const readCompressedAsset = shared.read;

/** Two background fetches, no image decode, and no newly scheduled work while paused. */
export function createAssetPrefetch(options: {
  urls: readonly string[];
  read(url: string, signal: AbortSignal, priority: RequestPriority): Promise<unknown>;
  concurrency?: number;
  yield?: () => Promise<void>;
  report?: (snapshot: {
    queued: number;
    active: number;
    completed: number;
    failed: number;
  }) => void;
}) {
  if (
    !Number.isInteger(options.concurrency ?? 2) ||
    (options.concurrency ?? 2) < 1 ||
    (options.concurrency ?? 2) > 4
  )
    throw RangeError('Prefetch concurrency must be between one and four');
  const queue = [...new Set(options.urls)],
    completed = new Set<string>(),
    failed = new Set<string>();
  const controller = new AbortController();
  let paused = true,
    disposed = false,
    active = 0;
  const snapshot = () => ({
    queued: queue.length,
    active,
    completed: completed.size,
    failed: failed.size,
  });
  const report = () => options.report?.(snapshot());
  const yieldTask = options.yield ?? (() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
  function pump() {
    if (paused || disposed) return;
    while (active < (options.concurrency ?? 2) && queue.length) {
      const url = queue.shift()!;
      active++;
      void (async () => {
        try {
          await options.read(url, controller.signal, 'low');
          completed.add(url);
        } catch {
          if (!disposed) failed.add(url);
        } finally {
          active--;
          if (!disposed) {
            report();
            await yieldTask();
            pump();
          }
        }
      })();
    }
    report();
  }
  return {
    prioritize(urls: readonly string[]) {
      const first = urls.filter((url) => queue.includes(url));
      const selected = new Set(first);
      queue.splice(
        0,
        queue.length,
        ...new Set(first),
        ...queue.filter((url) => !selected.has(url)),
      );
    },
    pause(value: boolean) {
      paused = value;
      if (!value) pump();
    },
    snapshot,
    dispose() {
      disposed = true;
      controller.abort();
      queue.length = 0;
    },
  };
}
