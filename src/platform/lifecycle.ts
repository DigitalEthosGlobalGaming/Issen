/** Own browser resources for one application instance. Disposal is idempotent. */
export function createLifecycle() {
  const controller = new AbortController();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const cleanups: (() => void)[] = [];
  let disposed = false;
  return {
    get disposed() {
      return disposed;
    },
    listen<K extends keyof DocumentEventMap>(
      target: EventTarget,
      type: K,
      listener: (event: DocumentEventMap[K]) => void,
    ): void {
      target.addEventListener(type, listener as EventListener, { signal: controller.signal });
    },
    timeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!disposed) callback();
      }, delay);
      if (disposed) clearTimeout(timer);
      else timers.add(timer);
      return timer;
    },
    clearTimeout(timer: ReturnType<typeof setTimeout>): void {
      clearTimeout(timer);
      timers.delete(timer);
    },
    add(cleanup: () => void): void {
      if (disposed) cleanup();
      else cleanups.push(cleanup);
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      controller.abort();
      for (const timer of timers) clearTimeout(timer);
      timers.clear();
      for (const cleanup of cleanups.reverse()) cleanup();
      cleanups.length = 0;
    },
  };
}
