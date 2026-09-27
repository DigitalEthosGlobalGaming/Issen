import test from 'node:test';
import assert from 'node:assert/strict';

let instance = 0;
async function fixture(t, testing = false) {
  const local = new Map();
  const session = new Map(testing ? [['issen.testing', '1']] : []);
  let reloads = 0;
  const adapter = (map) => ({
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (key) => map.delete(key),
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
  });
  for (const [key, value] of Object.entries({
    localStorage: adapter(local),
    sessionStorage: adapter(session),
    location: { reload: () => reloads++ },
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  const module = await import(`../../src/platform/storage.ts?isolation=${instance++}`);
  return { ...module, local, session, reloads: () => reloads };
}

test('test profile reads and writes its own namespace without touching player saves', async (t) => {
  const { store, local, isTestProfile } = await fixture(t, true);
  local.set('issen.stats', JSON.stringify({ runs: 42 }));
  local.set('issen.testing.stats', JSON.stringify({ runs: 2 }));
  assert.equal(isTestProfile(), true);
  assert.deepEqual(store.get('issen.stats', {}), { runs: 2 });
  store.set('issen.stats', { runs: 3 });
  assert.deepEqual(JSON.parse(local.get('issen.stats')), { runs: 42 });
  assert.deepEqual(JSON.parse(local.get('issen.testing.stats')), { runs: 3 });
  assert.deepEqual(store.get('issen.meta', { embers: 0 }), { embers: 0 });
});

test('clear test profile deletes only its namespace and blocks stale queued saves', async (t) => {
  const { store, local, clearTestProfile, reloads, session } = await fixture(t, true);
  local.set('issen.stats', 'player');
  local.set('another.app', 'untouched');
  local.set('issen.testing.stats', 'test');
  local.set('issen.testing.meta', 'test');
  assert.equal(clearTestProfile(), true);
  store.set('issen.meta', { embers: 999 });
  assert.deepEqual(
    [...local],
    [
      ['issen.stats', 'player'],
      ['another.app', 'untouched'],
    ],
  );
  assert.equal(session.get('issen.testing'), '1');
  assert.equal(reloads(), 1);
});

test('clear refuses player mode and restores test data after a failed reload', async (t) => {
  const player = await fixture(t);
  assert.equal(player.clearTestProfile(), false);
  const testing = await fixture(t, true);
  testing.local.set('issen.testing.meta', 'old');
  globalThis.location.reload = () => {
    throw new Error('denied');
  };
  assert.equal(testing.clearTestProfile(), false);
  assert.equal(testing.local.get('issen.testing.meta'), 'old');
  testing.store.set('issen.meta', { embers: 2 });
  assert.equal(JSON.parse(testing.local.get('issen.testing.meta')).embers, 2);
});

test('malformed JSON and storage failures are nonfatal', async (t) => {
  const { store, local } = await fixture(t);
  local.set('issen.meta', '{broken');
  const fallback = { embers: 0 };
  assert.equal(store.get('issen.meta', fallback), fallback);
  globalThis.localStorage.getItem = () => {
    throw new Error('denied');
  };
  globalThis.localStorage.setItem = () => {
    throw new Error('quota');
  };
  assert.equal(store.get('issen.meta', fallback), fallback);
  assert.doesNotThrow(() => store.set('issen.meta', { embers: 1 }));
});

test('active player reset clears every player key but preserves test and unrelated data', async (t) => {
  const { local, store, clearActiveProfile, reloads } = await fixture(t);
  for (const key of [
    'stats',
    'best',
    'meta',
    'equip',
    'unlocks',
    'awakening',
    'hints',
    'setup',
    'muted',
    'revoked',
    'future',
  ])
    local.set('issen.' + key, 'old');
  local.set('issen.testing.meta', 'test');
  local.set('another.app', 'other');
  assert.equal(clearActiveProfile(), true);
  store.set('issen.stats', { runs: 9 });
  assert.deepEqual(
    [...local],
    [
      ['issen.testing.meta', 'test'],
      ['another.app', 'other'],
    ],
  );
  assert.equal(reloads(), 1);
  assert.equal(clearActiveProfile(), false);
});

test('failed deletion restores captured profile data and permits future saves', async (t) => {
  const { local, store, clearActiveProfile } = await fixture(t);
  local.set('issen.stats', 'records');
  local.set('issen.meta', 'progress');
  const remove = globalThis.localStorage.removeItem;
  globalThis.localStorage.removeItem = (key) => {
    if (key === 'issen.meta') throw new Error('denied');
    remove(key);
  };
  assert.equal(clearActiveProfile(), false);
  assert.equal(local.get('issen.stats'), 'records');
  assert.equal(local.get('issen.meta'), 'progress');
  store.set('issen.stats', { runs: 1 });
  assert.equal(JSON.parse(local.get('issen.stats')).runs, 1);
});

test('profile switch requests reload and keeps old in-memory writes in their original namespace', async (t) => {
  const { store, local, session, switchTestProfile, reloads } = await fixture(t, true);
  local.set('issen.stats', JSON.stringify({ runs: 42 }));
  assert.equal(switchTestProfile(false), true);
  assert.equal(session.get('issen.testing'), '0');
  assert.equal(reloads(), 1);
  // A queued frame may still save before navigation finishes. It must never
  // overwrite player data with the departing test session's in-memory state.
  store.set('issen.stats', { runs: 999 });
  assert.deepEqual(JSON.parse(local.get('issen.stats')), { runs: 42 });
  assert.deepEqual(JSON.parse(local.get('issen.testing.stats')), { runs: 999 });
  const next = await import(`../../src/platform/storage.ts?isolation=${instance++}`);
  assert.equal(next.isTestProfile(), false);
  assert.deepEqual(next.store.get('issen.stats', {}), { runs: 42 });
});

test('failed profile switches report failure and preserve active profile and selector', async (t) => {
  const { switchTestProfile, session, isTestProfile, reloads } = await fixture(t, true);
  globalThis.location.reload = () => {
    throw new Error('blocked navigation');
  };
  assert.equal(switchTestProfile(false), false);
  assert.equal(session.get('issen.testing'), '1');
  assert.equal(isTestProfile(), true);
  globalThis.sessionStorage.setItem = () => {
    throw new Error('denied');
  };
  assert.equal(switchTestProfile(false), false);
  assert.equal(reloads(), 0);
  assert.equal(isTestProfile(), true);
});
