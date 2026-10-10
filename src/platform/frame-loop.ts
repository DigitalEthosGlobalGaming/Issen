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

export interface FrameDemand {
  update: boolean;
  render: boolean;
  afterRender: boolean;
}

export interface FrameCallbacks {
  maxFps?(): number;
  /** Optional independent simulation cadence; omitted preserves coupled scheduling. */
  maxUpdateFps?(): number;
  clockReset?(): void;
  demand?(): FrameDemand;
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
  let lastUpdate = last;
  let updateDue = last;
  let previousInterval = NaN;

  function frame(now: number): void {
    handle = null;
    if (!running) return;
    const interval = 1000 / (callbacks.maxFps?.() ?? Infinity);
    const updateInterval = callbacks.maxUpdateFps ? 1000 / callbacks.maxUpdateFps() : interval;
    // Returning to the simulation rate must retain its phase, not the last extra render's.
    if (callbacks.maxUpdateFps && interval > previousInterval && interval === updateInterval)
      due = updateDue;
    previousInterval = interval;
    const renderDue = now + 0.1 >= due;
    const updateReady = now + 0.1 >= updateDue;
    if (!renderDue && !updateReady) {
      handle = scheduler.request(frame);
      return;
    }
    if (renderDue) due = Math.max(due + interval, now);
    const deliveredMs = Math.max(0, now - last);
    const raw = Math.min(0.05, deliveredMs / 1000);
    if (renderDue) last = now;
    const workStart = scheduler.now();
    const demand = callbacks.demand?.();
    if (updateReady) {
      const updateRaw = Math.min(0.05, Math.max(0, (now - lastUpdate) / 1000));
      updateDue = Math.max(updateDue + updateInterval, now);
      lastUpdate = now;
      if (!demand || demand.update) {
        const delta = frameDelta(updateRaw, timing);
        if (!callbacks.paused()) callbacks.update(delta, updateRaw);
      }
    }
    if (renderDue && (!demand || demand.render)) callbacks.render(raw);
    if (renderDue && (!demand || demand.afterRender)) callbacks.afterRender();
    if (renderDue && (!demand || demand.render))
      callbacks.sampleFrame?.(deliveredMs, scheduler.now() - workStart);
    if (running) handle = scheduler.request(frame);
  }

  return {
    resetClock(): void {
      last = scheduler.now();
      due = last;
      lastUpdate = updateDue = last;
      callbacks.clockReset?.();
    },
    start(): void {
      if (running) return;
      running = true;
      last = scheduler.now();
      due = last;
      lastUpdate = updateDue = last;
      callbacks.clockReset?.();
      handle = scheduler.request(frame);
    },
    stop(): void {
      running = false;
      if (handle !== null) scheduler.cancel(handle);
      handle = null;
      callbacks.clockReset?.();
    },
  };
}
