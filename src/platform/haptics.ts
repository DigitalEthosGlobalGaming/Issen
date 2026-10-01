export function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* Optional browser capability. */
  }
}
export function createHaptics(enabled: () => boolean) {
  return (pattern: number | number[]) => {
    if (enabled()) buzz(pattern);
  };
}
export type HapticEvent = 'slice' | 'parry' | 'damage';
const PATTERNS: Record<HapticEvent, number | number[]> = {
  slice: 45,
  parry: [16, 35, 16],
  damage: [70, 25, 45],
};
const PRIORITY = { slice: 1, parry: 2, damage: 3 };
export function createCombatHaptics(
  enabled: () => boolean,
  strength: () => 'light' | 'full',
  vibrate: (pattern: number | number[]) => void = buzz,
  now = () => performance.now(),
) {
  let until = 0,
    priority = 0;
  return {
    play(event: HapticEvent) {
      const time = now();
      if (!enabled() || (time < until && PRIORITY[event] <= priority)) return;
      const source = PATTERNS[event];
      const scale = strength() === 'light' ? 0.45 : 1;
      const pattern =
        typeof source === 'number'
          ? Math.round(source * scale)
          : source.map((n, i) => (i % 2 ? n : Math.round(n * scale)));
      vibrate(pattern);
      priority = PRIORITY[event];
      until = time + (typeof pattern === 'number' ? pattern : pattern.reduce((a, b) => a + b, 0));
    },
    stop() {
      until = 0;
      priority = 0;
      vibrate(0);
    },
  };
}
