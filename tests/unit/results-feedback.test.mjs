import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { resultsSessionFixture } from './helpers/runtime-results-session.mjs';
import { accrueRunReward } from '../../src/game/progression/run-rewards.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
for (const mode of ['normal', 'daily', 'recovery'])
  test(`actual ${mode} result settlement and completion preserve rules without display listeners`, () => {
    function drive(enabled) {
      const runtime = runStartSession(123, setup),
        f = resultsSessionFixture(runtime, enabled);
      const G = runtime.run,
        v = f.views,
        renders = [],
        sequences = [];
      G.state = 'dead';
      G.reviveOfferResolved = true;
      G.score = 240;
      G.maxCombo = 4;
      G.newUnlocks = [{ k: '開', n: 'Test', type: 'blade' }];
      v.events.on('resultRendered', (e) => {
        assert.ok(Object.isFrozen(e));
        assert.ok(Object.isFrozen(e.run));
        assert.ok(Object.isFrozen(e.record));
        assert.ok(Object.isFrozen(e.reward));
        assert.ok(Object.isFrozen(e.run.newUnlocks));
        assert.ok(e.run.newUnlocks.every(Object.isFrozen));
        renders.push(e);
      });
      v.events.on('resultSequence', (e) => {
        assert.ok(Object.isFrozen(e));
        assert.ok(Object.isFrozen(e.reward));
        assert.ok(Object.isFrozen(e.reveals));
        assert.ok(e.reveals.every(Object.isFrozen));
        sequences.push(e);
      });
      if (!enabled)
        for (const name of [
          'renderGameOver',
          'showScreen',
          'hud',
          'clearHints',
          'setBestLine',
          'toast',
          'updateSavedRunButtons',
        ])
          v[name] = () => assert.fail(`rule controller must not call ${name}`);
      if (mode === 'daily') v.activeDaily = { day: '2026-10-08' };
      if (mode === 'recovery') {
        const checkpoint = JSON.parse(
          readFileSync(
            new URL('../fixtures/runtime-refactor/playing.json', import.meta.url),
            'utf8',
          ),
        );
        v.store.set('issen.supportReward', {
          id: '01234567-0123-4567-89ab-0123456789ab',
          hundredths: 500,
          reward: { before: 0, after: 2, gained: 2 },
          checkpoint,
        });
        f.flow.recoverSupportReward();
      } else {
        for (const event of ['kill', 'wave', 'boss']) accrueRunReward(v.rewardLedger, event);
        f.flow.showOver();
        const balance = v.META.embers;
        f.flow.showOver();
        assert.equal(v.META.embers, balance);
        assert.equal(renders.length, 1);
      }
      assert.equal(G.state, 'over');
      if (mode === 'daily') assert.equal(G.overReady, true);
      else {
        assert.equal(G.overReady, false);
        assert.equal(sequences.length, 1);
        if (enabled) f.sequences[0][2]();
        else f.flow.completeResultSequence(sequences[0].id);
        assert.equal(G.overReady, true);
      }
      const outcome = structuredClone({
        run: G,
        stats: v.ST,
        meta: v.META,
        ledger: v.rewardLedger,
        writes: [...f.saved],
        random: runtime.random.state(),
      });
      const snapshot = renders[0],
        oldScore = snapshot.run.score;
      G.score += 999;
      G.newUnlocks.push({ k: '後', n: 'Later', type: 'blade' });
      assert.equal(snapshot.run.score, oldScore);
      if (mode !== 'recovery') assert.equal(snapshot.run.newUnlocks.length, 1);
      f.disposeFeedback();
      const before = f.trace.length;
      v.events.emit('resultRendered', snapshot);
      v.events.emit('resultReady', { ready: false });
      v.events.emit('resultCue', { kind: 'saveFailed' });
      v.events.emit('resultCue', { kind: 'reset' });
      assert.equal(f.trace.length, before);
      return outcome;
    }
    assert.deepEqual(drive(true), drive(false));
  });

test('replaced result sequences release stale completion actions without changing the new readiness', () => {
  const runtime = runStartSession(123, setup),
    f = resultsSessionFixture(runtime),
    ids = [];
  f.views.events.on('resultSequence', (e) => ids.push(e.id));
  runtime.run.state = 'dead';
  runtime.run.reviveOfferResolved = true;
  f.flow.showOver();
  runtime.run.state = 'dead';
  f.flow.showOver();
  assert.equal(ids.length, 2);
  assert.equal(runtime.run.overReady, false);
  f.flow.completeResultSequence(ids[0]);
  assert.equal(runtime.run.overReady, false);
  f.flow.completeResultSequence(ids[1]);
  assert.equal(runtime.run.overReady, true);
});
test('support rollback and exactly-once bonus remain independent of result feedback subscriptions', async () => {
  async function drive(enabled) {
    const runtime = runStartSession(123, setup),
      f = resultsSessionFixture(runtime, enabled),
      v = f.views;
    v.rewardScreen.offer = async () => true;
    const pending = {
      id: '01234567-0123-4567-89ab-0123456789ab',
      hundredths: 500,
      reward: { before: 0, after: 2, gained: 2 },
    };
    const before = structuredClone(v.META),
      events = [];
    v.events.on('resultCue', (e) => events.push(e));
    v.saveMeta = () => false;
    assert.equal(await f.flow.claimEmberBonus(pending), null);
    assert.deepEqual(v.META, before);
    assert.ok(events.some((e) => e.kind === 'saveFailed'));
    v.saveMeta = () => true;
    const bonus = await f.flow.claimEmberBonus(pending);
    assert.equal(bonus.gained, 7);
    const balance = v.META.embers;
    assert.equal(await f.flow.claimEmberBonus(pending), null);
    assert.equal(v.META.embers, balance);
    f.disposeFeedback();
    return structuredClone({
      run: runtime.run,
      stats: v.ST,
      meta: v.META,
      saved: [...f.saved],
      random: runtime.random.state(),
      bonus,
    });
  }
  assert.deepEqual(await drive(true), await drive(false));
});
