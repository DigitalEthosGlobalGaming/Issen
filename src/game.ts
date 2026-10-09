import { STAGES as sceneStages } from './game/content/stages.ts';
import { createRuntimeFrames } from './runtime/frames.ts';
import { createRuntimeControls } from './runtime/controls.ts';
import { createRuntimeGameplay } from './runtime/gameplay.ts';
import { createRuntimeUIBase } from './runtime/ui-base.ts';

import { createRuntimePresentation } from './runtime/presentation.ts';
import { createRuntimeFoundation } from './runtime/foundation.ts';

import { cacheView, stateView } from './game/session/state-view.ts';

import { startRuntime } from './runtime/startup.ts';

import { type PreparedLighting } from './presentation/native-services.ts';

import { type GameEdition } from './platform/editions.ts';

import { pageActive } from './platform/activity.ts';

export function startGame(
  surfaces: ReadonlyMap<string, import('./rendering/scene-surface.ts').SceneSurface>,
  lighting?: PreparedLighting,
): () => void {
  const foundation = createRuntimeFoundation(surfaces, lighting, {
    edition: import.meta.env.VITE_GAME_EDITION as GameEdition,
    saveSettings: () => controls.saveSettings(),
  });

  const presentation = createRuntimePresentation(
    foundation,
    cacheView(() => ({
      isSp: () => game.isSp(),
      isSteelThird: () => game.isSteelThird(),
      isRobeSp: () => game.isRobeSp(),
      pz: () => game.pz(),
      waveConfiguration: () => game.waveConfiguration(),
      liveOrdered: () => game.liveOrdered(),
    })),
    () => controls.cinematic,
  );

  const ui = createRuntimeUIBase(foundation, () => game.shrinePhase);
  let artworkReady = false;
  const game = createRuntimeGameplay(
    foundation,
    presentation,
    ui,
    () => ({
      openPanel: (...args) => controls.openPanel(...args),
      setBestLine: () => controls.setBestLine(),
      refreshArmoryNew: () => controls.refreshArmoryNew(),
    }),
    () => ({ resetClock: () => frames.frameLoop.resetClock() }),
    () => artworkReady,
  );

  const controls = createRuntimeControls(
    foundation,
    presentation,
    ui,
    game,
    surfaces,
    () => artworkReady,
  );

  const frames = createRuntimeFrames(
    foundation,
    presentation,
    ui,
    game,
    controls,
    () => artworkReady,
  );
  // Scene readiness belongs to orchestration, never to a drawing call.

  startRuntime(() =>
    stateView(
      foundation.run.sessionState,
      ['savedRun'],
      stateView(
        foundation.view.geometry,
        ['W', 'H', 'DPR'],
        stateView(foundation.view.stageState, ['stageSeed'], {
          lifecycle: foundation.lifecycle,
          cvs: foundation.browser.cvs,
          frameLoop: frames.frameLoop,
          G: foundation.run.G,
          cinematic: controls.cinematic,
          setupScreen: controls.setupScreen,
          tutorial: controls.tutorial,
          armory: controls.armory,
          notifications: ui.notifications,
          guided: foundation.browser.guided,
          runResults: ui.runResults,
          audio: foundation.browser.audio,
          driftRenderer: presentation.driftRenderer,
          driftStage: () =>
            foundation.run.activity.activeTrial?.realm === 'demon' ||
            presentation.environmentState.previewDemon
              ? sceneStages.length
              : foundation.run.G.stage,
          reducedMotion: foundation.browser.reducedMotion,
          reducedFlashes: foundation.browser.reducedFlashes,
          density: foundation.browser.density,
          petOf: presentation.petOf,
          robeOf: () => foundation.profile.profileEquipment.EQ.robe,
          bladeOf: () => foundation.profile.profileEquipment.EQ.blade,
          computeMods: game.computeMods,
          applySeal: foundation.view.applySeal,
          resize: frames.resize,
          setupAttract: game.setupAttract,
          restoreCheckpoint: game.restoreCheckpoint,
          showPauseScreen: ui.showPauseScreen,
          showOver: game.showOver,
          recoverSupportReward: game.recoverSupportReward,
          setMuteIcon: foundation.browser.setMuteIcon,
          refreshArmoryNew: controls.refreshArmoryNew,
          setBestLine: controls.setBestLine,
          updateSavedRunButtons: ui.updateSavedRunButtons,
          disposePointer: controls.disposePointer,
          disposeKeyboard: controls.disposeKeyboard,
          inkCharm: foundation.browser.inkCharm,
          inkCompanion: foundation.browser.inkCompanion,
          inkEnemy: foundation.browser.inkEnemy,
          inkPlayer: foundation.browser.inkPlayer,
          inkSword: foundation.browser.inkSword,
          environmentRenderer: foundation.browser.environmentRenderer,
          presentationState: foundation.view.presentationState,
          markArtworkReady() {
            artworkReady = true;
            if (pageActive()) frames.frameLoop.start();
          },
        }),
      ),
    ),
  );
  return foundation.lifecycle.dispose;
}
