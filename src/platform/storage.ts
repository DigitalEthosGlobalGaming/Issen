/** Test sessions use separate keys; toggling requires a reload to replace all in-memory state. */
export function isTestProfile(): boolean {
  try { return sessionStorage.getItem('issen.testing') === '1'; } catch { return false; }
}
export function switchTestProfile(enabled: boolean): void {
  sessionStorage.setItem('issen.testing', enabled ? '1' : '0');
  location.reload();
}
function profileKey(key: string): string {
  return isTestProfile() ? key.replace(/^issen\./, 'issen.testing.') : key;
}
/** Storage failures are non-fatal: the game remains playable without persistence. */
export const store = {
  get(key: string, fallback: unknown): unknown {
    try {
      const value = localStorage.getItem(profileKey(key));
      return value === null ? fallback : (JSON.parse(value) as unknown);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(profileKey(key), JSON.stringify(value));
    } catch {
      /* Private browsing and quota failures must not interrupt a run. */
    }
  },
};
