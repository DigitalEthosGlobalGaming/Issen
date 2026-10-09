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
import { BOSS_IDENTITIES } from '../game/content/bosses.ts';
import { mountStartupLoading } from '../ui/startup-loading.ts';
/** Compose combat/scoring, character positions and kill rules through explicit owners. */
export function createRuntimeSceneCoordination(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  combat: Pick<ReturnType<typeof createRuntimeCombat>, 'spawnEnemy'>,
  readClock: () => Pick<ReturnType<typeof createFrameLoop>, 'resetClock'>,
  readArtworkReady: () => boolean,
) {
  let sceneError: ReturnType<typeof mountStartupLoading> | undefined;
  const clearSceneError = () => {
    sceneError?.remove();
    sceneError = undefined;
  };
  foundation.lifecycle.add(clearSceneError);
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
          prepareFigureArtwork: (signal: AbortSignal) => {
            const G = foundation.run.G;
            const current =
              G.boss && (G.state === 'boss' || (G.state === 'paused' && G.pausedFrom === 'boss'))
                ? G.boss
                : undefined;
            const ordinal =
              foundation.run.activity.activeTrial?.bosses?.[G.bossesSlain] ?? G.bossCount + 1;
            const tones = current?.def.pal
              ? [current.def.pal]
              : BOSS_IDENTITIES[(ordinal - 1) % BOSS_IDENTITIES.length]!.tones;
            return foundation.browser.prepareFigureArtwork(
              [...ENEMY_WEAPON_IDS, foundation.profile.profileEquipment.EQ.blade],
              tones.map((tone) => foundation.view.palette.robe(tone)),
              signal,
              {
                robe: foundation.profile.profileEquipment.EQ.robe,
                charm: foundation.profile.profileEquipment.EQ.charm,
                charmColor: presentation.CHARMCOL[foundation.profile.profileEquipment.EQ.charm],
              },
            );
          },
          environmentRenderer: foundation.browser.environmentRenderer,
          reclaimMemory: foundation.browser.reclaimMemory,
          sceneRecovery: {
            show(retry: () => void) {
              // Startup owns its loading/reload screen until artwork is published.
              if (!readArtworkReady()) return;
              sceneError ??= mountStartupLoading(retry);
              sceneError.scene();
            },
            clear: clearSceneError,
          },
          lifecycle: foundation.lifecycle,
          frameLoop: readClock(),
        }),
      ),
    ),
  );
  foundation.lifecycle.add(
    foundation.browser.environmentRenderer.observeFailure(() => {
      if (!readArtworkReady()) return;
      foundation.run.sceneState.requestedSceneKey = '';
      sceneFlow.prepareScene();
    }),
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
