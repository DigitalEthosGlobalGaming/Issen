export interface ArtworkProgress {
  loaded: number;
  total: number;
  failed: string[];
  pending: number;
}

/** Owns decoded images for the application lifetime; failed URLs alone are retried. */
export function createArtworkPreloader(
  urls: readonly string[],
  createImage: () => HTMLImageElement = () => new Image(),
  onProgress: (progress: ArtworkProgress) => void = () => {},
  priorityUrls: readonly string[] = [],
) {
  const sources = [...new Set(urls)];
  const retained = new Map<string, HTMLImageElement>();
  const failed = new Set<string>();
  const cancellations = new Set<() => void>();
  let disposed = false;
  let running: Promise<boolean> | null = null;
  let pending = 0;
  const report = () => {
    if (!disposed)
      onProgress({ loaded: retained.size, total: sources.length, failed: [...failed], pending });
  };
  function load(url: string): Promise<void> {
    return new Promise((resolve) => {
      const image = createImage();
      let settled = false;
      const finish = (success: boolean) => {
        if (settled) return;
        settled = true;
        image.onload = image.onerror = null;
        cancellations.delete(cancel);
        clearTimeout(timeout);
        pending--;
        if (!disposed) {
          if (success) retained.set(url, image);
          else failed.add(url);
          report();
        }
        resolve();
      };
      const cancel = () => {
        finish(false);
        image.removeAttribute('src');
      };
      const timeout = setTimeout(() => finish(false), 45_000);
      cancellations.add(cancel);
      image.decoding = 'async';
      image.onload = async () => {
        try {
          await image.decode();
          finish(image.naturalWidth > 0 && image.naturalHeight > 0);
        } catch {
          finish(false);
        }
      };
      image.onerror = () => finish(false);
      image.src = url;
    });
  }
  function run(): Promise<boolean> {
    if (disposed) return Promise.resolve(false);
    if (running) return running;
    const missing = sources.filter((url) => !retained.has(url));
    failed.clear();
    pending = missing.length;
    report();
    running = (async () => {
      const first = missing.filter((url) => priorityUrls.includes(url));
      await Promise.all(first.map(load));
      if (!disposed) await Promise.all(missing.filter((url) => !first.includes(url)).map(load));
      running = null;
      return !disposed && retained.size === sources.length;
    })();
    return running;
  }
  function dispose() {
    disposed = true;
    for (const cancel of [...cancellations]) cancel();
    retained.clear();
  }
  return { run, dispose };
}
