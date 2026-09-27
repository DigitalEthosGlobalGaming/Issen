function readTestProfile(): boolean {
  try {
    return sessionStorage.getItem('issen.testing') === '1';
  } catch {
    return false;
  }
}
// Snapshot for this module instance: queued saves while reload is pending still
// belong to the departing profile, regardless of the next session's selector.
const activeTestProfile = readTestProfile();
let resettingTestProfile = false;
/** Clear only the isolated namespace and reload before any stale runtime can save. */
export function clearTestProfile(): boolean {
  if (!activeTestProfile || resettingTestProfile) return false;
  const backup = new Map<string, string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('issen.testing.')) {
        const value = localStorage.getItem(key);
        if (value !== null) backup.set(key, value);
      }
    }
    resettingTestProfile = true;
    for (const key of backup.keys()) localStorage.removeItem(key);
    location.reload();
    return true;
  } catch {
    for (const [key, value] of backup) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* Best-effort recovery if storage is unavailable. */
      }
    }
    resettingTestProfile = false;
    return false;
  }
}
/** Test sessions use separate keys; toggling requires a reload to replace all in-memory state. */
export function isTestProfile(): boolean {
  return activeTestProfile;
}
export function switchTestProfile(enabled: boolean): boolean {
  try {
    sessionStorage.setItem('issen.testing', enabled ? '1' : '0');
    location.reload();
    return true;
  } catch {
    // A blocked reload must not silently change the next session's profile.
    try {
      sessionStorage.setItem('issen.testing', activeTestProfile ? '1' : '0');
    } catch {
      /* Storage may be unavailable; current-profile saves remain isolated. */
    }
    return false;
  }
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
    if (resettingTestProfile) return;
    try {
      localStorage.setItem(profileKey(key), JSON.stringify(value));
    } catch {
      /* Private browsing and quota failures must not interrupt a run. */
    }
  },
};
