import { bindProfileReset } from '../screens/stats.ts';
import { bindProfileManagement } from '../screens/profile-management.ts';
import { bindSaveTransfer } from '../screens/save-transfer.ts';
import { deleteCurrentProfile, isTestProfile, store } from '../../platform/storage.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Statistics } from '../../game/progression/statistics.ts';

export interface ProfileViews {
 readonly $: (id: string) => HTMLElement;
 readonly lifecycle: ReturnType<typeof createLifecycle>;
 readonly playerStats: Statistics;
 readonly playerEquipment: Equipment;
 readonly saveMeta: () => void;
 readonly saveAwakening: () => void;
 readonly UNL: ReadonlySet<string>;
}

/** Profile management binds existing transfer/reset controls without changing save keys. */
export function bindProfileWiring(views: ProfileViews) {
 const { $, lifecycle, playerStats, playerEquipment, saveMeta, saveAwakening, UNL } = views;
  lifecycle.add(bindProfileReset($('options'), deleteCurrentProfile, isTestProfile()));
  function flushProfile() {
    store.set('issen.stats', playerStats);
    store.set('issen.equip', playerEquipment);
    saveMeta();
    saveAwakening();
    store.set('issen.unlocks', [...UNL]);
  }
  lifecycle.add(bindProfileManagement($('options'), flushProfile));
  lifecycle.add(
    bindSaveTransfer(
      $('options'),
      document.querySelector('.title-version')?.textContent || '',
      () => {
        store.set('issen.stats', playerStats);
        store.set('issen.equip', playerEquipment);
        saveMeta();
        saveAwakening();
        store.set('issen.unlocks', [...UNL]);
      },
    ),
  );

 return { flushProfile };
}
