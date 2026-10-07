import { createRunStart } from '../../../src/game/session/run-start.ts';
import { createTrialSession } from '../../../src/game/session/trials.ts';
import { bossPhaseFixture } from './runtime-boss-phase.mjs';
import { runStartSession } from './runtime-run-start-session.mjs';

const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
export function trialSessionFixture() {
  const runtime = runStartSession(3344, setup, undefined, false),
    source = runtime.views;
  const duel = bossPhaseFixture(runtime),
    trace = [],
    records = new Map();
  const views = {
    events: source.events,
    G: runtime.run,
    TRIAL_PROGRESS: { completed: [] },
    UNL: new Set(),
    R: () => 0.5,
    playerStats: source.playerStats,
    playerEquipment: source.playerEquipment,
    trialResult: null,
    deferUntilSceneReady: () => false,
    waveCfg: source.waveCfg,
    startBoss() {
      duel.views.activeTrial = source.activeTrial;
      duel.phase.startBoss();
    },
    renderHp() {},
    banner() {},
    setWaveLabel() {},
    renderTrialObjective() {},
    store: {
      set(key, value) {
        records.set(key, structuredClone(value));
        trace.push(key);
        return true;
      },
    },
    sfx: {
      unlock() {
        trace.push('unlock');
      },
    },
    buildLeaves() {},
    guided: { reset() {} },
    audio: { setPaused() {} },
    hideTrialObjective() {},
    toTitle() {
      runtime.run.state = 'title';
      trace.push('title');
    },
    computeMods() {},
    openPanel(panel) {
      trace.push(panel);
    },
    focusTrialResult() {},
  };
  for (const key of ['activeTrial', 'trialFailure', 'ST', 'EQ', 'combatRandom', 'hitStop'])
    Object.defineProperty(views, key, {
      get: () => source[key],
      set: (value) => {
        source[key] = value;
      },
      enumerable: true,
    });
  const session = createTrialSession(() => views);
  source.startTrialEncounter = session.startTrialEncounter;
  // Compose run entry with the real trial encounter callback before starting.
  runtime.flow = createRunStart(source);
  const start = (id) => {
    runtime.run.state = 'title';
    runtime.flow.startTrial(id);
  };
  return { runtime, views, trace, records, session, start, duel };
}
