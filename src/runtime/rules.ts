import { createRuntimeFoundation } from '../runtime/foundation.ts';
import { cacheView, stateView } from '../game/session/state-view.ts';

import { type MenuBindingViews } from '../ui/wiring/menu-bindings.ts';

import { createProfileRules } from '../game/progression/profile-rules.ts';
import { createActiveEquipment } from '../game/equipment/active.ts';

import { ITEM_TYPE_LABEL as TYPE_WORD } from '../ui/screens/game-over.ts';

import type { BladeStats } from '../game/progression/statistics.ts';
import { itemPresentation } from '../ui/screens/item-presentation.ts';
import { store } from '../platform/storage.ts';

/** Compose profile progression and equipment rules through explicit owners. */
export function createRuntimeRules(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  readMenus: () => Pick<MenuBindingViews, 'refreshArmoryNew'>,
) {
  function earn(event: 'kill' | 'wave' | 'boss') {
    return profileRules.earn(event);
  }
  const profileRules = createProfileRules(
    cacheView(() =>
      stateView(
        foundation.run.activity,
        ['activeTrial', 'activeDaily'],
        stateView(
          foundation.run.sessionState,
          ['rewardLedger', 'runItemReveals'],
          stateView(foundation.profile.profileFoundation, ['ST'], {
            G: foundation.run.G,
            AWAKENING: foundation.profile.AWAKENING,
            META: foundation.profile.META,
            saveAwakening: foundation.profile.saveAwakening,
            UNL: foundation.profile.UNL,
            ITEMS: foundation.profile.ITEMS,
            ITEM_BY: foundation.profile.ITEM_BY,
            revoked: foundation.profile.revoked,
            COLLECTION_PROGRESS: foundation.profile.COLLECTION_PROGRESS,
            accessible: foundation.browser.accessible,
            get refreshArmoryNew() {
              return readMenus().refreshArmoryNew;
            },
            store,
            itemPresentation,
            TYPE_WORD,
          }),
        ),
      ),
    ),
  );
  const activeEquipment = createActiveEquipment(
    cacheView(() =>
      stateView(
        foundation.run.activity,
        ['activeTrial'],
        stateView(
          foundation.run.sessionState,
          ['runTemplate'],
          stateView(foundation.profile.profileEquipment, ['EQ'], {
            G: foundation.run.G,
            SETUP: foundation.profile.SETUP,
            META: foundation.profile.META,
            UNL: foundation.profile.UNL,
            ITEM_BY: foundation.profile.ITEM_BY,
            accessible: foundation.browser.accessible,
          }),
        ),
      ),
    ),
  );
  function powersEnabled() {
    return activeEquipment.powersEnabled();
  }
  function isSp() {
    return activeEquipment.isSp();
  }
  function isSteelThird() {
    return activeEquipment.isSteelThird();
  }
  function isRobeSp() {
    return activeEquipment.isRobeSp();
  }
  function challenge(metric: keyof BladeStats, value = 1) {
    return profileRules.challenge(metric, value);
  }
  function bladeMods() {
    return activeEquipment.bladeMods();
  }
  function bst() {
    return profileRules.bst();
  }
  function computeMods() {
    return activeEquipment.computeMods();
  }
  function checkUnlocks() {
    return profileRules.checkUnlocks();
  }
  return {
    earn,
    profileRules,
    activeEquipment,
    powersEnabled,
    isSp,
    isSteelThird,
    isRobeSp,
    challenge,
    bladeMods,
    bst,
    computeMods,
    checkUnlocks,
  };
}
