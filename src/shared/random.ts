export type Random = () => number;
export function rng(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(items: T[], random: Random = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = (random() * (i + 1)) | 0;
    // Both indices are bounded by the array length.
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}
