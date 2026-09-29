import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunState } from '../../src/game/run-state.ts';
import { BLESS_BY } from '../../src/game/content/blessings.ts';
import { blessingEligible, crossroadsCurse } from '../../src/game/shrine/blessings.ts';
import {
  createBlessingTriggers,
  startBlessingWave,
  recordBlessingCut,
  recordComboBreak,
  nextBlessingAttacker,
  availableWards,
} from '../../src/game/shrine/triggered.ts';
import { resolveDamage } from '../../src/game/combat/damage.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';
import { rng } from '../../src/shared/random.ts';

test('Knife Dance only enters runs with throwing knives and refills at capacity', () => {
  const run = createRunState();
  assert.equal(blessingEligible(run, BLESS_BY.knifedance), false);
  run.maxKnives = 2;
  run.knives = 1;
  recordBlessingCut(run, true);
  recordBlessingCut(run, true);
  assert.equal(run.blessingTriggers.knifeProgress, 0);
  run.bless.add('knifedance');
  assert.equal(blessingEligible(run, BLESS_BY.knifedance), false);
  run.bless.delete('knifedance');
  assert.equal(blessingEligible(run, BLESS_BY.knifedance), true);
  run.bless.add('knifedance');
  for (let i = 0; i < 2; i++) assert.equal(recordBlessingCut(run, true).knife, false);
  assert.equal(recordBlessingCut(run, true).knife, true);
  run.knives++;
  for (let i = 0; i < 3; i++) assert.equal(recordBlessingCut(run, true).knife, false);
  recordBlessingCut(run, false);
  assert.equal(run.blessingTriggers.knifeProgress, 0);
});

test('tempo and lightning trigger on future attackers, with lightning taking priority', () => {
  const run = createRunState();
  run.bless = new Set(['stolentempo', 'stormcall']);
  startBlessingWave(run);
  assert.equal(recordBlessingCut(run, true).stormCharged, false);
  assert.equal(nextBlessingAttacker(run), 'hesitate');
  recordBlessingCut(run, true);
  assert.equal(recordBlessingCut(run, true).stormCharged, true);
  assert.equal(nextBlessingAttacker(run), 'lightning');
  assert.equal(nextBlessingAttacker(run), null);
  startBlessingWave(run);
  recordBlessingCut(run, true);
  assert.equal(nextBlessingAttacker(run), 'hesitate');
});

test('Final Flourish expires after its next wave and Rekindle works once per wave', () => {
  const run = createRunState();
  run.bless = new Set(['finalflourish', 'rekindle']);
  run.blessingTriggers.flourishPending = true;
  startBlessingWave(run);
  assert.equal(run.blessingTriggers.flourishWard, true);
  run.state = 'playing';
  run.combo = 0;
  recordComboBreak(run, 11);
  assert.equal(run.blessingTriggers.rekindleBank, 5);
  assert.equal(recordBlessingCut(run, true).rekindled, 5);
  assert.equal(run.combo, 5);
  run.combo = 0;
  recordComboBreak(run, 10);
  assert.equal(recordBlessingCut(run, true).rekindled, 0);
  startBlessingWave(run);
  assert.equal(run.blessingTriggers.flourishWard, false);
});

test('Oath earns one persistent ward per five consecutive perfect cuts; expiring wards spend first', () => {
  const run = createRunState();
  run.state = 'playing';
  run.bless.add('oath');
  run.lives = 1;
  for (let i = 0; i < 4; i++) assert.equal(recordBlessingCut(run, true).precisionWard, false);
  assert.equal(recordBlessingCut(run, true).precisionWard, true);
  run.blessingTriggers.flourishWard = true;
  run.runWards = 2;
  assert.equal(availableWards(run), 4);
  assert.equal(resolveDamage(run, 'wrong').kind, 'hurt');
  assert.equal(run.blessingTriggers.flourishWard, false);
  assert.equal(run.blessingTriggers.precisionWard, true);
  resolveDamage(run, 'wrong');
  assert.equal(run.blessingTriggers.precisionWard, false);
  assert.equal(run.runWards, 2);
  resolveDamage(run, 'wrong');
  assert.equal(run.runWards, 1);
  recordBlessingCut(run, false);
  assert.equal(run.blessingTriggers.precisionProgress, 0);
});

test('Crossroads forces a seeded eligible curse and adds two future offers', () => {
  const run = createRunState();
  run.lives = 1;
  run.bless = new Set(['glass', 'frenzy', 'silence', 'haste', 'oath', 'blind']);
  assert.equal(blessingEligible(run, BLESS_BY.crossroads), false);
  run.bless.delete('blind');
  assert.equal(blessingEligible(run, BLESS_BY.crossroads), true);
  run.bless.add('crossroads');
  const curse = crossroadsCurse(run, rng(8));
  assert.equal(curse.id, 'blind');
  assert.ok(run.bless.has('blind'));
  assert.equal(crossroadsCurse(run, rng(8)), null);
  assert.equal(computeModifiers([], run.bless).shrineN, 5);
  assert.deepEqual(createBlessingTriggers(), createRunState().blessingTriggers);
});
