import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkpointSession } from './helpers/runtime-checkpoint-session.mjs';
import { bindCheckpointFeedback } from '../../src/ui/wiring/checkpoint-feedback.ts';
import { bindShrineFeedback } from '../../src/ui/wiring/shrine-feedback.ts';
import { parseRunCheckpoint } from '../../src/platform/run-checkpoint.ts';
import { restorableRng } from '../../src/shared/random.ts';

const position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
const fixture = (phase) =>
  parseRunCheckpoint(
    JSON.parse(
      readFileSync(new URL(`../fixtures/runtime-refactor/${phase}.json`, import.meta.url), 'utf8'),
    ),
  );
for (const phase of ['playing', 'boss', 'standoff', 'shrine']) {
  test(`actual saved ${phase} restoration and continuation preserve rules without UI listeners`, () => {
    function drive(enabled) {
      const session = checkpointSession(fixture(phase), position, false);
      const calls = [],
        nodes = new Map(),
        visual = restorableRng(91);
      const call =
        (name) =>
        (...args) => {
          calls.push([name, ...args]);
          visual.next();
        };
      const ui = {
        $: (id) => {
          if (!nodes.has(id))
            nodes.set(id, {
              textContent: '',
              classList: { toggle: call(`${id}:toggle`), remove: call(`${id}:remove`) },
            });
          return nodes.get(id);
        },
        renderLives: call('lives'),
        setScore: call('score'),
        applySeal: call('seal'),
        hud: call('hud'),
        renderHp: call('hp'),
        toast: call('toast'),
        updateSavedRunButtons: call('saved'),
        showScreen: call('screen'),
        showShrineOffers: (offers) => call('offers')(offers.map((x) => x.id)),
        sfx: { unlock: call('unlock') },
      };
      const off = enabled ? bindCheckpointFeedback(session.views.events, () => ui) : () => {};
      const offShrine = enabled ? bindShrineFeedback(session.views.events, () => ui) : () => {};
      const order = [];
      session.views.events.on('checkpointRestored', (event) => {
        assert.ok(Object.isFrozen(event));
        order.push('restored');
      });
      session.views.adoptPhase = () => {
        order.push('adopt');
      };
      session.flow.captureCheckpoint();
      session.views.G.score += 999;
      session.views.ST.fidget = 1;
      session.views.runRandom.next();
      session.flow.continueSavedRun();
      assert.deepEqual(order, ['restored', 'adopt']);
      assert.equal(session.views.ST.fidget, 1);
      assert.equal(session.views.runRandom.state(), fixture(phase).randomState);
      const snapshot = session.snapshots.at(-1);
      const outcome = structuredClone({
        run: session.views.G,
        stats: session.views.ST,
        equipment: session.views.EQ,
        weather: session.views.WX,
        saved: session.read(),
        writes: [...session.saved],
        random: session.views.runRandom.state(),
      });
      if (enabled) {
        assert.deepEqual(
          calls.slice(1, 5).map((x) => x[0]),
          ['lives', 'score', 'seal', 'hud'],
        );
        assert.ok(nodes.get('waveLbl').textContent.length > 0);
        if (phase === 'boss') {
          assert.equal(nodes.get('bossN').textContent, session.views.G.boss.def.n);
          assert.ok(calls.some((x) => x[0] === 'bossbar:toggle' && x[1] === 'on' && x[2] === true));
        }
        assert.ok(calls.some((x) => x[0] === (phase === 'shrine' ? 'offers' : 'screen')));
      } else assert.equal(calls.length, 0);
      session.views.G.wave += 10;
      if (session.views.G.boss) session.views.G.boss = null;
      assert.equal(snapshot.wave, fixture(phase).run.wave);
      assert.equal(snapshot.bossName, fixture(phase).run.boss?.def.n ?? null);
      off();
      offShrine();
      const before = calls.length;
      session.flow.restoreCheckpoint(fixture(phase));
      session.flow.captureCheckpoint();
      session.flow.continueSavedRun();
      assert.equal(calls.length, before, 'disposed UI receives no further checkpoint reactions');
      return outcome;
    }
    assert.deepEqual(drive(true), drive(false));
  });
}

test('checkpoint save failure preserves persistence and refreshes UI at the original boundary', () => {
  const session = checkpointSession(fixture('playing'), position, false),
    order = [];
  const ui = {
    toast: (value) => order.push(['toast', value.msg]),
    updateSavedRunButtons: () => order.push(['buttons']),
  };
  const off = bindCheckpointFeedback(session.views.events, () => ui);
  session.flow.captureCheckpoint();
  const saved = structuredClone(session.views.savedRun);
  order.length = 0;
  session.views.persistence.write = () => {
    order.push(['write']);
    return false;
  };
  session.flow.captureCheckpoint();
  assert.deepEqual(order, [
    ['write'],
    ['toast', 'Run could not be saved on this device.'],
    ['buttons'],
  ]);
  assert.deepEqual(session.views.savedRun, saved);
  order.length = 0;
  session.views.sceneLoading = true;
  session.flow.captureCheckpoint('ended');
  assert.equal(session.read(), null);
  assert.equal(session.views.savedRun, null);
  assert.deepEqual(order, [], 'loading exit retains its original silent early return');
  off();
});
