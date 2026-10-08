import test from 'node:test';
import assert from 'node:assert/strict';
import { createCombatScore } from '../../src/game/progression/combat-score.ts';
import { bindCombatScoreFeedback } from '../../src/presentation/combat-score.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
function fixture() {
  const runtime = runStartSession(37, setup),
    f = enemyKillFixture(runtime);
  return { ...f, score: createCombatScore(() => f.views) };
}
test('score rule commits before display reactions and preserves Zen label behavior', () => {
  const f = fixture(),
    trace = [];
  const dispose = bindCombatScoreFeedback(f.events, () => ({
    W: 200,
    H: 400,
    setScore: () => trace.push(f.views.G.score),
    pop: (...args) => trace.push(args),
  }));
  const amount = f.score.addScore(100, 40, 50, 'bonus', 12);
  assert.equal(trace[0], f.views.G.score);
  assert.deepEqual(trace[1], [40, 50, `bonus +${amount}`, 12]);
  f.views.G.zen = true;
  trace.length = 0;
  f.score.addScore(100, 40, 50);
  assert.equal(trace.length, 1);
  f.score.addScore(100, 40, 50, 'label');
  assert.deepEqual(trace.at(-1), [40, 50, 'label', undefined]);
  dispose();
  const count = trace.length;
  f.score.addScore(100, 0, 0);
  assert.equal(trace.length, count);
});
test('combo breaks keep banner floor and bank Rekindle once through actual rules', () => {
  const f = fixture(),
    G = f.views.G,
    breaks = [];
  G.state = 'playing';
  G.combo = 24;
  G.bless.add('banner');
  G.bless.add('rekindle');
  G.blessingTriggers.precisionProgress = 3;
  G.blessingTriggers.stormProgress = 2;
  f.events.on('comboBroken', (event) => breaks.push(event));
  f.score.breakCombo();
  assert.equal(G.combo, 10);
  assert.equal(G.blessingTriggers.rekindleBank, 7);
  assert.equal(G.blessingTriggers.precisionProgress, 0);
  assert.equal(G.blessingTriggers.stormProgress, 0);
  f.score.breakCombo();
  assert.deepEqual(breaks, [{ previous: 24 }]);
});
test('combo progression listens without owning maximum run combo mutation', () => {
  const f = fixture(),
    G = f.views.G;
  G.combo = 17;
  f.score.bumpCombo();
  assert.equal(G.maxCombo, 17);
  assert.equal(f.views.ST.bestCombo, 17);
  f.dispose();
  G.combo = 21;
  f.score.bumpCombo();
  assert.equal(G.maxCombo, 21);
  assert.equal(f.views.ST.bestCombo, 17);
});
