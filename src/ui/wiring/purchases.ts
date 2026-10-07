import { premium, listenToPurchases } from '../../platform/purchases.ts';
import { PREMIUM_FILM } from '../../platform/premium.ts';
import { TESTER_PREMIUM_CAMPAIGN, testerPremiumActive } from '../../platform/tester-premium.ts';
import { itemAccessible, trialAccessible } from '../../platform/editions.ts';
import { parseEquipment } from '../../platform/saves.ts';
import { templateModifiers } from '../../game/progression/meta.ts';
import { renderSupport } from '../screens/support.ts';
import { renderTemplate } from '../screens/template.ts';
import { store } from '../../platform/storage.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { createAudio } from '../../audio/audio.ts';
import type { Equipment, Setup } from '../../platform/saves.ts';
import type { Item } from '../../game/content/items.ts';
import type { RunState, Screen } from '../../game/run-state.ts';
import type { MetaProgress } from '../../game/progression/meta.ts';
import type { TrialDefinition } from '../../game/content/trials.ts';
import type { GameEdition } from '../../platform/editions.ts';
import type { parseTesterPremium } from '../../platform/tester-premium.ts';

export interface PurchaseViews {
 readonly $: (id: string) => HTMLElement;
 readonly G: RunState;
 readonly EQ: Equipment;
 readonly playerEquipment: Equipment;
 readonly savedEquipment: unknown;
 readonly savedFilm: unknown;
 readonly META: MetaProgress;
 readonly SETUP: Setup;
 readonly ITEMS: Item[];
 readonly activeTrial: TrialDefinition | null;
 readonly lifecycle: ReturnType<typeof createLifecycle>;
 readonly audio: ReturnType<typeof createAudio>;
 readonly guided: { readonly frozen: boolean };
 readonly edition: GameEdition;
 readonly UNL: Set<string>;
 initialPurchaseCheck: boolean;
 testerPremium: ReturnType<typeof parseTesterPremium>;
 runTemplate: ReturnType<typeof templateModifiers>;
 trialFailure: string;
 readonly premiumAccess: () => boolean;
 readonly accessibleUnlocks: () => Set<string>;
 readonly computeMods: () => void;
 readonly renderArmory: () => void;
 readonly saveMeta: () => void;
 readonly openPanel: (id: Screen) => void;
 readonly pause: () => void;
}

/** Purchase/profile UI keeps its existing ownership guards and persisted keys. */
export function bindPurchaseWiring(views: PurchaseViews) {
 const { $, G, lifecycle, premiumAccess, savedEquipment, accessibleUnlocks, ITEMS, playerEquipment, savedFilm, META, SETUP, computeMods, renderArmory, saveMeta, openPanel, pause, audio, guided, edition, UNL } = views;
  $('bSupport').hidden = false;
  lifecycle.add(
    premium.subscribe((state) => {
      if (lifecycle.disposed) return;
      $('premiumBadge').hidden = !premiumAccess();
      $('premiumBadge').textContent = premium.state.owned
        ? 'Premium'
        : testerPremiumActive(views.testerPremium)
          ? 'Tester Premium'
          : edition === 'web'
            ? 'Web'
            : 'Premium';
      if (premiumAccess()) {
        UNL.add(PREMIUM_FILM);
        if (views.initialPurchaseCheck) {
          const restored = parseEquipment(savedEquipment, accessibleUnlocks(), ITEMS);
          for (const category of ['charm', 'fx', 'film', 'seal'] as const)
            if (!itemAccessible(restored[category], false))
              playerEquipment[category] = restored[category];
        }
        if (views.initialPurchaseCheck && savedFilm === PREMIUM_FILM && playerEquipment.film === 'mono') {
          playerEquipment.film = PREMIUM_FILM;
        }
        views.initialPurchaseCheck = false;
      } else {
        UNL.delete(PREMIUM_FILM);
        if (playerEquipment.film === PREMIUM_FILM) playerEquipment.film = 'mono';
        if (views.EQ.film === PREMIUM_FILM) views.EQ.film = 'mono';
      }
      if (!premiumAccess()) {
        Object.assign(playerEquipment, parseEquipment(playerEquipment, accessibleUnlocks(), ITEMS));
        if (views.EQ !== playerEquipment)
          Object.assign(views.EQ, parseEquipment(views.EQ, accessibleUnlocks(), ITEMS));
        if (G.state !== 'title') {
          views.runTemplate = templateModifiers(META, SETUP, false);
          G.shrineRerolls = 0;
          computeMods();
        }
      }
      renderSupport($('support'), state, testerPremiumActive(views.testerPremium));
      if (G.panel === 'armory') renderArmory();
      if (G.panel === 'template')
        renderTemplate($('templateContent'), META, saveMeta, premiumAccess());
      if (views.activeTrial && !trialAccessible(views.activeTrial.id, premiumAccess()))
        views.trialFailure = 'Premium access is required for this Trial.';
    }),
  );
  lifecycle.add(listenToPurchases());
  void premium.refresh().finally(() => {
    views.initialPurchaseCheck = false;
  });
  lifecycle.listen(document, 'visibilitychange', () => {
    if (!document.hidden) void premium.refresh();
  });
  lifecycle.listen($('bSupport'), 'click', () => openPanel('support'));
  const purchaseAction = async (action: () => Promise<void>) => {
    pause();
    audio.setPaused(true);
    await action();
    if (!lifecycle.disposed) audio.setPaused(G.state === 'paused' || guided.frozen);
  };
  lifecycle.listen($('bPurchasePremium'), 'click', () => {
    views.testerPremium = { campaign: TESTER_PREMIUM_CAMPAIGN };
    store.set('issen.testerPremium', views.testerPremium);
    UNL.add(PREMIUM_FILM);
    $('premiumBadge').hidden = false;
    $('premiumBadge').textContent = 'Tester Premium';
    renderSupport($('support'), premium.state, true);
  });
  lifecycle.listen($('bRestorePremium'), 'click', () => {
    void purchaseAction(premium.restore);
  });
  lifecycle.listen($('bRefreshPremium'), 'click', () => {
    void premium.refresh();
  });
  lifecycle.listen($('bEquipPremium'), 'click', () => {
    if (!premiumAccess()) return;
    playerEquipment.film = PREMIUM_FILM;
    store.set('issen.equip', playerEquipment);
    $('supportMessage').textContent = 'Supporter Print selected. Change films any time in Armory.';
  });

}
