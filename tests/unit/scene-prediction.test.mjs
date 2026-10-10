import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenePrediction } from '../../src/runtime/scene-prediction.ts';
import { encounterScenery } from '../../src/game/session/stage-progression.ts';
import { createStageVisitSeeds } from '../../src/rendering/environment/stage-variation.ts';
import { compositionKey } from '../../src/rendering/environment/worker-types.ts';
import { TRIALS } from '../../src/game/content/trials.ts';
function fixture(seed = 19) {
  const visits = createStageVisitSeeds(seed);
  visits.enter(0);
  const views = {
    G: { state: 'between', wave: 1, stage: 0, rush: false },
    activeTrial: null,
    cinematic: { active: false },
    stageVisits: visits,
    W: 390,
    H: 844,
    DPR: 2,
    density: () => 1,
  };
  return { views, visits, predict: createScenePrediction(() => views) };
}
test('disabled preload suppresses prediction without peeking or advancing the visit ledger', () => {
  const f = fixture();
  const original = f.visits.peek(1);
  let enabled = true,
    peeks = 0;
  const peek = f.views.stageVisits.peek.bind(f.views.stageVisits);
  f.views.stageVisits = {
    peek(stage) {
      peeks++;
      return peek(stage);
    },
  };
  f.views.preload = () => enabled;
  const next = f.predict();
  assert.ok(next);
  enabled = false;
  const before = peeks;
  assert.equal(f.predict(), undefined);
  assert.equal(peeks, before);
  assert.equal(f.visits.peek(1), original);
  enabled = true;
  assert.deepEqual(f.predict(), next);
});

test('exact upcoming composition identities preserve normal/daily/rush visit sequences through ten laps', () => {
  for (const initial of [19, 0xffffffff])
    for (const rush of [false, true]) {
      const f = fixture(initial),
        control = createStageVisitSeeds(initial);
      control.enter(0);
      f.views.G.rush = rush;
      let expected;
      for (let wave = 1; wave <= (rush ? 90 : 270); wave++) {
        const { stage } = encounterScenery(wave, rush),
          oldStage = f.views.G.stage;
        const entered = f.visits.enter(stage);
        assert.equal(entered, control.enter(stage));
        if (stage !== oldStage && expected) assert.equal(entered, expected.stageSeed);
        Object.assign(f.views.G, { wave, stage });
        const before = structuredClone(f.views.G),
          visits = f.visits.visits,
          seed = f.visits.seed;
        const next = f.predict();
        assert.equal(next.stage, (stage + 1) % 9);
        assert.equal(next.stageSeed, control.peek(next.stage));
        assert.equal(f.visits.visits, visits);
        assert.equal(f.visits.seed, seed);
        assert.deepEqual(f.views.G, before);
        assert.equal(
          compositionKey(next),
          compositionKey({ ...next, time: 50, reducedMotion: true, reducedFlashes: true }),
        );
        assert.equal(f.predict(), next);
        expected = next;
      }
    }
});
test('prediction reuses immutable identities and invalidates every composition input', () => {
  const f = fixture();
  let previous = f.predict();
  assert.ok(Object.isFrozen(previous));
  for (let i = 0; i < 100; i++) assert.equal(f.predict(), previous);
  for (const change of [
    () => f.views.W++,
    () => f.views.H++,
    () => (f.views.DPR = 1),
    () => (f.views.density = () => 0.3),
    () => f.visits.enter(0, true),
  ]) {
    change();
    const next = f.predict();
    assert.notEqual(next, previous);
    assert.notEqual(compositionKey(next), compositionKey(previous));
    previous = next;
  }
  f.views.G.state = 'title';
  assert.equal(f.predict(), undefined);
  f.views.G.state = 'between';
  assert.notEqual(f.predict(), previous);
});
test('changing scenery detail invalidates the forecast without advancing seeds or tying it to reduced motion', () => {
  const f = fixture();
  let detail = 'high';
  f.views.sceneryDetail = () => detail;
  f.views.density = () => 0.3;
  const high = f.predict();
  assert.equal(high.lowQuality, false);
  const visits = f.visits.visits,
    seed = f.visits.seed;
  detail = 'normal';
  const normal = f.predict();
  detail = 'low';
  const low = f.predict();
  assert.equal(normal.lowQuality, false);
  assert.equal(low.lowQuality, true);
  assert.notEqual(compositionKey(normal), compositionKey(high));
  assert.notEqual(compositionKey(low), compositionKey(normal));
  assert.equal(low.stageSeed, high.stageSeed);
  assert.equal(f.visits.visits, visits);
  assert.equal(f.visits.seed, seed);
});

test('unknown choices, fixed trials, inactive and invalid geometry have no next scene', () => {
  const f = fixture();
  for (const trial of TRIALS) {
    f.views.activeTrial = trial;
    assert.equal(f.predict(), undefined);
  }
  f.views.activeTrial = null;
  f.views.cinematic.active = true;
  assert.equal(f.predict(), undefined);
  f.views.cinematic.active = false;
  for (const key of ['W', 'H', 'DPR'])
    for (const invalid of [0, -1, NaN, Infinity]) {
      const before = f.views[key];
      f.views[key] = invalid;
      assert.equal(f.predict(), undefined);
      f.views[key] = before;
    }
  for (const state of ['title', 'over', 'dead']) {
    f.views.G.state = state;
    assert.equal(f.predict(), undefined);
  }
  f.views.G.state = 'between';
  f.views.G.stage = 8;
  assert.equal(f.predict(), undefined);
});
