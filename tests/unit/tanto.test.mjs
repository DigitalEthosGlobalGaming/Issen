import assert from 'node:assert/strict';
import test from 'node:test';
import { interceptWithTanto } from '../../src/game/combat/tanto.ts';
import { parseMeta, purchaseUpgrade, templatePowers } from '../../src/game/progression/meta.ts';

test('Tanto buys one additional run strike per rank and migrates old saves', () => {
  const meta = parseMeta({ schemaVersion: 4, embers: 1000 });
  assert.equal(meta.upgrades.tanto, 0);
  const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: true };
  for (let rank = 1; rank <= 3; rank++) {
    assert.equal(purchaseUpgrade(meta, 'tanto'), true);
    assert.equal(templatePowers(meta, setup).tanto, rank);
    assert.equal(templatePowers(meta, { ...setup, upgrades: false }).tanto, 0);
  }
  assert.equal(meta.embers, 75);
  assert.equal(purchaseUpgrade(meta, 'tanto'), false);
  assert.equal(parseMeta(meta).upgrades.tanto, 3);
});

test('only living opponents in active encounters spend one strike', () => {
  for (const state of ['playing', 'boss', 'standoff']) {
    const run = { state, tanto: 1 };
    assert.equal(interceptWithTanto(run, { state: 'attack' }), true);
    assert.equal(run.tanto, 0);
    assert.equal(interceptWithTanto(run, { state: 'attack' }), false);
  }
  for (const state of ['dead', 'over', 'shrine', 'between']) {
    const run = { state, tanto: 3 };
    assert.equal(interceptWithTanto(run, { state: 'attack' }), false);
    assert.equal(run.tanto, 3);
  }
  const run = { state: 'playing', tanto: 3 };
  for (const state of ['enter', 'dying', 'fade', 'strike', 'hurt'])
    assert.equal(interceptWithTanto(run, { state }), false);
  assert.equal(interceptWithTanto(run, null), false);
  assert.equal(interceptWithTanto({ ...run, panel: 'pause' }, { state: 'attack' }), false);
  assert.equal(run.tanto, 3);
});

test('checkpoints preserve remaining strikes and default legacy charges to zero', async () => {
  const { parseRunCheckpoint } = await import('../../src/platform/run-checkpoint.ts');
  const { createRunState } = await import('../../src/game/run-state.ts');
  const { createWeatherState } = await import('../../src/rendering/scene/weather-state.ts');
  const fixture = () => ({
    version: 1,
    status: 'active',
    seed: 0,
    randomState: 0,
    run: {
      ...createRunState(),
      state: 'playing',
      wave: 1,
      tanto: 2,
      bless: [],
      cfg: { total: 1, pack: 1, atk: 1, gap: 1 },
    },
    stats: {},
    awakening: {},
    meta: {},
    equipment: {},
    setup: {},
    ledger: { pending: 0 },
    weather: createWeatherState(() => 0.5),
    unlocks: [],
    bossMilestone: 0,
    offers: null,
  });
  assert.equal(parseRunCheckpoint(fixture()).run.tanto, 2);
  const old = fixture();
  delete old.run.tanto;
  assert.equal(parseRunCheckpoint(old).run.tanto, 0);
  for (const invalid of [-1, 4, 1.5, '2', null]) {
    const raw = fixture();
    raw.run.tanto = invalid;
    assert.equal(parseRunCheckpoint(raw), null);
  }
});
