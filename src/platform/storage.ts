/** Storage failures are non-fatal: the game remains playable without persistence. */
export const store = {
  get(key: string, fallback: unknown): unknown {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : (JSON.parse(value) as unknown);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Private browsing and quota failures must not interrupt a run. */
    }
  },
};
