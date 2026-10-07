import { createCheckpointFlow } from '../../../src/game/session/checkpoint-flow.ts';
import { createRunState } from '../../../src/game/run-state.ts';
import { createItems } from '../../../src/game/content/items.ts';
import { parseMeta, templateModifiers } from '../../../src/game/progression/meta.ts';
import { parseAwakeningProgress } from '../../../src/game/progression/awakening-progress.ts';
import { parseCollectionProgress } from '../../../src/game/progression/collection-progress.ts';
import { parseStatistics, DEFAULT_EQUIPMENT } from '../../../src/platform/saves.ts';
import { parseRunCheckpoint } from '../../../src/platform/run-checkpoint.ts';
import { restorableRng } from '../../../src/shared/random.ts';

/** Test-owned storage/UI ports; drives the actual session checkpoint API. */
export function checkpointSession(checkpoint, position) {
  const G = createRunState(),
    playerStats = parseStatistics({}),
    UNL = new Set(checkpoint.unlocks);
  const META = parseMeta(checkpoint.meta, playerStats, UNL),
    SETUP = { ...checkpoint.setup };
  const playerEquipment = { ...DEFAULT_EQUIPMENT },
    saved = new Map();
  let record = null;
  const trace = [];
  const views = {
    $: () => ({ textContent: '', classList: { toggle() {}, remove() {} } }),
    G,
    META,
    SETUP,
    UNL,
    playerStats,
    playerEquipment,
    AWAKENING: parseAwakeningProgress(checkpoint.awakening),
    COLLECTION_PROGRESS: parseCollectionProgress(checkpoint.collections, playerStats),
    DAILY_LOGIN: { earned: false, lastDay: '', streak: 0 },
    WX: structuredClone(checkpoint.weather),
    ITEMS: createItems(() => UNL),
    activeTrial: null,
    sceneLoading: false,
    sceneContinuation: undefined,
    EQ: playerEquipment,
    ST: playerStats,
    activeDaily: null,
    rewardLedger: structuredClone(checkpoint.ledger),
    runBossMilestone: 0,
    runRandom: restorableRng(0),
    runTemplate: templateModifiers(META, SETUP, false),
    combatRandom: () => 0,
    savedRun: null,
    shrineOfferIds: null,
    persistence: {
      read() {
        return parseRunCheckpoint(structuredClone(record));
      },
      write(value) {
        record = JSON.parse(JSON.stringify(value));
        return true;
      },
      clear() {
        record = null;
      },
    },
    storage: {
      set(key, value) {
        saved.set(key, structuredClone(value));
        return true;
      },
    },
    accessibleUnlocks: () => UNL,
    applySeal() {},
    bossPos: position,
    computeMods() {},
    enemyPos: position,
    hud() {},
    premiumAccess: () => false,
    renderHp() {},
    renderLives() {},
    saveAwakening() {},
    saveMeta() {},
    saveStats() {},
    saveCollections() {},
    setScore() {},
    setStage(stage) {
      G.stage = stage;
      // Scene/weather preparation may consume the previous stream. Restore must
      // reset the saved stream only after this existing stage port completes.
      views.runRandom.next();
    },
    syncCollections() {},
    toast() {},
    updateSavedRunButtons() {},
    showScreen(id) {
      trace.push(['screen', id]);
    },
    showShrineOffers(offers) {
      trace.push(['offers', offers.map((x) => x.id)]);
    },
    showOver() {
      trace.push('over');
      G.state = 'over';
    },
    adoptPhase() {},
    discardSceneContinuation() {
      views.sceneContinuation = undefined;
    },
    resetClock() {
      trace.push('clock');
    },
  };
  const flow = createCheckpointFlow(views);
  flow.restoreCheckpoint(structuredClone(checkpoint));
  return { flow, views, saved, trace, read: views.persistence.read };
}
