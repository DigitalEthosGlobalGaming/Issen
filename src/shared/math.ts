export const TAU = Math.PI * 2;
export const clamp = (value: number, min = 0, max = 1): number =>
  value < min ? min : value > max ? max : value;
export const lerp = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount;
export const easeOut = (value: number): number => 1 - Math.pow(1 - value, 3);
export const easeInOut = (value: number): number =>
  value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
export function angDiff(from: number, to: number): number {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return delta;
}
