import test from 'node:test';
import assert from 'node:assert/strict';
import { stateView, cacheView } from '../../src/game/session/state-view.ts';
import { createRuntimeSessionState } from '../../src/game/session/runtime-state.ts';
import { createRunStart } from '../../src/game/session/run-start.ts';
import { createDeathPhase } from '../../src/game/phases/death.ts';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';

test('named state projections keep replacement identity and defer later service reads', () => {
  const state = { ledger: { pending: 1 }, ready: false, privateFlag: true };
  let service;
  let reads = 0;
  const ports = { get service() { reads++; return service; } };
  const view = stateView(state, ['ledger', 'ready'], ports);
  assert.equal(reads, 0);
  assert.deepEqual(Object.keys(view).sort(), ['ledger', 'ready', 'service']);
  assert.equal(Object.hasOwn(view, 'privateFlag'), false);
  state.ledger = { pending: 2 };
  assert.equal(view.ledger, state.ledger);
  const replacement = { pending: 3 };
  view.ledger = replacement;
  assert.equal(state.ledger, replacement);
  service = { start() {} };
  assert.equal(view.service, service);
  assert.equal(reads, 1);
  view.ready = true;
  assert.equal(state.ready, true);
});

test('state projections reject a competing port without evaluating it', () => {
  let reads = 0;
  assert.throws(() => stateView({ value: 1 }, ['value'], {
    get value() { reads++; return 2; },
  }), /Duplicate state view field: value/);
  assert.equal(reads, 0);
});

test('actual run entry writes replacement ledger, reveals and clocks into the session owner', () => {
  const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
  const f = runStartSession(123456, setup, undefined, false);
  const state = createRuntimeSessionState(f.views.META, f.views.SETUP, true, () => null);
  const keys = ['runTemplate', 'rewardLedger', 'runBossMilestone', 'runItemReveals',
    'savedRun', 'shrineOfferIds', 'hitStop', 'timeScale'];
  const descriptors = Object.getOwnPropertyDescriptors(f.views);
  for (const key of keys) delete descriptors[key];
  const ports = Object.defineProperties({}, descriptors);
  const views = stateView(state, keys, ports);
  const oldLedger = state.rewardLedger;
  state.hitStop = 1;
  state.timeScale = 0.3;
  state.runItemReveals.push({ id: 'old' });
  state.runBossMilestone = 8;
  createRunStart(views).startRun();
  assert.notEqual(state.rewardLedger, oldLedger);
  assert.equal(views.rewardLedger, state.rewardLedger);
  assert.deepEqual(state.runItemReveals, []);
  assert.equal(state.runBossMilestone, 0);
  assert.equal(state.hitStop, 0);
  assert.equal(state.timeScale, 1);
  assert.equal(f.run.seed, 123456);
  assert.equal(f.run.state, 'playing');
});


test('cached phase views observe replaced geometry, profile and trial activity during actual damage', () => {
  const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
  const runtime = runStartSession(3441, setup), fixture = deathPhaseFixture(runtime);
  const geometry = { L: fixture.views.L }, profile = { ST: fixture.views.ST };
  const clocks = { hitStop: 0, timeScale: 1 };
  const activity = { activeTrial: null, trialFailure: '' };
  const descriptors = Object.getOwnPropertyDescriptors(fixture.views);
  for (const key of ['L', 'ST', 'hitStop', 'timeScale', 'activeTrial', 'trialFailure'])
    delete descriptors[key];
  const ports = Object.defineProperties({}, descriptors);
  const readViews = cacheView(() => stateView(geometry, ['L'],
    stateView(profile, ['ST'], stateView(clocks, ['hitStop', 'timeScale'],
      stateView(activity, ['activeTrial', 'trialFailure'], ports)))));
  const phase = createDeathPhase(readViews), struck = [];
  runtime.views.events.on('struck', event => struck.push(event));
  runtime.run.lives = 2;
  phase.playerDie(null, 'wrong');
  assert.equal(runtime.run.lives, 1);
  assert.equal(clocks.hitStop, 0.08);
  const oldProfile = structuredClone(profile.ST);
  const oldProfileRecord = profile.ST;
  geometry.L = { player: { x: 301, y: 402, h: 153 } };
  profile.ST = structuredClone(profile.ST);
  activity.activeTrial = { id: 'live-trial' };
  phase.playerDie(null, 'late');
  assert.equal(activity.trialFailure, 'A mistake');
  assert.equal(runtime.run.lives, 1);
  assert.equal(struck.length, 1);
  activity.activeTrial = null;
  phase.playerDie(null, 'feint');
  assert.equal(runtime.run.state, 'dead');
  assert.equal(clocks.timeScale, 0.3);
  assert.equal(profile.ST.feinted, (oldProfile.feinted || 0) + 1);
  assert.deepEqual(oldProfileRecord, oldProfile);
  assert.deepEqual(struck.at(-1), {
    reason: 'feint', lives: 0, fatal: true, lifeLost: true,
    x: 301, y: 402, height: 153, label: '',
  });
  assert.ok(Object.isFrozen(struck.at(-1)));
  geometry.L.player.x = 999;
  assert.equal(struck.at(-1).x, 301);
});
