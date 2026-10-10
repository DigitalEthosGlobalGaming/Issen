import type { FrameMetrics } from '../platform/frame-metrics.ts';

export function frameMetricsText(metrics: Readonly<FrameMetrics>) {
  return metrics.active
    ? `${Math.round(metrics.fps)} FPS · ${metrics.frameMs.toFixed(1)} ms`
    : 'Waiting for frames…';
}
