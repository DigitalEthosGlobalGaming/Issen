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
export interface PlayerProfile {
  id: string;
  name: string;
}
export function playerProfiles(): PlayerProfile[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem('issen.profileList') || '[]');
    const list = Array.isArray(raw)
      ? raw.filter(
          (p): p is PlayerProfile =>
            p &&
            typeof p === 'object' &&
            typeof p.id === 'string' &&
            /^(default|[a-f0-9-]{36})$/.test(p.id) &&
            typeof p.name === 'string' &&
            p.name.trim().length > 0 &&
            p.name.length <= 40,
        )
      : [];
    return [
      { id: 'default', name: list.find((p) => p.id === 'default')?.name || 'Player' },
      ...list.filter((p) => p.id !== 'default'),
    ];
  } catch {
    return [{ id: 'default', name: 'Player' }];
  }
}
function selectedPlayer(): string {
  try {
    const id = localStorage.getItem('issen.activeProfile');
    return playerProfiles().some((p) => p.id === id) ? id! : 'default';
  } catch {
    return 'default';
  }
}
const activePlayerId = selectedPlayer();
const profilePrefix = activeTestProfile
  ? 'issen.testing.'
  : activePlayerId === 'default'
    ? 'issen.'
    : `issen.profile.${activePlayerId}.`;
function matchesProfile(key: string): boolean {
  return (
    key.startsWith(profilePrefix) &&
    (profilePrefix !== 'issen.' ||
      (!key.startsWith('issen.testing.') &&
        !key.startsWith('issen.profile.') &&
        !['issen.profileList', 'issen.activeProfile'].includes(key)))
  );
}
export function currentProfile(): PlayerProfile {
  return activeTestProfile
    ? { id: 'testing', name: 'Testing' }
    : playerProfiles().find((p) => p.id === activePlayerId)!;
}
export function createPlayerProfile(name: string): string {
  const label = name.trim();
  if (!label || label.length > 40)
    throw new Error('Use a profile name between 1 and 40 characters.');
  const profiles = playerProfiles();
  if (profiles.some((p) => p.name.toLowerCase() === label.toLowerCase()))
    throw new Error('That profile name is already in use.');
  const id = crypto.randomUUID();
  localStorage.setItem('issen.profileList', JSON.stringify([...profiles, { id, name: label }]));
  return id;
}
export function renamePlayerProfile(name: string): void {
  if (activeTestProfile) throw new Error('The testing profile has a fixed name.');
  const label = name.trim();
  if (!label || label.length > 40)
    throw new Error('Use a profile name between 1 and 40 characters.');
  const profiles = playerProfiles();
  if (profiles.some((p) => p.id !== activePlayerId && p.name.toLowerCase() === label.toLowerCase()))
    throw new Error('That profile name is already in use.');
  localStorage.setItem(
    'issen.profileList',
    JSON.stringify(profiles.map((p) => (p.id === activePlayerId ? { ...p, name: label } : p))),
  );
}
export function switchPlayerProfile(id: string): boolean {
  if (!playerProfiles().some((p) => p.id === id)) return false;
  try {
    localStorage.setItem('issen.activeProfile', id);
    sessionStorage.setItem('issen.testing', '0');
    resettingProfile = true;
    location.reload();
    return true;
  } catch {
    resettingProfile = false;
    try {
      localStorage.setItem('issen.activeProfile', activePlayerId);
      sessionStorage.setItem('issen.testing', activeTestProfile ? '1' : '0');
    } catch {
      /* blocked storage */
    }
    return false;
  }
}
export function deleteCurrentProfile(): boolean {
  if (activeTestProfile || activePlayerId === 'default') return clearActiveProfile();
  const profiles = playerProfiles();
  try {
    localStorage.setItem(
      'issen.profileList',
      JSON.stringify(profiles.filter((p) => p.id !== activePlayerId)),
    );
    localStorage.setItem('issen.activeProfile', 'default');
    if (clearActiveProfile()) return true;
  } catch {
    /* Restore the registry if deletion did not finish. */
  }
  try {
    localStorage.setItem('issen.profileList', JSON.stringify(profiles));
    localStorage.setItem('issen.activeProfile', activePlayerId);
  } catch {
    /* blocked storage */
  }
  return false;
}
let resettingProfile = false;
const journalKey = profilePrefix + 'importJournal';
/** Recover an interrupted import before any profile reads can see partial data. */
function recoverImport(): void {
  const raw = localStorage.getItem(journalKey);
  if (!raw) return;
  const before = JSON.parse(raw) as Record<string, string | null>;
  for (const [key, value] of Object.entries(before)) {
    if (!matchesProfile(key) || key === journalKey || (typeof value !== 'string' && value !== null))
      continue;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
  localStorage.removeItem(journalKey);
}
try {
  recoverImport();
} catch {
  resettingProfile = true;
}

/** Export only the active profile. Internal recovery data never leaves the device. */
export function snapshotProfile(): Record<string, unknown> {
  if (resettingProfile) throw new Error('Save recovery is pending. Reload and try again.');
  const values: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !matchesProfile(key)) continue;
    const name = key.slice(profilePrefix.length);
    if (name === 'importJournal' || !/^[a-z][a-zA-Z0-9]*$/.test(name)) continue;
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      Object.defineProperty(values, name, { value: JSON.parse(raw), enumerable: true });
    } catch {
      /* A malformed section must not prevent backing up healthy sections. */
    }
  }
  return values;
}

/** Journal first, write and verify, then commit. A reload replaces stale runtime state. */
export function importProfile(values: Record<string, unknown>): boolean {
  if (resettingProfile) return false;
  const before: Record<string, string | null> = {};
  try {
    const backup = snapshotProfile();
    delete backup.importBackup;
    const writes = Object.entries({ ...values, importBackup: backup }).map(([name, value]) => {
      if (
        !/^[a-z][a-zA-Z0-9]*$/.test(name) ||
        ['importJournal', 'profileList', 'activeProfile'].includes(name)
      )
        throw new Error('Invalid save section');
      const key = profileKey('issen.' + name);
      before[key] = localStorage.getItem(key);
      return [key, value === null ? null : JSON.stringify(value)] as const;
    });
    localStorage.setItem(journalKey, JSON.stringify(before));
    resettingProfile = true;
    for (const [key, value] of writes) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      if (localStorage.getItem(key) !== value) throw new Error('Save verification failed');
    }
    localStorage.removeItem(journalKey);
    return true;
  } catch {
    try {
      recoverImport();
      resettingProfile = false;
    } catch {
      /* Keep writes blocked until startup can recover the durable journal. */
    }
    return false;
  }
}
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
      const matches = key && matchesProfile(key);
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
  return key.replace(/^issen\./, profilePrefix);
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
