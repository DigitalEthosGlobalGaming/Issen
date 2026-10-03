import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareImport, exportSave } from '../../src/platform/save-transfer.ts';

test('older saves migrate, reconcile rewards and merge without counting twice', () => {
  const local = {
    stats: { kills: 20, bestScore: 500 },
    unlocks: ['kuro'],
    meta: { schemaVersion: 4, embers: 50, upgrades: { tanto: 2 } },
  };
  const text = JSON.stringify({
    'issen.stats': JSON.stringify({ kills: 12, bestScore: 800, bl: { steel: { k: 200 } } }),
    'issen.unlocks': ['beni', 'unknown-future-item'],
    'issen.trials': { completed: ['demon-mirror'] },
    'issen.meta': { schemaVersion: 1, embers: 100, upgrades: { awakening: 1, knife: 1, pouch: 2 } },
  });
  const result = prepareImport(text, local);
  assert.equal(result.data.stats.kills, 20);
  assert.equal(result.data.stats.bestScore, 800);
  assert.equal(result.data.meta.upgrades.awakening, 2);
  assert.equal(result.data.meta.upgrades.knife, 3);
  assert.equal(result.data.meta.upgrades.tanto, 2);
  assert.ok(result.data.unlocks.includes('kuro'));
  assert.ok(result.data.unlocks.includes('unknown-future-item'));
  assert.ok(result.data.unlocks.includes('trial-inferno'));
  const twice = prepareImport(text, result.data).data;
  assert.deepEqual(twice.stats, result.data.stats);
  assert.deepEqual(twice.meta, result.data.meta);
  assert.deepEqual(twice.unlocks, result.data.unlocks);
});
test('damaged fields preserve local values, and invalid checkpoint is independent', () => {
  const plan = prepareImport(
    JSON.stringify({
      stats: { kills: 'oops', bestScore: -4 },
      unlocks: ['beni'],
      meta: 'broken',
      runCheckpoint: { version: 90 },
    }),
    { stats: { kills: 15, bestScore: 700 }, meta: { schemaVersion: 4, embers: 65 } },
  );
  assert.equal(plan.data.stats.kills, 15);
  assert.equal(plan.data.stats.bestScore, 700);
  assert.equal(plan.data.meta.embers, 65);
  assert.equal(plan.data.runCheckpoint, null);
  assert.equal(plan.warnings.length, 2);
});
test('exports are versioned and unknown sections/trials survive round trips', () => {
  const imported = prepareImport(
    JSON.stringify({
      format: 'issen-save',
      version: 5,
      data: {
        stats: { kills: 8 },
        unlocks: ['future'],
        trials: { completed: ['future-trial'] },
        futureSystem: { value: 3 },
      },
    }),
    {},
  );
  const output = JSON.parse(
    exportSave({ ...imported.data, importBackup: { stats: {} } }, '1.45.0'),
  );
  assert.equal(output.format, 'issen-save');
  assert.equal(output.gameVersion, '1.45.0');
  assert.deepEqual(output.data.futureSystem, { value: 3 });
  assert.ok(output.data.trials.completed.includes('future-trial'));
  assert.equal(output.data.importBackup, undefined);
});
test('unreadable or unrelated files reject without mutating the supplied save', () => {
  const local = { stats: { kills: 7 } };
  for (const text of [
    '{broken',
    '[]',
    '{"hello":true}',
    '{"format":"another-save","data":{"stats":{}}}',
  ])
    assert.throws(() => prepareImport(text, local));
  assert.equal(local.stats.kills, 7);
});
