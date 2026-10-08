import test from 'node:test';
import assert from 'node:assert/strict';
import {
  stageVariationPlan,
  stageVariationPlacement,
  createStageVisitSeeds,
} from '../../src/rendering/environment/stage-variation.ts';
import { restorableRng } from '../../src/shared/random.ts';

test('peeking preserves full visit sequences, repeated entries and forced rerolls', () => {
  for (const initial of [0, 19, 47, 0xffffffff]) {
    const control = createStageVisitSeeds(initial),
      predicted = createStageVisitSeeds(initial);
    const combat = restorableRng(424242),
      rngBefore = combat.state();
    const steps = [
      [0, false],
      [0, false],
      [0, true],
      ...Array.from({ length: 27 }, (_, index) => [index % 9, false]),
      [5, true],
      [5, false],
      [5, true],
      [2, true],
      [0, false],
    ];
    for (const [stage, force] of steps) {
      const before = { seed: predicted.seed, visits: predicted.visits };
      const expected = control.enter(stage, force);
      assert.equal(predicted.peek(stage, force), expected);
      predicted.peek((stage + 4) % 9, true);
      assert.equal(predicted.peek(stage, force), expected);
      assert.deepEqual({ seed: predicted.seed, visits: predicted.visits }, before);
      assert.equal(predicted.enter(stage, force), expected);
      assert.equal(predicted.visits, control.visits);
    }
    assert.equal(combat.state(), rngBefore);
  }
});

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

test('two landmarks frame scenes or occupy the distant courtyard gap', () => {
  for (let stage = 0; stage < 9; stage++)
    for (let seed = 0; seed < 30; seed++) {
      const plan = stageVariationPlan(stage, seed);
      assert.equal(plan.length, 2);
      assert.equal(plan[0].cell, seed % 4);
      assert.notEqual(plan[1].cell, plan[0].cell);
      assert.ok(plan[0].width >= (stage === 6 ? 0.26 : 0.3) && plan[0].alpha >= 0.68);
      assert.ok(plan[1].width >= 0.18 && plan[1].alpha >= 0.52);
      for (const p of plan) {
        assert.ok(p.cell >= 0 && p.cell <= 3);
        if (stage === 6 && p === plan[0]) {
          assert.equal(p.x, 0.55);
          assert.ok(p.maxHeight <= 0.3);
        } else assert.ok(p.x + p.width / 2 < 0.34 || p.x - p.width / 2 > 0.66);
        for (const [w, h] of [
          [390, 844],
          [768, 1024],
          [1440, 900],
        ]) {
          const placement = stageVariationPlacement(p, w, h);
          const visualCenter =
            placement.x + (p.flip ? -1 : 1) * (0.5 - placement.anchorX) * placement.width;
          assert.ok(
            Math.abs(visualCenter - p.x * w) < 1e-9,
            'off-center roots must not shift the canopy into combat',
          );
          assert.ok(
            (placement.width * placement.frame.height) / placement.frame.width <=
              h * p.maxHeight + 1e-9,
          );
          assert.ok(placement.foot < h * 0.7, 'landmarks sit above foreground grass');
        }
      }
      if (stage === 1) assert.ok(plan[0].x < 0.5);
      if (stage === 7) assert.ok(plan[0].x > 0.5);
      if (stage === 4) assert.equal(plan[0].family, 'bambooLandmarks');
      if (stage === 2) assert.equal(plan[0].family, 'cherryLandmarks');
      if (stage === 6) assert.equal(plan[0].family, 'stones');
      if (stage === 5) assert.ok(plan.every((p) => p.family === 'snowWoodland'));
      else assert.equal(plan[1].family, 'stones');
    }
  assert.deepEqual(stageVariationPlan(-1, 1), []);
});

test('cycling all nine scenes changes the returning landmark silhouette', () => {
  const visits = createStageVisitSeeds(47);
  const first = stageVariationPlan(0, visits.enter(0))[0].cell;
  for (let stage = 1; stage < 9; stage++) visits.enter(stage);
  assert.notEqual(stageVariationPlan(0, visits.enter(0))[0].cell, first);
});
