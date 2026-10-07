import { createEventBus } from '../../../src/game/events.ts';
import { createRunStart } from '../../../src/game/session/run-start.ts';
import { createRunState } from '../../../src/game/run-state.ts';
import { parseMeta, templateModifiers } from '../../../src/game/progression/meta.ts';
import { createRunRewardLedger } from '../../../src/game/progression/run-rewards.ts';
import { waveConfig } from '../../../src/game/encounters/configuration.ts';
import { parseStatistics, DEFAULT_EQUIPMENT } from '../../../src/platform/saves.ts';
import { restorableRng } from '../../../src/shared/random.ts';
import { createPlayerAnimation, REST_POSE } from '../../../src/game/player/player.ts';
import { createWeatherState } from '../../../src/rendering/scene/weather-state.ts';

/** Fixed input ports drive the production run-start API, with test-owned profile state. */
export function runStartSession(seed, setup, equipment = DEFAULT_EQUIPMENT, start = true) {
  const G = createRunState(),
    ST = parseStatistics({ roninWave: 10 }),
    EQ = { ...equipment };
  const SETUP = { ...setup },
    META = parseMeta(
      { schemaVersion: 4, bossMilestone: 3, revealSeen: 3, upgrades: { vitality: 1 } },
      ST,
      new Set(),
    );
  const trace = [],
    weather = createWeatherState(() => 0.5);
  const views = {
    events: createEventBus(),
    $: () => ({ classList: { remove() {} } }),
    G,
    META,
    SETUP,
    P: createPlayerAnimation(),
    PREST: REST_POSE,
    presentationState: { lbT: 0 },
    playerStats: ST,
    playerEquipment: EQ,
    ST,
    EQ,
    apparelMotion: { reset() {} },
    audio: { setPaused() {} },
    guided: { reset() {} },
    stageVisits: {
      enter() {
        return 456;
      },
    },
    activeDaily: null,
    activeTrial: null,
    rewardLedger: createRunRewardLedger(),
    runBossMilestone: 0,
    runItemReveals: [],
    runRandom: restorableRng(0),
    runTemplate: templateModifiers(META, SETUP, false),
    combatRandom: () => 0,
    savedRun: null,
    shrineOfferIds: null,
    runTrialsWasUnlocked: false,
    stageSeed: 0,
    timeScale: 0.3,
    hitStop: 1,
    trialFailure: '',
    newRunSeed() {
      trace.push('seed');
      return seed;
    },
    clearTrialResult() {},
    clearCheckpoint() {
      trace.push('clear');
    },
    clearEffects() {
      trace.push('effects');
    },
    resetWeather(random) {
      Object.assign(weather, createWeatherState(random));
    },
    checkUnlocks() {},
    clearHints() {},
    computeMods() {},
    hint() {},
    hud() {},
    premiumAccess: () => true,
    prepareScene() {},
    saveStats() {},
    setScore() {},
    setStage(stage) {
      G.stage = stage;
    },
    showScreen() {},
    startTrialEncounter() {
      trace.push('trial');
    },
    startWave(wave) {
      G.wave = wave;
      G.cfg = waveConfig(wave, G.mode, G.m);
      trace.push(['wave', wave]);
    },
    startBoss() {
      G.bossCount++;
      G.state = 'boss';
      trace.push('boss');
    },
    toast() {},
    applySeal() {},
    audioInit() {},
    buildLeaves() {},
    waveCfg: (wave) => waveConfig(wave, G.mode, G.m),
  };
  const flow = createRunStart(views);
  if (start) flow.startRun();
  return { run: G, random: views.runRandom, views, flow, trace, weather };
}
