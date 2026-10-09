import { createRuntimeCombat } from './combat.ts';

import { createRuntimeUIBase } from '../runtime/ui-base.ts';

import { createRuntimePresentation } from '../runtime/presentation.ts';
import { createRuntimeFoundation } from '../runtime/foundation.ts';
import { stateView } from '../game/session/state-view.ts';

import { createSceneFlow } from './scene-flow.ts';

import { compositionKey } from '../rendering/environment/worker-types.ts';

import { createWeatherState } from '../rendering/scene/weather-state.ts';

import { STAGES } from '../game/content/stages.ts';
import type { createFrameLoop } from '../platform/frame-loop.ts';
import { ENEMY_WEAPON_IDS } from '../rendering/figures/enemy-presence.ts';
/** Compose combat/scoring, character positions and kill rules through explicit owners. */
export function createRuntimeSceneCoordination(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  combat: Pick<ReturnType<typeof createRuntimeCombat>, 'spawnEnemy'>,
  readClock: () => Pick<ReturnType<typeof createFrameLoop>, 'resetClock'>,
) {
  function buildWeather(resetSimulation = true) {
    presentation.buildWeatherArtwork();
    if (resetSimulation)
      Object.assign(foundation.run.WX, createWeatherState(foundation.run.activity.combatRandom));
  }
  function setStage(si: number, anim: boolean) {
    foundation.view.stageState.stageSeed = foundation.view.stageVisits.enter(si);
    if (anim && presentation.environmentState.bg) {
      presentation.environmentState.prevBg = presentation.environmentState.bg;
      presentation.environmentState.stageFade = 1;
    }
    foundation.run.G.stage = si;
    presentation.buildLeaves();
    foundation.view.geometry.MIST = STAGES[si]!.fog;
    foundation.view.palette.clearFog();
    presentation.buildBG();
    presentation.buildMist();
    presentation.buildGrass();
    buildWeather();
    prepareScene();
  }
  const sceneFlow = createSceneFlow(() =>
    stateView(
      foundation.run.sceneState,
      [
        'requestedSceneKey',
        'sceneRequest',
        'requestedSceneIdentity',
        'sceneContinuation',
        'sceneLoading',
        'sceneReadyToPresent',
      ],
      stateView(
        foundation.view.geometry,
        ['W', 'H', 'DPR'],
        stateView(foundation.view.stageState, ['stageSeed'], {
          presentationState: foundation.view.presentationState,
          G: foundation.run.G,
          reducedMotion: foundation.browser.reducedMotion,
          reducedFlashes: foundation.browser.reducedFlashes,
          density: foundation.browser.density,
          activeTrial: foundation.run.activity.activeTrial,
          environmentState: presentation.environmentState,
          compositionKey,
          cvs: foundation.browser.cvs,
          screenAnimation: ui.screenAnimation,
          demonRealmRenderer: foundation.browser.demonRealmRenderer,
          driftRenderer: presentation.driftRenderer,
          prepareWeaponParts: () =>
            foundation.browser.inkSword.prepareParts([
              ...ENEMY_WEAPON_IDS,
              foundation.profile.profileEquipment.EQ.blade,
            ]),
          environmentRenderer: foundation.browser.environmentRenderer,
          lifecycle: foundation.lifecycle,
          frameLoop: readClock(),
        }),
      ),
    ),
  );
  function prepareScene() {
    return sceneFlow.prepareScene();
  }
  function deferUntilSceneReady(action: () => void) {
    return sceneFlow.deferUntilSceneReady(action);
  }
  function setupAttract() {
    if (deferUntilSceneReady(setupAttract)) return;
    foundation.run.G.enemies = [];
    foundation.run.G.cfg = null;
    foundation.run.G.boss = null;
    foundation.run.G.attacker = null;
    for (let i = 0; i < 5; i++) combat.spawnEnemy(i, true);
  }
  function settlePresentedScene() {
    return sceneFlow.settlePresentedScene();
  }
  return {
    buildWeather,
    setStage,
    sceneFlow,
    prepareScene,
    deferUntilSceneReady,
    setupAttract,
    settlePresentedScene,
  };
}
