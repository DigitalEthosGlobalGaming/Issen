import test from 'node:test';
import assert from 'node:assert/strict';
import { initialSpawns, updateWave } from '../../src/game/encounters/waves.ts';
import { spawnEnemy } from '../../src/game/combat/enemy-spawn.ts';
const position = () => ({ x: 20, y: 30, h: 40, fog: 0, alpha: 1 });
function fixture() {
  const state = {
    state: 'playing',
    pendingSpawns: [],
    attacker: null,
    gapT: 0,
    cfg: { ordered: true, atk: 2, feint: 0 },
    enemies: [],
    toSpawn: 1,
    nextT: 0,
    wave: 2,
    nextOrder: 1,
    m: { waveBonus: 2 },
  };
  const log = [];
  const events = {
    spawn: (slot) => {
      spawnEnemy(state, slot, false, position, () => 0.5);
      log.push('spawn');
    },
    attack: () => log.push('attack'),
    cleared: (bonus) => log.push(bonus),
  };
  return { state, events, log };
}
test('initial packs retain slots and staggered arrival timing', () => {
  for (const [pack, expected] of [
    [3, [1, 2, 3]],
    [4, [0, 1, 3, 4]],
    [5, [0, 1, 2, 3, 4]],
  ]) {
    const pending = initialSpawns(pack, false, () => 0.5);
    assert.deepEqual(pending.map((p) => p.slot).sort(), expected);
    assert.equal(pending[0].t, 0.3);
    assert.equal(initialSpawns(pack, true, () => 0.5)[0].t, 0.9);
    assert.ok(pending.every((p, i) => p.t === 0.3 + i * 0.2));
  }
});
test('reinforcements spawn before attacker selection; entering enemies wait', () => {
  const { state, events, log } = fixture();
  state.pendingSpawns = [{ slot: 0, t: 0.1 }];
  updateWave(state, 0.1, events, () => 0.5);
  assert.deepEqual(log, ['spawn']);
  assert.equal(state.pendingSpawns.length, 0);
  state.enemies[0].state = 'idle';
  updateWave(state, 0.1, events, () => 0.5);
  assert.deepEqual(log, ['spawn', 'attack']);
  assert.equal(state.attacker.T, 2);
  updateWave(state, 0.1, events, () => 0.5);
  assert.equal(log.length, 2);
});
test('wave completion emits its bonus once and paused waves do not tick', () => {
  const { state, events, log } = fixture();
  state.state = 'paused';
  state.pendingSpawns = [{ slot: 0, t: 0.1 }];
  updateWave(state, 1, events);
  assert.equal(state.pendingSpawns[0].t, 0.1);
  assert.deepEqual(log, []);
  state.state = 'playing';
  state.pendingSpawns = [];
  state.toSpawn = 0;
  updateWave(state, 0.1, events);
  assert.equal(state.state, 'between');
  assert.equal(state.nextT, 1.2);
  assert.deepEqual(log, [600]);
  updateWave(state, 0.1, events);
  assert.deepEqual(log, [600]);
});
