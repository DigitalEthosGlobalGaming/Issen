import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stageVariationPlan,
  createStageVisitSeeds,
} from '../../src/rendering/environment/stage-variation.ts';
import { restorableRng } from '../../src/shared/random.ts';

test('visit plans stay stable until an actual entry, separate from combat RNG', () => {
  const combat = restorableRng(42),
    before = combat.state();
  const visits = createStageVisitSeeds(19);
  const first = visits.enter(0),
    plan = stageVariationPlan(0, first);
  assert.equal(visits.enter(0), first);
  assert.equal(visits.visits, 1);
  assert.deepEqual(stageVariationPlan(0, visits.seed), plan);
  visits.enter(1);
  const returned = visits.enter(0);
  assert.notEqual(returned, first);
  assert.notDeepEqual(stageVariationPlan(0, returned), plan);
  assert.notEqual(visits.enter(0, true), returned, 'cinematic re-entry can explicitly reroll');
  assert.equal(combat.state(), before);
});

test('every scene keeps props in responsive margins and uses its existing visual family', () => {
  for (let stage = 0; stage < 9; stage++)
    for (let seed = 0; seed < 30; seed++) {
      const plan = stageVariationPlan(stage, seed);
      assert.equal(plan.length, 3);
      for (const p of plan) {
        assert.ok(p.cell >= 0 && p.cell <= 3);
        assert.ok(p.x + p.width / 2 < 0.16 || p.x - p.width / 2 > 0.84);
        assert.ok(p.alpha <= 0.44);
      }
      if (stage === 1) assert.ok(plan[0].x < 0.5);
      if (stage === 7) assert.ok(plan[0].x > 0.5);
      if (stage === 4) assert.equal(plan[0].family, 'bamboo');
      if (stage === 5) {
        assert.equal(plan[0].family, 'snowPines');
        for (const prop of plan) {
          assert.equal(prop.flip, false);
          assert.ok(prop.frame);
          if (prop.ground) assert.deepEqual(prop.frame, { x: 0, y: 500, width: 887, height: 387 });
          else assert.ok(prop.frame.x === 660 || prop.frame.x === 700);
        }
      }
      if (stage === 2) assert.equal(plan[0].family, 'shrubs');
      if (stage === 6) assert.ok(plan.every((p) => p.family === 'rocks'));
    }
  assert.deepEqual(stageVariationPlan(-1, 1), []);
});
