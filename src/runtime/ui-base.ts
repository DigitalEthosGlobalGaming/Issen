import { createRuntimeScreens } from '../ui/wiring/screens.ts';
import { createNotifications } from '../ui/notifications.ts';
import { createRunResults } from '../ui/screens/run-results.ts';
import { createRewardedSupport } from '../platform/rewarded-support.ts';
import { createRewardScreen } from '../ui/screens/rewarded-support.ts';
import { renderPauseBlessings } from '../ui/screens/pause.ts';
import { renderShrine } from '../ui/screens/shrine.ts';
import { ITEM_TYPE_LABEL as TYPE_WORD } from '../ui/screens/game-over.ts';
import { activeNow } from '../platform/activity.ts';
import { store } from '../platform/storage.ts';
import { BLESS } from '../game/content/blessings.ts';
import type { ItemCategory } from '../game/content/items.ts';
import type { createShrinePhase } from '../game/phases/shrine.ts';
import type { createRuntimeFoundation } from './foundation.ts';
import { createTrialObjective } from '../ui/trial-objective.ts';

/** Own HUD, notifications, shrine/result display and support screen lifetime. */
export function createRuntimeUIBase(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  readShrine: () => Pick<ReturnType<typeof createShrinePhase>, 'pick'>,
) {
  function updateSavedRunButtons() {
    const available = foundation.run.sessionState.savedRun?.status === 'active';
    foundation.browser.$('bContinue').hidden = !available;
    foundation.browser.$('bAbandon').hidden = !available;
    foundation.browser.$('bPlay').textContent = available ? 'Start new run' : 'Draw your blade';
    for (const id of ['bArmory', 'bStats', 'bTemplate', 'bSupport', 'bTrials'])
      (foundation.browser.$(id) as HTMLButtonElement).disabled = available;
    foundation.browser.$('tSeed').textContent = available
      ? foundation.run.sessionState.savedRun!.dailyDay
        ? `Daily · ${foundation.run.sessionState.savedRun!.dailyDay}`
        : `Saved run · seed ${foundation.run.sessionState.savedRun!.seed}`
      : '';
  }
  const { hudView, screenAnimation, showScreen, renderLives, hud, setScore, banner, renderHp } =
    createRuntimeScreens(foundation.browser.$('app'), activeNow, () => ({
      G: foundation.run.G,
      activeDaily: !!foundation.run.activity.activeDaily,
      syncCollections: foundation.profile.syncCollections,
    }));
  const notifications = createNotifications(
    foundation.browser.$('hint'),
    foundation.browser.$('toast'),
    () => foundation.browser.sfx.unlock(),
  );
  const runResults = createRunResults(
    foundation.browser.$('over'),
    () => foundation.browser.sfx.reveal(),
    foundation.browser.reducedMotion,
  );
  function hint(key: string, text: string, dur = 3500) {
    if (foundation.run.activity.activeTrial || foundation.run.activity.activeDaily) return;
    if (foundation.run.G.hints[key]) return;
    foundation.run.G.hints[key] = 1;
    store.set('issen.hints', foundation.run.G.hints);
    notifications.hint(key, text, dur || 3500);
  }
  const hideHint = notifications.hideHint,
    clearHints = notifications.clearHints;
  function toast(it: { k: string; msg?: string; n?: string; type?: ItemCategory }) {
    notifications.toast({
      k: it.k,
      msg: it.msg || 'Unlocked: ' + it.n + ' ' + (it.type ? TYPE_WORD[it.type] : ''),
    });
  }
  const trialObjective = createTrialObjective(foundation.browser.$('trialObjective'));
  function renderTrialObjective() {
    trialObjective.render(foundation.run.activity.activeTrial, foundation.run.G);
  }
  function showShrineOffers(opts: (typeof BLESS)[number][]) {
    (foundation.browser.$('bRerollShrine') as HTMLButtonElement).hidden =
      foundation.run.G.shrineRerolls < 1 || !foundation.browser.premiumAccess();
    renderShrine(foundation.browser.$('blessList'), opts, (bl) => {
      readShrine().pick(bl);
    });
    showScreen('shrine');
    foundation.browser.sfx.drum();
  }
  const rewardSupport = createRewardedSupport();
  const rewardScreen = createRewardScreen(document.getElementById('app')!);
  foundation.lifecycle.add(rewardScreen.dispose);
  function showPauseScreen() {
    foundation.browser.combatHaptics.stop();
    foundation.browser.audio.setPaused(true);
    renderPauseBlessings(foundation.browser.$('paused'), foundation.run.G.bless);
    foundation.browser.$('pauseSeed').textContent = foundation.run.activity.activeDaily
      ? `Daily · ${foundation.run.activity.activeDaily.day}`
      : foundation.run.activity.activeTrial
        ? ''
        : `Seed ${foundation.run.G.seed}`;
    showScreen('paused');
    renderTrialObjective();
  }
  return {
    updateSavedRunButtons,
    hudView,
    screenAnimation,
    showScreen,
    renderLives,
    hud,
    setScore,
    banner,
    renderHp,
    notifications,
    runResults,
    hint,
    hideHint,
    clearHints,
    toast,
    renderTrialObjective,
    hideTrialObjective: trialObjective.hide,
    showShrineOffers,
    rewardSupport,
    rewardScreen,
    showPauseScreen,
  };
}
