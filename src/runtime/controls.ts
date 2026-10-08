import { createRuntimeGameplay } from '../runtime/gameplay.ts';
import { createRuntimeUIBase } from '../runtime/ui-base.ts';

import { createRuntimeMenus } from '../runtime/menus.ts';
import { createRuntimePresentation } from '../runtime/presentation.ts';
import { createRuntimeFoundation } from '../runtime/foundation.ts';

import { stateView } from '../game/session/state-view.ts';

import { bindProfileWiring } from '../ui/wiring/profile.ts';
import { bindPurchaseWiring } from '../ui/wiring/purchases.ts';
import { createInputWiring } from '../ui/wiring/input.ts';
import { createTitleSecrets } from '../ui/wiring/secrets.ts';

import { PREMIUM_FILM } from '../platform/premium.ts';

import { createArmoryPreview } from '../rendering/armory-preview.ts';
import { activeNow } from '../platform/activity.ts';

import { appendGameOverUnlocks } from '../ui/screens/game-over.ts';

import { recordSecretEvent } from '../game/progression/secret-events.ts';

import { rng } from '../shared/random.ts';

/** Compose menus, previews, profile/purchase wiring and input against explicit runtime owners. */
export function createRuntimeControls(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  game: ReturnType<typeof createRuntimeGameplay>,
  surfaces: ReadonlyMap<string, import('../rendering/scene-surface.ts').SceneSurface>,
  readArtworkReady: () => boolean,
) {
  foundation.lifecycle.listen(foundation.browser.$('shrineK'), 'click', () => {
    foundation.browser.audioInit();
    foundation.browser.sfx.knock();
    foundation.run.sessionState.knocks++;
    if (
      recordSecretEvent(foundation.profile.profileFoundation.ST, {
        kind: 'shrineKnocks',
        count: foundation.run.sessionState.knocks,
      })
    ) {
      foundation.profile.saveStats();
      foundation.browser.sfx.bell();
      game.checkUnlocks();
    }
  });
  foundation.lifecycle.listen(foundation.browser.$('oScore'), 'click', (e) => {
    e.stopPropagation();
    foundation.browser.audioInit();
    foundation.run.G.claps = (foundation.run.G.claps || 0) + 1;
    foundation.browser.tn({ f0: 700 + foundation.run.G.claps * 90, dur: 0.06, g: 0.05 });
    if (
      recordSecretEvent(foundation.profile.profileFoundation.ST, {
        kind: 'scoreClaps',
        count: foundation.run.G.claps,
      })
    ) {
      foundation.profile.saveStats();
      foundation.browser.sfx.popper();
      const previous = foundation.run.sessionState.runItemReveals.length;
      game.checkUnlocks();
      const newReveals = foundation.run.sessionState.runItemReveals.slice(previous);
      if (newReveals.length) {
        appendGameOverUnlocks(foundation.browser.$('over'), newReveals);
        foundation.run.G.overReady = false;
        foundation.browser.$('bAgain').disabled = true;
        ui.runResults.startUnlocks(newReveals, () => {
          foundation.run.G.overReady = true;
          foundation.browser.$('bAgain').disabled = false;
        });
      }
    }
  });
  foundation.lifecycle.listen(foundation.browser.$('bRerollShrine'), 'click', () =>
    game.shrinePhase.reroll(),
  );
  const {
    setBestLine,
    openPanel,
    closePanel,
    renderStats,
    setupScreen,
    renderSetup,
    tutorial,
    launchTutorial,
    showAdmin,
    scrollMenus,
    applySettings,
    saveSettings,
    lightingDebug,
    options,
    armoryWiring,
    cinematicWiring,
  } = createRuntimeMenus(foundation, presentation, () => ({
    get hudView() {
      return ui.hudView;
    },
    get renderArmory() {
      return renderArmory;
    },
    get startTrial() {
      return game.startTrial;
    },
    get showScreen() {
      return ui.showScreen;
    },
    get toTitle() {
      return game.toTitle;
    },
    get checkUnlocks() {
      return game.checkUnlocks;
    },
    get computeMods() {
      return game.computeMods;
    },
    get hud() {
      return ui.hud;
    },
    get refreshArmoryNew() {
      return refreshArmoryNew;
    },
    get renderLives() {
      return ui.renderLives;
    },
    get testJump() {
      return game.testJump;
    },
    get toast() {
      return ui.toast;
    },
    get screenAnimation() {
      return ui.screenAnimation;
    },
    get prepareScene() {
      return game.prepareScene;
    },
    get artworkReady() {
      return readArtworkReady();
    },
    get supportPreview() {
      return supportPreview;
    },
    releasePreviewArtwork() {
      preview.suspend();
      supportPreview.suspend();
    },
    get demoKill() {
      return demoKill;
    },
    get buildWeather() {
      return game.buildWeather;
    },
    get setupAttract() {
      return game.setupAttract;
    },
  }));
  const { PRESETS, presetScreen, armory, equipArmory, renderArmory } = armoryWiring;
  function refreshArmoryNew() {
    armoryWiring.refreshArmoryNew();
  }
  const { cinematic, sceneFilm, previewStage } = cinematicWiring;
  const { titleTap, konamiInput, bindTitleGestures } = createTitleSecrets(() => ({
    G: foundation.run.G,
    ST: foundation.profile.profileFoundation.ST,
    UNL: foundation.profile.UNL,
    audioInit: foundation.browser.audioInit,
    tn: foundation.browser.tn,
    sfx: foundation.browser.sfx,
    flash: presentation.flash,
    saveStats: foundation.profile.saveStats,
    checkUnlocks: game.checkUnlocks,
    toast: ui.toast,
  }));
  bindTitleGestures(foundation.browser.$('title'), foundation.lifecycle, () => cinematic.logoTap());
  const { flushProfile } = bindProfileWiring({
    $: foundation.browser.$,
    lifecycle: foundation.lifecycle,
    playerStats: foundation.profile.playerStats,
    playerEquipment: foundation.profile.playerEquipment,
    saveMeta: foundation.profile.saveMeta,
    saveAwakening: foundation.profile.saveAwakening,
    UNL: foundation.profile.UNL,
  });
  const previewArtwork = {
    inkCharm: foundation.browser.inkCharm,
    inkCompanion: foundation.browser.inkCompanion,
    inkEnemy: foundation.browser.inkEnemy,
    inkPlayer: foundation.browser.inkPlayer,
    inkSword: foundation.browser.inkSword,
  };
  const preview = createArmoryPreview(
    foundation.browser.$('prevC'),
    {
      random: foundation.view.R,
      now: activeNow,
      sounds: foundation.browser.sfx,
    },
    previewArtwork,
    surfaces?.get('prevC'),
  );
  const supportPreview = createArmoryPreview(
    foundation.browser.$('supportPreview'),
    {
      random: rng(4242),
      now: activeNow,
      sounds: foundation.browser.sfx,
    },
    previewArtwork,
    surfaces?.get('supportPreview'),
  );
  foundation.lifecycle.add(preview.dispose);
  foundation.lifecycle.add(supportPreview.dispose);
  function demoKill() {
    preview.demo(
      armory.tab === 'fx'
        ? (armory.selected ?? foundation.profile.profileEquipment.EQ.fx)
        : foundation.profile.profileEquipment.EQ.fx,
      !!(foundation.run.G.m && foundation.run.G.m.bonk),
    );
  }
  function drawPreview() {
    lightingDebug.refresh();
    foundation.browser.inkCompanion.select(presentation.petOf());
    preview.draw(
      presentation.previewFrame(
        foundation.profile.profileEquipment.EQ.film === PREMIUM_FILM &&
          !foundation.browser.premiumAccess()
          ? 'mono'
          : foundation.profile.profileEquipment.EQ.film,
        armory.tab === 'fx',
      ),
    );
  }
  const { disposePointer, bindNavigation } = createInputWiring(
    foundation.browser.cvs,
    stateView(foundation.view.geometry, ['W', 'H'], {
      $: foundation.browser.$,
      G: foundation.run.G,
      settings: foundation.browser.settings,
      cinematic,
      audioInit: foundation.browser.audioInit,
      onSwipe: game.onSwipe,
      onTapDown: game.onTapDown,
      onTap: game.onTap,
      lifecycle: foundation.lifecycle,
      abandonSavedRun: game.abandonSavedRun,
      continueSavedRun: game.continueSavedRun,
      openPanel,
      startDaily: game.startDaily,
      startRun: game.startRun,
      options,
      closePanel,
      pause: game.pause,
      resume: game.resume,
      endRun: game.endRun,
      toTitle: game.toTitle,
      rewardScreen: ui.rewardScreen,
      konamiInput,
      get savedRun() {
        return foundation.run.sessionState.savedRun;
      },
      get activeTrial() {
        return foundation.run.activity.activeTrial;
      },
    }),
  );
  bindPurchaseWiring(
    stateView(
      foundation.run.activity,
      ['activeTrial', 'trialFailure'],
      stateView(
        foundation.run.sessionState,
        ['runTemplate'],
        stateView(foundation.profile.profileEquipment, ['EQ'], {
          $: foundation.browser.$,
          G: foundation.run.G,
          lifecycle: foundation.lifecycle,
          premiumAccess: foundation.browser.premiumAccess,
          savedEquipment: foundation.profile.savedEquipment,
          accessibleUnlocks: foundation.profile.accessibleUnlocks,
          ITEMS: foundation.profile.ITEMS,
          playerEquipment: foundation.profile.playerEquipment,
          savedFilm: foundation.profile.savedFilm,
          META: foundation.profile.META,
          SETUP: foundation.profile.SETUP,
          computeMods: game.computeMods,
          renderArmory,
          saveMeta: foundation.profile.saveMeta,
          openPanel,
          pause: game.pause,
          audio: foundation.browser.audio,
          guided: foundation.browser.guided,
          edition: foundation.browser.edition,
          UNL: foundation.profile.UNL,
          get initialPurchaseCheck() {
            return foundation.browser.browserPreferences.initialPurchaseCheck;
          },
          set initialPurchaseCheck(value) {
            foundation.browser.browserPreferences.initialPurchaseCheck = value;
          },
          get testerPremium() {
            return foundation.browser.browserPreferences.testerPremium;
          },
          set testerPremium(value) {
            foundation.browser.browserPreferences.testerPremium = value;
          },
        }),
      ),
    ),
  );
  const disposeKeyboard = bindNavigation();
  return {
    setBestLine,
    openPanel,
    closePanel,
    renderStats,
    setupScreen,
    renderSetup,
    tutorial,
    launchTutorial,
    showAdmin,
    scrollMenus,
    applySettings,
    saveSettings,
    lightingDebug,
    options,
    armoryWiring,
    cinematicWiring,
    PRESETS,
    presetScreen,
    armory,
    equipArmory,
    renderArmory,
    refreshArmoryNew,
    cinematic,
    sceneFilm,
    previewStage,
    titleTap,
    konamiInput,
    bindTitleGestures,
    flushProfile,
    previewArtwork,
    preview,
    supportPreview,
    demoKill,
    drawPreview,
    disposePointer,
    bindNavigation,
    disposeKeyboard,
  };
}
