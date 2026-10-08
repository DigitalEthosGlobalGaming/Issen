import { bindSceneLightSources } from '../presentation/scene-light-sources.ts';
import { createLightSources } from '../presentation/light-sources.ts';
import {
  createEquipmentPresentation,
  type EquipmentPresentationViews,
} from '../presentation/equipment.ts';
import {
  createEnvironmentHost,
  type EnvironmentHostViews,
} from '../presentation/environment-host.ts';
import { createFiguresHost, type FigureHostViews } from '../presentation/figures-host.ts';
import { createFeedbackPresentation } from '../presentation/feedback.ts';
import { createPostArtwork } from '../presentation/post-artwork.ts';
import { visiblePet } from '../game/player/companions.ts';
import { cacheView, stateView } from '../game/session/state-view.ts';
import { STAGES } from '../game/content/stages.ts';
import type { PreviewFrame } from '../rendering/armory-preview.ts';
import type { createRuntimeFoundation } from './foundation.ts';
type PresentationRulePorts = Pick<
  EquipmentPresentationViews,
  'isSp' | 'isSteelThird' | 'isRobeSp'
> &
  Pick<FigureHostViews, 'pz' | 'waveConfiguration' | 'liveOrdered'>;

/** Compose scenery, figures, equipment and effects with explicit current rule/film capabilities. */
export function createRuntimePresentation(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  readRules: () => PresentationRulePorts,
  readCinematic: () => EnvironmentHostViews['cinematic'],
) {
  const lightSources = createLightSources();
  foundation.lifecycle.add(lightSources.dispose);
  const equipmentPresentation = createEquipmentPresentation(
    cacheView(() =>
      stateView(
        foundation.view.sealState,
        ['SEAL'],
        stateView(foundation.profile.profileEquipment, ['EQ'], {
          $: foundation.browser.$,
          robePal: foundation.view.robePal,
          get isRobeSp() {
            return readRules().isRobeSp;
          },
          get isSteelThird() {
            return readRules().isSteelThird;
          },
          get isSp() {
            return readRules().isSp;
          },
          lightingRig: foundation.browser.lightingRig,
          presentationState: foundation.view.presentationState,
          density: foundation.browser.density,
          reducedMotion: foundation.browser.reducedMotion,
          reducedFlashes: foundation.browser.reducedFlashes,
          G: foundation.run.G,
          cols: foundation.view.cols,
          environmentState,
          P: foundation.run.P,
          petOf,
          FONT: foundation.view.FONT,
        }),
      ),
    ),
  );
  const { CHARMCOL } = equipmentPresentation;
  const {
    environmentState,
    driftRenderer,
    buildBG,
    buildMist,
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    buildWeatherArtwork,
    rebalanceWeather,
    ambient,
    blades,
    drawLeaves,
    weatherRenderer,
    drawWeather,
    drawSmoke,
    updateAmbient,
    updateTransition,
  } = createEnvironmentHost(
    foundation.browser.cvs.ownerDocument,
    foundation.lifecycle,
    cacheView(() =>
      stateView(foundation.view.geometry, ['W', 'H', 'DPR', 'S', 'L'], {
        G: foundation.run.G,
        R: foundation.view.R,
        density: foundation.browser.density,
        context2d: foundation.browser.context2d,
        get activeTrial() {
          return foundation.run.activity.activeTrial;
        },
        reducedMotion: foundation.browser.reducedMotion,
        g: foundation.browser.g,
        presentationState: foundation.view.presentationState,
        get cinematic() {
          return readCinematic();
        },
        WX: foundation.run.WX,
      }),
    ),
  );
  const postArtwork = createPostArtwork(
    foundation.browser.cvs.ownerDocument,
    cacheView(() =>
      stateView(foundation.view.geometry, ['W', 'H'], {
        R: foundation.view.R,
        mainG: foundation.browser.mainG,
        context2d: foundation.browser.context2d,
      }),
    ),
  );
  const { buildPost } = postArtwork;
  const {
    figureRenderer,
    drawFigure,
    drawSplit,
    drawPetAt,
    drawSword,
    drawGlint,
    tipOf,
    drawEnemy,
    drawBoss,
    playerFigures,
    drawEnso,
    drawGlyphs,
  } = createFiguresHost(
    cacheView(() =>
      stateView(
        foundation.view.sealState,
        ['SEAL', 'SEALARC'],
        stateView(
          foundation.profile.profileEquipment,
          ['EQ'],
          stateView(foundation.view.geometry, ['W', 'H', 'L'], {
            g: foundation.browser.g,
            inkCharm: foundation.browser.inkCharm,
            inkCompanion: foundation.browser.inkCompanion,
            inkEnemy: foundation.browser.inkEnemy,
            inkPlayer: foundation.browser.inkPlayer,
            inkSword: foundation.browser.inkSword,
            presentationState: foundation.view.presentationState,
            G: foundation.run.G,
            cols: foundation.view.cols,
            R: foundation.view.R,
            density: foundation.browser.density,
            reducedMotion: foundation.browser.reducedMotion,
            reducedFlashes: foundation.browser.reducedFlashes,
            robePal: foundation.view.robePal,
            accessible: foundation.browser.accessible,
            FONT: foundation.view.FONT,
            P: foundation.run.P,
            apparelMotion: foundation.view.apparelMotion,
            playerRobePalette,
            get isRobeSp() {
              return readRules().isRobeSp;
            },
            bladeStyle,
            CHARMCOL,
            petOf,
            get pz() {
              return readRules().pz;
            },
            get waveConfiguration() {
              return readRules().waveConfiguration;
            },
            get liveOrdered() {
              return readRules().liveOrdered;
            },
            WX: foundation.run.WX,
          }),
        ),
      ),
    ),
  );
  function petOf() {
    return visiblePet(foundation.profile.profileEquipment.EQ);
  }
  function drawFoxfire() {
    playerFigures.drawFoxfire();
  }
  function drawPet() {
    playerFigures.drawPet();
  }
  function playerRobePalette() {
    return equipmentPresentation.playerRobePalette();
  }
  function bladeStyle() {
    return equipmentPresentation.bladeStyle();
  }
  const {
    flash,
    letterbox,
    punch,
    weatherBurst,
    killFx,
    updateFx,
    pop,
    stamp,
    effectSpawner,
    addSlash,
    inkBurst,
    scraps,
    ring,
    sparks,
    dust,
    effectRenderer,
    drawFx,
    drawFx2,
    drawStains,
    drawPops,
    drawStamps,
  } = createFeedbackPresentation(
    cacheView(() =>
      stateView(
        foundation.view.sealState,
        ['SEAL'],
        stateView(foundation.view.geometry, ['S', 'W', 'H', 'portrait'], {
          g: foundation.browser.g,
          fx: foundation.view.presentationState.fx,
          get time() {
            return foundation.view.presentationState.time;
          },
          FONT: foundation.view.FONT,
          get mistSprite() {
            return environmentState.mistSprite;
          },
          R: foundation.view.R,
          density: foundation.browser.density,
          sfx: foundation.browser.sfx,
          state: foundation.view.presentationState,
          reducedFlashes: foundation.browser.reducedFlashes,
          reducedMotion: foundation.browser.reducedMotion,
          get weather() {
            return STAGES[foundation.run.G.stage]!.weather;
          },
          newLeaf,
          get leaves() {
            return environmentState.leaves;
          },
          killEffect: () =>
            foundation.browser.accessible(foundation.profile.profileEquipment.EQ.fx)
              ? foundation.profile.profileEquipment.EQ.fx
              : 'ink',
          clink: () => foundation.browser.sfx.clink(),
        }),
      ),
    ),
  );
  function previewFrame(
    film: string,
    effectsVisible: boolean,
    target = foundation.browser.$('prevC'),
  ): PreviewFrame {
    return equipmentPresentation.previewFrame(film, effectsVisible, target);
  }
  foundation.lifecycle.add(
    bindSceneLightSources(
      lightSources,
      cacheView(() => ({
        G: foundation.run.G,
        fx: foundation.view.presentationState.fx,
        get player() {
          return foundation.view.geometry.L.player;
        },
        get scale() {
          return foundation.view.geometry.S;
        },
        get sceneLoading() {
          return foundation.run.sceneState.sceneLoading;
        },
        get cinematic() {
          return readCinematic().active;
        },
        get reducedMotion() {
          return foundation.browser.reducedMotion();
        },
        get reducedFlashes() {
          return foundation.browser.reducedFlashes();
        },
      })),
    ),
  );
  return {
    lightSources,
    equipmentPresentation,
    CHARMCOL,
    environmentState,
    driftRenderer,
    buildBG,
    buildMist,
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    buildWeatherArtwork,
    rebalanceWeather,
    ambient,
    blades,
    drawLeaves,
    weatherRenderer,
    drawWeather,
    drawSmoke,
    updateAmbient,
    updateTransition,
    postArtwork,
    buildPost,
    figureRenderer,
    drawFigure,
    drawSplit,
    drawPetAt,
    drawSword,
    drawGlint,
    tipOf,
    drawEnemy,
    drawBoss,
    playerFigures,
    drawEnso,
    drawGlyphs,
    petOf,
    drawFoxfire,
    drawPet,
    playerRobePalette,
    bladeStyle,
    flash,
    letterbox,
    punch,
    weatherBurst,
    killFx,
    updateFx,
    pop,
    stamp,
    effectSpawner,
    addSlash,
    inkBurst,
    scraps,
    ring,
    sparks,
    dust,
    effectRenderer,
    drawFx,
    drawFx2,
    drawStains,
    drawPops,
    drawStamps,
    previewFrame,
  };
}
