import test from 'node:test';
import assert from 'node:assert/strict';
import { protectCombo, recoverAfterWave } from '../../src/game/progression/run-powers.ts';
import { createEffects } from '../../src/rendering/effects/state.ts';
import { updateEffects } from '../../src/rendering/effects/update.ts';

test('Composure preserves combo and spends exactly one run-local charge', () => {
  const run = { combo: 0, composure: 2 };
  assert.equal(protectCombo(run), false);
  assert.equal(run.composure, 2);
  run.combo = 12;
  assert.equal(protectCombo(run), true);
  assert.deepEqual(run, { combo: 12, composure: 1 });
  assert.equal(protectCombo(run), true);
  assert.equal(protectCombo(run), false);
});

test('Recovery counts cleared waves, respects cadence, caps and challenge exclusions', () => {
  for (const cadence of [3, 6]) {
    const run = {
      wavesCleared: 0,
      recoveryEvery: cadence,
      lives: 1,
      maxLives: 2,
      zen: false,
      hard: false,
    };
    for (let i = 1; i <= cadence; i++) assert.equal(recoverAfterWave(run), i === cadence);
    assert.equal(run.lives, 2);
    for (let i = 0; i < cadence; i++) assert.equal(recoverAfterWave(run), false);
    for (const excluded of [{ zen: true }, { hard: true }, { recoveryEvery: 0 }]) {
      const blocked = { ...run, lives: 1, wavesCleared: cadence - 1, ...excluded };
      assert.equal(recoverAfterWave(blocked), false);
      assert.equal(blocked.lives, 1);
    }
  }
});

test('knife projectile expires without leaking into an independent preview effect state', () => {
  const live = createEffects(),
    preview = createEffects();
  live.knives.push({ x0: 0, y0: 0, x1: 100, y1: 100, t: 0, life: 0.18 });
  const env = { scale: 1, wind: 0, time: 0, random: () => 0.5, onSwordStuck() {} };
  updateEffects(live, 0.1, 0.1, env);
  assert.equal(live.knives.length, 1);
  assert.equal(preview.knives.length, 0);
  updateEffects(live, 0.1, 0.1, env);
  assert.equal(live.knives.length, 0);
});
