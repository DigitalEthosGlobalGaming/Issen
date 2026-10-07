import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkpointSession } from './helpers/runtime-checkpoint-session.mjs';
import { restorableRng } from '../../src/shared/random.ts';
import { parseRunCheckpoint } from '../../src/platform/run-checkpoint.ts';
import { createGrunt as spawnEnemy } from '../../src/game/combat/grunt-spawn.ts';
import { advanceGrunts } from '../../src/game/combat/grunt.ts';
import { updateWave } from '../../src/game/encounters/waves.ts';
import { advanceBoss as updateBoss } from '../../src/game/encounters/boss-simulation.ts';
import { updateStandoff, resolveStandoffSwipe } from '../../src/game/encounters/standoff.ts';
import { BLESS_BY } from '../../src/game/content/blessings.ts';
import { applyBlessing } from '../../src/game/shrine/blessings.ts';

const position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
for (const phase of ['playing', 'boss', 'standoff', 'shrine'])
  test(`old ${phase} checkpoint remains playable and round-trips plain records`, () => {
    const original = JSON.parse(
      readFileSync(new URL(`../fixtures/runtime-refactor/${phase}.json`, import.meta.url), 'utf8'),
    );
    const checkpoint = parseRunCheckpoint(structuredClone(original));
    assert.ok(checkpoint);
    assert.equal(checkpoint.version, 1);
    assert.equal(checkpoint.run.state, phase);
    const session = checkpointSession(checkpoint, position);
    const run = session.views.G,
      random = session.views.runRandom;
    const comparison = restorableRng(checkpoint.seed);
    comparison.restore(checkpoint.randomState);
    assert.equal(random.next(), comparison.next());
    if (phase === 'playing') {
      for (let tick = 0; tick < 100; tick++) {
        advanceGrunts(run, 0.02, {
          surge: 0,
          time: tick * 0.02,
          perfectZone: () => 0.78,
          pet: 'none',
          sounds: { bell() {}, feint() {}, bark() {} },
          foxSave() {},
          playerDie() {
            assert.fail('fixture must offer a playable opening');
          },
          position,
        });
        updateWave(
          run,
          0.02,
          {
            spawn: (slot) => spawnEnemy(run, slot, false, position, random.next),
            attack() {},
            cleared() {},
          },
          random.next,
        );
      }
      assert.ok(run.enemies.length > 0);
      assert.ok(run.enemies.some((e) => ['idle', 'attack'].includes(e.state)));
    } else if (phase === 'boss') {
      const before = run.boss.t;
      updateBoss(run, 0.02, {
        random: random.next,
        sounds: { glint() {}, feint() {} },
        flash() {},
        playerDie() {
          assert.fail('boss fixture should not expire');
        },
        recovered() {},
        position,
      });
      assert.ok(run.boss.t > before);
      assert.ok(Number.isFinite(run.boss.pos.x));
    } else if (phase === 'standoff') {
      const events = {
        nextWave() {},
        step() {},
        draw() {},
        late() {
          assert.fail('standoff fixture must expose the draw');
        },
      };
      while (!run.so.fired) updateStandoff(run, 0.01, events, random.next);
      assert.equal(resolveStandoffSwipe(run.so, run.so.e.dir), 'cut');
    } else {
      assert.ok(checkpoint.offers.length > 0);
      for (const id of checkpoint.offers) assert.ok(BLESS_BY[id]);
      const choice = checkpoint.offers[0];
      run.bless.add(choice);
      applyBlessing(run, choice, random.next);
      assert.ok(run.bless.has(choice));
    }
    session.flow.captureCheckpoint();
    const restored = session.read();
    assert.ok(restored);
    assert.equal(restored.version, original.version);
    assert.equal(restored.seed, original.seed);
    assert.equal(restored.randomState, random.state());
    assert.deepEqual(Object.keys(restored).sort(), Object.keys(original).sort());
    assert.equal(Object.getPrototypeOf(restored.run), Object.prototype);
  });

function savedWave() {
  return parseRunCheckpoint(
    JSON.parse(
      readFileSync(new URL('../fixtures/runtime-refactor/playing.json', import.meta.url), 'utf8'),
    ),
  );
}

test('actual saved-run continuation restores the saved RNG and keeps later secret discoveries', () => {
  const checkpoint = savedWave(),
    session = checkpointSession(checkpoint, position);
  session.flow.captureCheckpoint();
  session.views.G.score += 999;
  session.views.ST.fidget = 1;
  session.views.runRandom.next();
  session.flow.continueSavedRun();
  assert.equal(session.views.G.score, checkpoint.run.score);
  assert.equal(session.views.ST.fidget, 1);
  assert.equal(session.views.runRandom.state(), checkpoint.randomState);
  assert.deepEqual(session.trace, [['screen', null], 'clock']);
});

test('actual saved-run abandonment checkpoints quit and enters results once', () => {
  const session = checkpointSession(savedWave(), position);
  session.flow.captureCheckpoint();
  session.flow.abandonSavedRun();
  session.flow.abandonSavedRun();
  assert.equal(session.views.G.state, 'over');
  assert.equal(session.read().status, 'ended');
  assert.equal(session.read().run.reason, 'quit');
  assert.deepEqual(session.trace, ['over']);
});
