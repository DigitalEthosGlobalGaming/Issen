import test from 'node:test';
import assert from 'node:assert/strict';
import { encounterScenery, predictNextStage } from '../../src/game/session/stage-progression.ts';
import { createStageVisitSeeds } from '../../src/rendering/environment/stage-variation.ts';
import { TRIALS } from '../../src/game/content/trials.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';

test('shared encounter scenery preserves normal and rush stage/lap sequences through ten laps', () => {
  for (let ordinal = 1; ordinal <= 270; ordinal++) {
    assert.deepEqual(encounterScenery(ordinal), {
      stage: Math.floor((ordinal - 1) / 3) % 9,
      lap: Math.floor((ordinal - 1) / 27),
    });
    assert.deepEqual(encounterScenery(ordinal, true), {
      stage: (ordinal - 1) % 9,
      lap: Math.floor((ordinal - 1) / 9),
    });
  }
});

test('predicted wave visits match actual encounter entry without changing state or combat randomness', () => {
  const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
  const measured = runStartSession(4132, setup),
    control = runStartSession(4132, setup);
  const a = waveLifecycleFixture(measured),
    b = waveLifecycleFixture(control);
  const predicted = createStageVisitSeeds(19),
    plain = createStageVisitSeeds(19);
  predicted.enter(0);
  plain.enter(0);
  const wire = (fixture, visits) => {
    const original = fixture.views.setStage;
    fixture.views.setStage = (stage, animate) => {
      visits.enter(stage);
      original(stage, animate);
    };
  };
  wire(a, predicted);
  wire(b, plain);
  let nextSeed;
  for (let wave = 1; wave <= 81; wave++) {
    a.lifecycle.startWave(wave, true);
    b.lifecycle.startWave(wave, true);
    const before = structuredClone(a.views.G);
    const count = predicted.visits,
      seed = predicted.seed;
    const next = predictNextStage(a.views.G, false, false);
    const expectedSeed = predicted.peek(next);
    assert.deepEqual(a.views.G, before);
    assert.equal(predicted.visits, count);
    assert.equal(predicted.seed, seed);
    assert.equal(predicted.seed, plain.seed);
    assert.deepEqual(a.views.G, b.views.G);
    assert.equal(measured.random.state(), control.random.state());
    if (wave % 3 === 1 && wave > 1) assert.equal(predicted.seed, nextSeed);
    nextSeed = expectedSeed;
  }
  assert.deepEqual(a.trace, b.trace);
});

test('daily wave and rush predictions preserve upcoming visit seeds through three complete cycles', () => {
  for (const rush of [false, true]) {
    const predicted = createStageVisitSeeds(0xffffffff),
      plain = createStageVisitSeeds(0xffffffff);
    let expectedSeed;
    for (let wave = 1; wave <= (rush ? 27 : 81); wave++) {
      const { stage } = encounterScenery(wave, rush);
      const entered = predicted.enter(stage);
      assert.equal(entered, plain.enter(stage));
      if (wave > 1 && (rush || wave % 3 === 1)) assert.equal(entered, expectedSeed);
      const next = predictNextStage({ state: 'between', wave, stage, rush }, false, false);
      assert.equal(next, (stage + 1) % 9);
      expectedSeed = predicted.peek(next);
      assert.equal(predicted.visits, plain.visits);
      assert.equal(predicted.seed, plain.seed);
    }
  }
});

test('next-stage prediction handles rush wraps, fixed trials, cinematic choices and inactive runs', () => {
  const run = { state: 'boss', wave: 9, stage: 8, rush: true };
  assert.equal(predictNextStage(run, false, false), 0);
  assert.equal(predictNextStage({ ...run, state: 'between' }, false, false), 0);
  assert.equal(predictNextStage({ ...run, state: 'paused' }, false, false), 0);
  for (const trial of TRIALS) {
    assert.equal(predictNextStage({ ...run, stage: 0, wave: 1 }, !!trial, false), undefined);
  }
  assert.equal(predictNextStage(run, false, true), undefined);
  for (const state of ['title', 'over', 'dead'])
    assert.equal(predictNextStage({ ...run, state }, false, false), undefined);
  assert.equal(predictNextStage({ ...run, stage: 0 }, false, false), undefined);
  for (const wave of [0, -1, NaN, Infinity, 1.5])
    assert.equal(predictNextStage({ ...run, wave }, false, false), undefined);
});
