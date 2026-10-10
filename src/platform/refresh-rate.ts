/** Require a stable high-refresh sample; viewport/device type is not refresh evidence. */
export function supports120Hz(intervals: readonly number[]): boolean {
  if (intervals.length < 24 || intervals.some((ms) => !Number.isFinite(ms) || ms <= 0))
    return false;
  const sorted = [...intervals].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.75)]! <= 9;
}
/** Bounded, cancellable rAF observation; initially offer only rates known to be supported. */
export function createRefreshRateMonitor(doc: Document) {
  const win = doc.defaultView!;
  const intervals: number[] = [];
  let previous = 0,
    handle = 0,
    disposed = false,
    highRefresh = false,
    samples = 0;
  function sample(now: number) {
    handle = 0;
    if (disposed) return;
    if (doc.hidden) {
      previous = 0;
      samples = 0;
      intervals.length = 0;
    } else {
      if (previous && now > previous) intervals.push(now - previous);
      previous = now;
      if (++samples >= 48) {
        highRefresh = supports120Hz(intervals);
        doc.documentElement.dataset.supports120 = String(highRefresh);
        win.dispatchEvent(new Event('issen:refresh-rate'));
        return;
      }
    }
    handle = win.requestAnimationFrame(sample);
  }
  handle = win.requestAnimationFrame(sample);
  return {
    get supports120() {
      return highRefresh;
    },
    dispose() {
      disposed = true;
      if (handle) win.cancelAnimationFrame(handle);
    },
  };
}
