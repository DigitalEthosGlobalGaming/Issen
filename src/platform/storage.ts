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
let resettingProfile = false;
/** Admin convenience: never allow the test-only action to clear player saves. */
export function clearTestProfile(): boolean {
  return activeTestProfile ? clearActiveProfile() : false;
}
/** Clear the active profile only, then reload before stale runtime state can save. */
export function clearActiveProfile(): boolean {
  if (resettingProfile) return false;
  const backup = new Map<string, string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const matches =
        key &&
        (activeTestProfile
          ? key.startsWith('issen.testing.')
          : key.startsWith('issen.') && !key.startsWith('issen.testing.'));
      if (key && matches) {
        const value = localStorage.getItem(key);
        if (value !== null) backup.set(key, value);
      }
    }
    resettingProfile = true;
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
    resettingProfile = false;
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
  set(key: string, value: unknown): boolean {
    if (resettingProfile) return false;
    try {
      localStorage.setItem(profileKey(key), JSON.stringify(value));
      return true;
    } catch {
      /* Private browsing and quota failures must not interrupt a run. */
      return false;
    }
  },
  remove(key: string): void {
    if (resettingProfile) return;
    try {
      localStorage.removeItem(profileKey(key));
    } catch {
      /* Storage is unavailable. */
    }
  },
};
