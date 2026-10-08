import { createRuntimeGameplay } from './gameplay.ts';
import { createRuntimeControls } from '../runtime/controls.ts';

import { createRuntimeUIBase } from '../runtime/ui-base.ts';

import { createRuntimePresentation } from '../runtime/presentation.ts';
import { createRuntimeFoundation } from '../runtime/foundation.ts';

import { stateView, cacheView } from '../game/session/state-view.ts';

import { createFrameBindings } from './frame-bindings.ts';

import { createViewport } from '../presentation/viewport.ts';
import { bindGraphicsLifecycle } from '../presentation/graphics-lifecycle.ts';

/** Compose frame, graphics lifecycle and viewport against explicit runtime owners. */
export function createRuntimeFrames(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  game: ReturnType<typeof createRuntimeGameplay>,
  controls: ReturnType<typeof createRuntimeControls>,
  readArtworkReady: () => boolean,
) {
  const {
    frameLoop,
    update,
    render,
    drawScene,
    postPreparation,
    advancePost,
    preparePresentation,
  } = createFrameBindings(
    cacheView(() =>
      stateView(
        foundation.run.activity,
        ['activeTrial', 'trialFailure', 'activeDaily', 'combatRandom'],
        stateView(
          foundation.run.sessionState,
          ['hitStop', 'timeScale'],
          stateView(
            foundation.view.stageState,
            ['stageSeed'],
            stateView(
              foundation.run.sceneState,
              ['sceneLoading'],
              stateView(foundation.view.geometry, ['W', 'H', 'S', 'DPR', 'L'], {
                G: foundation.run.G,
                P: foundation.run.P,
                WX: foundation.run.WX,
                R: foundation.view.R,
                g: foundation.browser.g,
                cvs: foundation.browser.cvs,
                nativeScene: foundation.browser.nativeScene,
                presentationState: foundation.view.presentationState,
                environmentState: presentation.environmentState,
                postArtwork: presentation.postArtwork,
                playerFigures: presentation.playerFigures,
                finishTrial: game.finishTrial,
                updateAmbient: presentation.updateAmbient,
                cinematic: controls.cinematic,
                reducedMotion: foundation.browser.reducedMotion,
                reducedFlashes: foundation.browser.reducedFlashes,
                audio: foundation.browser.audio,
                apparelMotion: foundation.view.apparelMotion,
                updateEnemies: game.updateEnemies,
                waveConfiguration: game.waveConfiguration,
                liveOrdered: game.liveOrdered,
                guided: foundation.browser.guided,
                bossPhase: game.bossPhase,
                phaseRouter: game.phaseRouter,
                updateFx: presentation.updateFx,
                renderTrialObjective: ui.renderTrialObjective,
                updateTransition: presentation.updateTransition,
                sceneFilm: controls.sceneFilm,
                pz: game.pz,
                buzz: foundation.browser.buzz,
                premiumAccess: foundation.browser.premiumAccess,
                lightingDebug: controls.lightingDebug,
                lightingRig: foundation.browser.lightingRig,
                demonRealmRenderer: foundation.browser.demonRealmRenderer,
                environmentRenderer: foundation.browser.environmentRenderer,
                density: foundation.browser.density,
                blades: presentation.blades,
                drawStains: presentation.drawStains,
                drawLeaves: presentation.drawLeaves,
                drawEnemy: presentation.drawEnemy,
                drawBoss: presentation.drawBoss,
                drawFx: presentation.drawFx,
                drawFx2: presentation.drawFx2,
                drawGlyphs: presentation.drawGlyphs,
                drawSmoke: presentation.drawSmoke,
                drawWeather: presentation.drawWeather,
                drawPops: presentation.drawPops,
                drawStamps: presentation.drawStamps,
                screenAnimation: ui.screenAnimation,
                effectQuality: foundation.view.effectQuality,
                ambient: presentation.ambient,
                rebalanceWeather: presentation.rebalanceWeather,
                armory: controls.armory,
                flash: presentation.flash,
                sfx: foundation.browser.sfx,
                gustLeaves: presentation.gustLeaves,
                drawPreview: controls.drawPreview,
                settlePresentedScene: game.settlePresentedScene,
              }),
            ),
          ),
        ),
      ),
    ),
  );
  foundation.lifecycle.add(drawScene.dispose);
  bindGraphicsLifecycle(() => ({
    lifecycle: foundation.lifecycle,
    frameLoop,
    combatHaptics: foundation.browser.combatHaptics,
    audio: foundation.browser.audio,
    G: foundation.run.G,
    showPauseScreen: ui.showPauseScreen,
    cvs: foundation.browser.cvs,
    nativeScene: foundation.browser.nativeScene,
    $: foundation.browser.$,
    screenAnimation: ui.screenAnimation,
    visitToday: game.visitToday,
    get artworkReady() {
      return readArtworkReady();
    },
  }));
  const { resize } = createViewport(() =>
    stateView(foundation.view.geometry, ['W', 'H', 'DPR'], {
      cvs: foundation.browser.cvs,
      lifecycle: foundation.lifecycle,
      layout: foundation.view.layout,
      buildBG: presentation.buildBG,
      buildMist: presentation.buildMist,
      buildGrass: presentation.buildGrass,
      buildLeaves: presentation.buildLeaves,
      buildWeather: game.buildWeather,
      buildPost: presentation.buildPost,
      screenAnimation: ui.screenAnimation,
      prepareScene: game.prepareScene,
      environmentState: presentation.environmentState,
      get artworkReady() {
        return readArtworkReady();
      },
      reposition() {
        for (const e of foundation.run.G.enemies) {
          e.pos = game.enemyPos(e);
          if (e.state === 'dying') e.deathGround = { ...e.pos };
        }
        if (foundation.run.G.boss) {
          foundation.run.G.boss.pos = game.bossPos(foundation.run.G.boss);
          if (foundation.run.G.boss.state === 'dying')
            foundation.run.G.boss.deathGround = { ...foundation.run.G.boss.pos };
        }
      },
    }),
  );
  return {
    frameLoop,
    update,
    render,
    drawScene,
    postPreparation,
    advancePost,
    preparePresentation,
    resize,
  };
}
