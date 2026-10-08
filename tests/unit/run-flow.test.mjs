import { createEventBus } from '../../src/game/events.ts';
import { bindRunFlowFeedback } from '../../src/ui/wiring/run-flow-feedback.ts';
import { bindCheckpointFeedback } from '../../src/ui/wiring/checkpoint-feedback.ts';
import { bindShrineFeedback } from '../../src/ui/wiring/shrine-feedback.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunFlow } from '../../src/game/session/run-flow.ts';
import { createRunState } from '../../src/game/run-state.ts';
import { parseStatistics, DEFAULT_EQUIPMENT } from '../../src/platform/saves.ts';
import { BLESS } from '../../src/game/content/blessings.ts';

function fixture(feedback = true) {
  const G = createRunState(),
    trace = [],
    playerStats = parseStatistics({}),
    playerEquipment = { ...DEFAULT_EQUIPMENT };
  const views = {
    events: createEventBus(),
    $: () => ({
      classList: {
        remove(name) {
          trace.push(`remove:${name}`);
        },
      },
    }),
    G,
    playerStats,
    playerEquipment,
    ST: playerStats,
    EQ: playerEquipment,
    activeDaily: null,
    timeScale: 0.3,
    shrineOfferIds: null,
    contextLost: false,
    P: { fall: 1, pose: { lean: 8 } },
    PREST: { lean: 0 },
    presentationState: { lbT: 2 },
    audio: {
      setPaused(value) {
        trace.push(['audio', value]);
      },
    },
    guided: { frozen: false },
    applySeal() {},
    clearHints() {},
    refreshArmoryNew() {},
    showScreen(id) {
      trace.push(['screen', id]);
    },
    hud() {},
    setStage(index) {
      G.stage = index;
    },
    setupAttract() {},
    setBestLine() {},
    saveStats() {
      trace.push('saveStats');
    },
    checkUnlocks() {
      trace.push('checkUnlocks');
    },
    showPauseScreen() {
      trace.push('pause');
    },
    showShrineOffers(offers) {
      trace.push(['offers', offers.map((x) => x.id)]);
    },
    renderTrialObjective() {},
    resetClock() {
      trace.push('clock');
    },
    captureCheckpoint(status) {
      trace.push(['checkpoint', status, G.state, G.reason]);
    },
    showOver() {
      trace.push('over');
      G.state = 'over';
    },
  };
  const off = feedback
    ? [
        bindRunFlowFeedback(views.events, () => views),
        bindCheckpointFeedback(views.events, () => views),
        bindShrineFeedback(views.events, () => views),
      ]
    : [];
  return {
    views,
    trace,
    flow: createRunFlow(views),
    dispose() {
      off.forEach((fn) => fn());
    },
  };
}

test('actual run-flow pause counts accepted pauses and records the secret once in current statistics', () => {
  const { views, trace, flow } = fixture();
  views.ST = parseStatistics({});
  views.G.state = 'title';
  flow.pause();
  assert.equal(views.G.pauseN, 0);
  for (let i = 0; i < 12; i++) {
    views.G.state = 'playing';
    flow.pause();
    flow.pause();
    assert.equal(views.G.pausedFrom, 'playing');
  }
  assert.equal(views.G.pauseN, 12);
  assert.equal(views.ST.fidget, 1);
  assert.equal(views.playerStats.fidget, 0);
  assert.equal(trace.filter((x) => x === 'saveStats').length, 1);
  assert.equal(trace.filter((x) => x === 'checkUnlocks').length, 1);
});

test('actual resume waits for restored graphics and keeps teaching audio paused', () => {
  const { views, trace, flow } = fixture();
  views.G.state = 'paused';
  views.G.pausedFrom = 'boss';
  views.contextLost = true;
  flow.resume();
  assert.equal(views.G.state, 'paused');
  assert.deepEqual(trace, []);
  views.contextLost = false;
  views.guided.frozen = true;
  flow.resume();
  assert.equal(views.G.state, 'boss');
  assert.deepEqual(trace, [['audio', true], ['screen', null], 'clock']);
});

test('actual shrine resume uses saved valid offers rather than generating new picks', () => {
  const { views, trace, flow } = fixture();
  views.G.state = 'paused';
  views.G.pausedFrom = 'shrine';
  views.shrineOfferIds = [BLESS[0].id, 'invalid'];
  flow.resume();
  assert.equal(views.G.state, 'shrine');
  assert.deepEqual(
    trace.find((x) => Array.isArray(x) && x[0] === 'offers'),
    ['offers', [BLESS[0].id]],
  );
});

test('actual title flow restores profile identities and leaves permanent progress intact', () => {
  const { views, flow } = fixture();
  views.playerStats.kills = 123;
  views.ST = parseStatistics({ kills: 999 });
  views.EQ = { ...DEFAULT_EQUIPMENT, blade: 'trial' };
  views.activeDaily = {};
  views.G.state = 'over';
  views.G.stage = 3;
  views.G.blade = true;
  views.G.zen = true;
  flow.toTitle();
  assert.equal(views.ST, views.playerStats);
  assert.equal(views.EQ, views.playerEquipment);
  assert.equal(views.ST.kills, 123);
  assert.equal(views.activeDaily, null);
  assert.equal(views.G.state, 'title');
  assert.equal(views.G.stage, 0);
  assert.equal(views.G.blade, false);
  assert.equal(views.G.zen, false);
  assert.equal(views.timeScale, 1);
  assert.equal(views.P.fall, 0);
  assert.deepEqual(views.P.pose, views.PREST);
  assert.notEqual(views.P.pose, views.PREST);
});

test('actual end-run checkpoints quit before entering results and cannot settle twice', () => {
  const { views, trace, flow } = fixture();
  views.G.state = 'paused';
  views.G.pausedFrom = 'playing';
  flow.endRun();
  flow.endRun();
  assert.deepEqual(trace, [['checkpoint', 'ended', 'playing', 'quit'], 'over']);
  assert.equal(views.G.state, 'over');
});

test('actual title/pause/resume/end transitions preserve profile and player rules without display listeners', () => {
  function drive(enabled) {
    const f = fixture(enabled),
      snapshots = [];
    f.views.events.on('runFlowCue', (event) => {
      assert.ok(Object.isFrozen(event));
      snapshots.push(event);
    });
    f.views.G.state = 'playing';
    for (let i = 0; i < 12; i++) {
      f.flow.pause();
      f.flow.resume();
    }
    f.flow.pause();
    f.flow.endRun();
    f.views.ST = parseStatistics({ kills: 999 });
    f.views.activeDaily = {};
    f.views.G.stage = 3;
    f.flow.toTitle();
    assert.equal(f.views.ST, f.views.playerStats);
    assert.equal(f.views.EQ, f.views.playerEquipment);
    const outcome = structuredClone({
      run: f.views.G,
      stats: f.views.ST,
      equipment: f.views.EQ,
      player: f.views.P,
      timeScale: f.views.timeScale,
    });
    assert.ok(snapshots.some((x) => x.kind === 'pause'));
    assert.ok(snapshots.some((x) => x.kind === 'title'));
    f.dispose();
    const before = f.trace.length;
    f.views.events.emit('runFlowCue', { kind: 'pause' });
    assert.equal(f.trace.length, before);
    return outcome;
  }
  assert.deepEqual(drive(true), drive(false));
});
