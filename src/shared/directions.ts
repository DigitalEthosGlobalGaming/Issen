export const DIRS = ['up', 'down', 'left', 'right'] as const;
export type Direction = (typeof DIRS)[number];
export function directionMatches(
  actual: Direction,
  expected: Direction,
  axisOnly = false,
): boolean {
  return (
    actual === expected ||
    (axisOnly &&
      (actual === 'left' || actual === 'right') === (expected === 'left' || expected === 'right'))
  );
}
export const OPP: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};
export const DANG: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};
