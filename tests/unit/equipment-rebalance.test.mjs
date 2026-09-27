import test from 'node:test';
import assert from 'node:assert/strict';
import { createItems } from '../../src/game/content/items.ts';
import { ROBE_AWAKENINGS } from '../../src/game/content/robe-awakenings.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';
import { normalLives } from '../../src/game/equipment/lives.ts';
import { applyBlessing } from '../../src/game/shrine/blessings.ts';
import { parseMeta, templateModifiers, templatePowers } from '../../src/game/progression/meta.ts';
import {
  createRunRewardLedger,
  accrueRunReward,
  settleRunReward,
} from '../../src/game/progression/run-rewards.ts';

const items = Object.fromEntries(createItems(() => new Set()).map((item) => [item.id, item]));
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3' };

test('Jinbaori adds two lives beyond Vitality and shrine life increases are uncapped', () => {
  const meta = parseMeta({ schemaVersion: 4, upgrades: { vitality: 3 } });
  const m = computeModifiers([items.jinbaori.m, templateModifiers(meta, setup)], new Set());
  assert.equal(items.jinbaori.m.lives, 2);
  assert.equal(normalLives(m.lives), 7);
  const run = { maxLives: 7, lives: 7, zen: false, hard: false, bless: new Set(), runWards: 0 };
  applyBlessing(run, 'iron');
  assert.equal(run.maxLives, 8);
  assert.equal(run.lives, 8);
  assert.equal(normalLives(ROBE_AWAKENINGS.jinbaori.m.lives + 3), 7);
});

test('Monk Hood adds a choice to Offerings and Yoroi earns currency rather than lives', () => {
  const meta = parseMeta({ schemaVersion: 4, upgrades: { offerings: 3 } });
  const m = computeModifiers([items.monk.m, templateModifiers(meta, setup)], new Set());
  assert.equal(m.shrineN, 5);
  assert.equal(items.yoroi.m.lives, undefined);
  assert.equal(items.yoroi.m.emberBonus, 0.1);
  assert.equal(ROBE_AWAKENINGS.yoroi.m.emberBonus, 0.2);
  assert.equal(ROBE_AWAKENINGS.yoroi.m.lives, undefined);
});

test('old knife and pouch purchases migrate once to combined rank without charging', () => {
  for (const schemaVersion of [undefined, 2, 3]) {
    for (const pouch of [0, 1, 2]) {
      const migrated = parseMeta({ schemaVersion, embers: 777, upgrades: { knife: 1, pouch } });
      assert.equal(migrated.upgrades.knife, 1 + pouch);
      assert.equal(migrated.upgrades.pouch, undefined);
      assert.equal(migrated.embers, 777);
      assert.equal(templatePowers(migrated, setup).knives, 1 + pouch);
      assert.deepEqual(parseMeta(JSON.parse(JSON.stringify(migrated))), migrated);
    }
  }
  assert.equal(parseMeta({ schemaVersion: 4, upgrades: { knife: 2 } }).upgrades.knife, 2);
});

test('Yoroi fractional Ember rewards survive reloads and excluded events cannot earn bonuses', () => {
  let meta = parseMeta(null);
  let ledger = createRunRewardLedger();
  for (let i = 0; i < 9; i++) accrueRunReward(ledger, 'kill', { emberBonus: 0.1 });
  assert.equal(meta.embers, 0);
  assert.equal(settleRunReward(meta, ledger).gained, 4);
  assert.equal(meta.emberRemainder, 95);
  meta = parseMeta(JSON.parse(JSON.stringify(meta)));
  ledger = createRunRewardLedger();
  accrueRunReward(ledger, 'kill', { emberBonus: 0.1 });
  assert.equal(settleRunReward(meta, ledger).gained, 1);
  assert.equal(meta.earned, 5);
  assert.equal(meta.emberRemainder, 50);
  ledger = createRunRewardLedger();
  accrueRunReward(ledger, 'boss', { emberBonus: 0.2 });
  assert.equal(settleRunReward(meta, ledger).gained, 15);
  ledger = createRunRewardLedger();
  accrueRunReward(ledger, 'wave', { emberBonus: 0.1 });
  assert.equal(settleRunReward(meta, ledger).gained, 3);
  assert.equal(meta.emberRemainder, 25);
  const before = structuredClone(meta);
  ledger = createRunRewardLedger();
  for (const context of [{ zen: true }, { tutorial: true }, { testing: true }])
    accrueRunReward(ledger, 'boss', { ...context, emberBonus: 0.2 });
  assert.equal(settleRunReward(meta, ledger).gained, 0);
  assert.deepEqual(meta, before);
});
