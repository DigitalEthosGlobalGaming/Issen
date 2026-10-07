import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { resultsSessionFixture } from './helpers/runtime-results-session.mjs';
import { accrueRunReward } from '../../src/game/progression/run-rewards.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
function fixture() {
  const runtime = runStartSession(123, setup),
    f = resultsSessionFixture(runtime);
  runtime.run.state = 'dead';
  runtime.run.reviveOfferResolved = true;
  runtime.run.score = 240;
  runtime.run.maxCombo = 4;
  return { runtime, ...f };
}
test('actual terminal orchestration records and settles a run once before results become ready', () => {
  const { runtime, views, flow, sequences, trace } = fixture();
  for (const event of ['kill', 'wave', 'boss']) accrueRunReward(views.rewardLedger, event);
  const before = views.META.embers;
  flow.showOver();
  assert.equal(runtime.run.state, 'over');
  assert.equal(runtime.run.overReady, false);
  assert.ok(views.META.embers > before);
  const balance = views.META.embers;
  assert.equal(sequences.length, 1);
  assert.equal(views.ST.bestScore, 240);
  flow.showOver();
  assert.equal(views.META.embers, balance);
  assert.equal(sequences.length, 1);
  assert.equal(trace.filter((v) => v === 'stats').length, 1);
  sequences[0][2]();
  assert.equal(runtime.run.overReady, true);
  assert.equal(views.$('bAgain').disabled, false);
});
test('daily and trial results route through their distinct settlement boundaries', () => {
  const { runtime, views, flow, saved, sequences, trace } = fixture();
  views.activeDaily = { day: '2026-10-08' };
  const balance = views.META.embers;
  flow.showOver();
  assert.equal(runtime.run.state, 'over');
  assert.equal(runtime.run.overReady, true);
  assert.equal(views.META.embers, balance);
  assert.ok(saved.has('issen.daily'));
  assert.equal(sequences.length, 0);
  views.activeDaily = null;
  views.activeTrial = {};
  runtime.run.state = 'dead';
  runtime.run.reason = 'quit';
  flow.showOver();
  assert.deepEqual(trace.at(-1), ['trial', 'You ended the attempt.']);
});
test('support bonus rolls back a failed save then grants the retried identity once', async () => {
  const { views, flow } = fixture();
  views.rewardScreen.offer = async () => true;
  const pending = {
    id: '01234567-0123-4567-89ab-0123456789ab',
    hundredths: 500,
    reward: { before: 0, after: 2, gained: 2 },
  };
  views.META.supportRewardClaim = 'previous-support-reward';
  const before = structuredClone(views.META);
  views.saveMeta = () => false;
  assert.equal(await flow.claimEmberBonus(pending), null);
  assert.deepEqual(views.META, before);
  views.saveMeta = () => true;
  const result = await flow.claimEmberBonus(pending);
  assert.equal(result.gained, 7);
  const balance = views.META.embers;
  assert.equal(await flow.claimEmberBonus(pending), null);
  assert.equal(views.META.embers, balance);
});
test('pending support recovery restores the existing v1 plain run and completes without replaying its base reward', () => {
  const { views, flow, saved, sequences, runtime } = fixture();
  const checkpoint = JSON.parse(
    readFileSync(new URL('../fixtures/runtime-refactor/playing.json', import.meta.url), 'utf8'),
  );
  const pending = {
    id: '01234567-0123-4567-89ab-0123456789ab',
    hundredths: 500,
    reward: { before: 0, after: 2, gained: 2 },
    checkpoint,
  };
  views.store.set('issen.supportReward', pending);
  const balance = views.META.embers;
  flow.recoverSupportReward();
  assert.equal(runtime.run.state, 'over');
  assert.equal(runtime.run.score, checkpoint.run.score);
  assert.ok(runtime.run.bless instanceof Set);
  assert.equal(views.META.embers, balance);
  assert.equal(sequences.length, 1);
  assert.equal(runtime.run.overReady, false);
  sequences[0][2]();
  assert.equal(saved.has('issen.supportReward'), false);
  assert.equal(runtime.run.overReady, true);
});
test('disposed async support flow grants no currency or revival after its awaited offer', async () => {
  const { views, flow, runtime, trace } = fixture();
  let finish;
  views.rewardScreen.offer = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  runtime.run.reviveOfferResolved = false;
  flow.showOver();
  assert.equal(views.rewardFlowBusy, true);
  views.lifecycle.disposed = true;
  finish(true);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(
    trace.some((v) => Array.isArray(v) && v[0] === 'revive'),
    false,
  );
  assert.equal(runtime.run.state, 'dead');
  assert.equal(runtime.run.secondWindUsed, false);
});

test('a failed first support save restores an absent identity marker and remains retryable', async () => {
  const { views, flow } = fixture();
  assert.equal(Object.hasOwn(views.META, 'supportRewardClaim'), false);
  views.rewardScreen.offer = async () => true;
  const pending = {
    id: '01234567-0123-4567-89ab-0123456789ab',
    hundredths: 500,
    reward: { before: 0, after: 2, gained: 2 },
  };
  const before = structuredClone(views.META);
  views.saveMeta = () => false;
  assert.equal(await flow.claimEmberBonus(pending), null);
  assert.deepEqual(views.META, before);
  views.saveMeta = () => true;
  assert.equal((await flow.claimEmberBonus(pending)).gained, 7);
  const balance = views.META.embers;
  assert.equal(await flow.claimEmberBonus(pending), null);
  assert.equal(views.META.embers, balance);
});
