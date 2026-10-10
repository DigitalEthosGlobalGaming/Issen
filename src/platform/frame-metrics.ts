export interface FrameMetrics {
  readonly active: boolean;
  readonly fps: number;
  readonly frameMs: number;
}

/** Delivered-render cadence, published twice a second without per-frame allocations. */
export function createFrameMetrics() {
  const snapshot = { active: false, fps: 0, frameMs: 0 };
  const listeners = new Set<() => void>();
  let elapsed = 0,
    count = 0;
  function publish() {
    for (const listener of listeners) listener();
  }
  return {
    get snapshot(): Readonly<FrameMetrics> {
      return snapshot;
    },
    sample(interval: number) {
      if (!Number.isFinite(interval) || interval <= 0 || interval > 1000) return;
      elapsed += interval;
      count++;
      if (elapsed < 500 || count < 2) return;
      snapshot.active = true;
      snapshot.frameMs = elapsed / count;
      snapshot.fps = 1000 / snapshot.frameMs;
      elapsed = count = 0;
      publish();
    },
    suspend() {
      elapsed = count = 0;
      if (!snapshot.active) return;
      snapshot.active = false;
      snapshot.fps = snapshot.frameMs = 0;
      publish();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
