/** Metrics shared by the opt-in scene probe and its synthetic trace tests. */
export function frameStats(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? null;
  const middle = sorted.length >> 1;
  return {
    count: sorted.length,
    median: sorted.length
      ? sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2
      : null,
    p95: percentile(0.95),
    p99: percentile(0.99),
    over8_3: sorted.filter((value) => value > 8.3).length,
    over16_7: sorted.filter((value) => value > 16.7).length,
  };
}

// Long Tasks only reports tasks >=50 ms. Trace RunTask events also expose 16–50 ms tasks.
export function tasksAfterPresentation(events, marker, durationMs = 2000) {
  const anchor = events.find(
    (event) => event.name === marker && event.cat?.includes('user_timing'),
  );
  if (!anchor) throw Error('Missing presentation trace anchor: ' + marker);
  const end = anchor.ts + durationMs * 1000;
  const tasks = events.filter(
    (event) =>
      /(?:^|::)RunTask$/.test(event.name) &&
      event.ph === 'X' &&
      event.pid === anchor.pid &&
      event.tid === anchor.tid &&
      event.ts < end &&
      event.ts + (event.dur ?? 0) > anchor.ts,
  );
  if (!tasks.length) throw Error('No main-thread task events in the presentation window');
  return {
    longestMs: tasks.length ? Math.max(...tasks.map((event) => event.dur / 1000)) : 0,
    over16Ms: tasks
      .filter((event) => event.dur > 16000)
      .map((event) => ({
        startMs: (event.ts - anchor.ts) / 1000,
        durationMs: event.dur / 1000,
      })),
    count: tasks.length,
  };
}
