import test from 'node:test';
import assert from 'node:assert/strict';
import { createBetweenPhase } from '../../src/game/phases/between.ts';
import { createRunState } from '../../src/game/run-state.ts';
function fixture() {
  const G = createRunState(),
    trace = [];
  const views = {
    G,
    activeTrial: null,
    trialFailure: '',
    finishTrial(message) {
      G.state = 'title';
      trace.push(['trial', message]);
    },
    startTrialEncounter() {
      G.state = 'playing';
      trace.push('encounter');
    },
    startBoss() {
      G.state = 'boss';
      trace.push('boss');
    },
    openShrine() {
      G.state = 'shrine';
      trace.push('shrine');
    },
    nextStep() {
      G.state = 'playing';
      trace.push('wave');
    },
  };
  G.state = 'between';
  G.nextT = 0.1;
  return { views, trace, phase: createBetweenPhase(() => views) };
}
test('between timer opens the boss, shrine or next wave once, and pauses outside its phase', () => {
  for (const expected of ['boss', 'shrine', 'wave']) {
    const f = fixture();
    f.views.G.wave = expected === 'boss' ? 3 : 4;
    f.views.G.afterBoss = expected === 'shrine';
    f.views.G.state = 'paused';
    f.phase.update(f.views, 1);
    assert.equal(f.views.G.nextT, 0.1);
    f.views.G.state = 'between';
    f.phase.update(f.views, 0.2);
    f.phase.update(f.views, 0.2);
    assert.deepEqual(f.trace, [expected]);
    assert.equal(f.views.G.afterBoss, false);
  }
});
test('between timer retries trial encounters or finishes the attempt with its failure', () => {
  const f = fixture();
  f.views.activeTrial = { waveCount: 3 };
  f.views.G.wave = 1;
  f.phase.update(f.views, 0.2);
  assert.deepEqual(f.trace, ['encounter']);
  f.views.G.state = 'between';
  f.views.G.nextT = 0;
  f.views.trialFailure = 'missed';
  f.phase.update(f.views, 0.2);
  assert.deepEqual(f.trace.at(-1), ['trial', 'missed']);
});
