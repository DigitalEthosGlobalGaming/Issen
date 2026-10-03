export interface FrameTiming {
  hitStop: number;
  slowT: number;
  timeScale: number;
}

export interface FrameScheduler {
  now(): number;
  request(callback: FrameRequestCallback): number;
  cancel(handle: number): void;
}

export interface FrameCallbacks {
  maxFps?(): number;
  paused(): boolean;
  update(delta: number, raw: number): void;
  render(raw: number): void;
  afterRender(): void;
  sampleFrame?(intervalMs: number, workMs: number): void;
}

/** Preserve real-time rendering while combat timing is slowed or paused. */
export function frameDelta(raw: number, timing: FrameTiming): number {
  let delta = raw;
  if (timing.hitStop > 0) {
    timing.hitStop -= raw;
    delta *= 0.06;
  }
  if (timing.slowT > 0) {
    timing.slowT -= raw;
    delta *= 0.5;
  }
  return delta * timing.timeScale;
}

export function createFrameLoop(
  timing: FrameTiming,
  callbacks: FrameCallbacks,
  scheduler: FrameScheduler = {
    now: () => performance.now(),
    request: (callback) => requestAnimationFrame(callback),
    cancel: (handle) => cancelAnimationFrame(handle),
  },
) {
  let last = scheduler.now();
  let handle: number | null = null;
  let running = false;
  let due = last;

  function frame(now: number): void {
    handle = null;
    if (!running) return;
    const interval = 1000 / (callbacks.maxFps?.() ?? Infinity);
    if (now + 0.1 < due) {
      handle = scheduler.request(frame);
      return;
    }
    due = Math.max(due + interval, now);
    const raw = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const workStart = scheduler.now();
    const delta = frameDelta(raw, timing);
    if (!callbacks.paused()) callbacks.update(delta, raw);
    callbacks.render(raw);
    callbacks.afterRender();
    callbacks.sampleFrame?.(raw * 1000, scheduler.now() - workStart);
    if (running) handle = scheduler.request(frame);
  }

  return {
    resetClock(): void {
      last = scheduler.now();
      due = last;
    },
    start(): void {
      if (running) return;
      running = true;
      last = scheduler.now();
      due = last;
      handle = scheduler.request(frame);
    },
    stop(): void {
      running = false;
      if (handle !== null) scheduler.cancel(handle);
      handle = null;
    },
  };
}
