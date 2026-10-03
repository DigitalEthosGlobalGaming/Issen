export interface ActivityDriver {
  now(): number;
  request(callback: FrameRequestCallback): number;
  cancel(handle: number): void;
  timeout(callback: () => void, delay: number): number;
  clearTimeout(handle: number): void;
}

/** Presentation time excludes all time spent outside the foreground. */
export function createActivityScheduler(driver: ActivityDriver) {
  let active = true,
    suspendedAt = 0,
    excluded = 0,
    nextId = 0;
  const listeners = new Set<(active: boolean) => void>();
  const frames = new Map<number, { callback: FrameRequestCallback; handle?: number }>();
  const timers = new Map<number, { callback: () => void; due: number; handle?: number }>();
  const now = () => (active ? driver.now() : suspendedAt) - excluded;
  function scheduleFrame(id: number) {
    const frame = frames.get(id)!;
    frame.handle = driver.request(() => {
      delete frame.handle;
      if (!active) return;
      frames.delete(id);
      frame.callback(now());
    });
  }
  function scheduleTimer(id: number) {
    const timer = timers.get(id)!;
    timer.handle = driver.timeout(
      () => {
        delete timer.handle;
        if (!active) return;
        timers.delete(id);
        timer.callback();
      },
      Math.max(0, timer.due - now()),
    );
  }
  return {
    now,
    get active() {
      return active;
    },
    setActive(next: boolean) {
      if (active === next) return;
      if (next) excluded += driver.now() - suspendedAt;
      else suspendedAt = driver.now();
      active = next;
      for (const [id, frame] of frames) {
        if (next) scheduleFrame(id);
        else if (frame.handle !== undefined) {
          driver.cancel(frame.handle);
          delete frame.handle;
        }
      }
      for (const [id, timer] of timers) {
        if (next) scheduleTimer(id);
        else if (timer.handle !== undefined) {
          driver.clearTimeout(timer.handle);
          delete timer.handle;
        }
      }
      for (const listener of listeners) listener(next);
    },
    subscribe(listener: (active: boolean) => void) {
      listeners.add(listener);
      listener(active);
      return () => {
        listeners.delete(listener);
      };
    },
    request(callback: FrameRequestCallback) {
      const id = ++nextId;
      frames.set(id, { callback });
      if (active) scheduleFrame(id);
      return id;
    },
    cancel(id: number) {
      const frame = frames.get(id);
      if (frame?.handle !== undefined) driver.cancel(frame.handle);
      frames.delete(id);
    },
    timeout(callback: () => void, delay: number) {
      const id = ++nextId;
      timers.set(id, { callback, due: now() + delay });
      if (active) scheduleTimer(id);
      return id;
    },
    clearTimeout(id: number | undefined) {
      if (id === undefined) return;
      const timer = timers.get(id);
      if (timer?.handle !== undefined) driver.clearTimeout(timer.handle);
      timers.delete(id);
    },
  };
}

let browserActivity: ReturnType<typeof createActivityScheduler> | undefined;
function activity() {
  if (browserActivity) return browserActivity;
  const scheduler = createActivityScheduler({
    now: () => performance.now(),
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
    timeout: (callback, delay) => window.setTimeout(callback, delay),
    clearTimeout: (handle) => window.clearTimeout(handle),
  });
  browserActivity = scheduler;
  let focused = true;
  let animations: Animation[] = [];
  const sync = () => {
    const next = !document.hidden && focused;
    if (next === scheduler.active) return;
    document.documentElement.toggleAttribute('data-inactive', !next);
    if (!next) {
      animations = document
        .getAnimations()
        .filter((animation) => animation.playState === 'running');
      for (const animation of animations) animation.pause();
    } else {
      for (const animation of animations) if (animation.playState === 'paused') animation.play();
      animations = [];
    }
    scheduler.setActive(next);
  };
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) focused = document.hasFocus();
    sync();
  });
  window.addEventListener('blur', () => {
    focused = false;
    sync();
  });
  window.addEventListener('focus', () => {
    focused = true;
    sync();
  });
  window.addEventListener('pagehide', () => {
    focused = false;
    sync();
  });
  window.addEventListener('pageshow', () => {
    focused = document.hasFocus();
    sync();
  });
  sync();
  return scheduler;
}

export const activeNow = () => activity().now();
export const pageActive = () => activity().active;
export const onActivityChange = (callback: (active: boolean) => void) =>
  activity().subscribe(callback);
export const requestActiveFrame = (callback: FrameRequestCallback) => activity().request(callback);
export const cancelActiveFrame = (handle: number) => activity().cancel(handle);
export const activeTimeout = (callback: () => void, delay: number) =>
  activity().timeout(callback, delay);
export const clearActiveTimeout = (handle: number | undefined) => activity().clearTimeout(handle);
