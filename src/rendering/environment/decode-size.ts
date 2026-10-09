/** Keep atlas layout; low-memory worker inputs need only half-sized backing planes. */
export function workerDecodeSize(width: number, height: number, budget: number) {
  const scale = budget <= 256 * 1024 * 1024 ? 0.5 : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
