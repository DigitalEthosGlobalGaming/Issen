import type { Direction } from '../../shared/directions.ts';

export interface GuidedLessonProgress {
  order: boolean;
  bossParry: boolean;
}
export type GuidedPhase = 'idle' | 'order-practice' | 'boss-wait' | 'boss-ready';

export function parseGuidedLessons(value: unknown): GuidedLessonProgress {
  const saved =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return { order: saved.order === true, bossParry: saved.bossParry === true };
}

/** Deterministic first-encounter state; only successful practice persists. */
export function createGuidedLessonState(
  saved: unknown,
  persist: (value: GuidedLessonProgress) => void,
  changed: (phase: GuidedPhase, frozen: boolean) => void = () => {},
) {
  const progress = parseGuidedLessons(saved);
  let phase: GuidedPhase = 'idle';
  const frozen = () => phase === 'order-practice' || phase === 'boss-ready';
  function change(next: GuidedPhase) {
    if (next === phase) return;
    phase = next;
    changed(phase, frozen());
  }
  function complete(id: keyof GuidedLessonProgress) {
    progress[id] = true;
    persist({ ...progress });
    change('idle');
  }
  return {
    get phase() {
      return phase;
    },
    get frozen() {
      return frozen();
    },
    get progress() {
      return { ...progress };
    },
    startOrder() {
      if (phase !== 'idle' || progress.order) return false;
      change('order-practice');
      return true;
    },
    startBoss() {
      if (phase !== 'idle' || progress.bossParry) return false;
      change('boss-wait');
      return true;
    },
    bossFlash() {
      if (phase === 'boss-wait') change('boss-ready');
    },
    swipe(direction: Direction, expected: Direction | null) {
      if (phase === 'boss-wait' || phase === 'boss-ready') return { consumed: true, retry: false };
      if (phase !== 'order-practice') return { consumed: false, retry: false };
      return { consumed: expected !== direction, retry: expected !== direction };
    },
    orderSucceeded() {
      if (phase === 'order-practice') complete('order');
    },
    tap() {
      return phase !== 'idle' && phase !== 'boss-ready';
    },
    bossParried() {
      if (phase === 'boss-ready') complete('bossParry');
    },
    reset() {
      change('idle');
    },
  };
}
