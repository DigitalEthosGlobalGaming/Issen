import { createSetupScreen } from '../screens/setup.ts';
import { createTutorial } from '../screens/tutorial.ts';
import { dailyRun } from '../../game/progression/daily.ts';
import { templatePowers, pendingModeReveals, markModeRevealsSeen } from '../../game/progression/meta.ts';
import { store } from '../../platform/storage.ts';
import type { Equipment, Setup } from '../../platform/saves.ts';
import type { MetaProgress } from '../../game/progression/meta.ts';
import type { Item } from '../../game/content/items.ts';

export interface SetupViews {
 readonly $: (id: string) => HTMLElement;
 readonly SETUP: Setup;
 readonly EQ: Equipment;
 readonly META: MetaProgress;
 readonly ITEM_BY: Record<string, Item>;
 readonly saveMeta: () => void;
 readonly premiumAccess: () => boolean;
 readonly sfx: { glint: () => void };
 readonly toTitle: () => void;
 readonly reducedMotion: () => boolean;
}

/** Owns setup/tutorial callbacks while run entry remains an explicit action. */
export function createSetupWiring(views: SetupViews) {
 const { $, SETUP, META, ITEM_BY, saveMeta, premiumAccess, sfx, toTitle, reducedMotion } = views;
  const setupScreen = createSetupScreen(
    $('setup'),
    SETUP,
    (setup) => store.set('issen.setup', setup),
    {
      getMilestone: () => META.bossMilestone,
      hasVitality: () => META.upgrades.vitality >= 1,
      getReveals: () => pendingModeReveals(META),
      getLoadoutSummary: () => {
        const power = templatePowers(META, SETUP, premiumAccess());
        const summary: string[] = [];
        if (power.tanto > 0) summary.push(`${power.tanto} Tanto strikes`);
        if (power.knives > 0) summary.push(`${power.knives} knives`);
        if (power.composure > 0) summary.push(`${power.composure} combo protections`);
        if (views.EQ.charm === 'omikuji') summary.push('Fortune rolled at run start');
        return summary.join(' · ');
      },
      onRevealed: () => {
        markModeRevealsSeen(META);
        saveMeta();
      },
      onRevealSound: () => sfx.glint(),
    },
  );
  const renderSetup = () => {
    setupScreen.render();
    const daily = dailyRun();
    $('dailyDate').textContent = daily.day;
    $('dailyLoadout').textContent =
      `${ITEM_BY[daily.equipment.blade]?.n} · ${ITEM_BY[daily.equipment.robe]?.n} · ${ITEM_BY[daily.equipment.charm]?.n}`;
  };
  const tutorial = createTutorial(
    $('app'),
    (status) => {
      META.tutorial = status;
      saveMeta();
      toTitle();
    },
    reducedMotion,
  );
  function launchTutorial() {
    toTitle();
    tutorial.start();
  }

 return { setupScreen, renderSetup, tutorial, launchTutorial };
}
