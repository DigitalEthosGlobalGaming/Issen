import { createPresetScreen } from '../screens/presets.ts';
import { createArmoryScreen } from '../screens/armory.ts';
import { parsePresets, presetEquipment } from '../../game/progression/presets.ts';
import { equipmentPack } from '../../game/content/collections.ts';
import { collectionChallengeText } from '../../game/progression/collection-progress.ts';
import { SEVEN_DAWNS_CREST } from '../../game/progression/daily-login.ts';
import {
  awakeningCost,
  awakeningPurchasable,
  purchaseAwakening,
} from '../../game/progression/awakening-purchases.ts';
import { store } from '../../platform/storage.ts';
import { PREMIUM_FILM } from '../../platform/premium.ts';
import type { Equipment, Setup } from '../../platform/saves.ts';
import type { MetaProgress } from '../../game/progression/meta.ts';
import type { Statistics } from '../../game/progression/statistics.ts';
import type { CollectionProgress } from '../../game/progression/collection-progress.ts';
import type { DailyLoginProgress } from '../../game/progression/daily-login.ts';
import type { AwakeningProgress } from '../../game/progression/awakening-progress.ts';
import type { Item, ItemCategory } from '../../game/content/items.ts';
import type { RunState, Screen } from '../../game/run-state.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';

export interface ArmoryViews {
  readonly inspectionChanged: (expanded: boolean) => void;
  readonly $: (id: string) => HTMLElement;
  readonly META: MetaProgress;
  readonly EQ: Equipment;
  readonly ST: Statistics;
  readonly SETUP: Setup;
  readonly G: RunState;
  readonly ITEMS: Item[];
  readonly UNL: Set<string>;
  readonly DAILY_LOGIN: DailyLoginProgress;
  readonly COLLECTION_PROGRESS: CollectionProgress;
  readonly AWAKENING: AwakeningProgress;
  readonly ARMORY_SEEN: Set<string>;
  readonly SEALS: Readonly<Record<string, string>>;
  readonly CHARMCOL: Readonly<Record<string, string>>;
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly accessibleUnlocks: () => Set<string>;
  readonly accessible: (id: string) => boolean;
  readonly premiumAccess: () => boolean;
  readonly computeMods: () => void;
  readonly applySeal: () => void;
  readonly saveMeta: () => void;
  readonly sfx: { glint: () => void };
  readonly demoKill: () => void;
  readonly openPanel: (id: Screen) => void;
  readonly toast: (item: { k: string; msg?: string; n?: string; type?: ItemCategory }) => void;
}

/** Owns Armoury and preset callbacks; current equipment/statistics stay live views. */
export function createArmoryWiring(views: ArmoryViews) {
  const {
    $,
    META,
    ITEMS,
    accessibleUnlocks,
    accessible,
    computeMods,
    applySeal,
    G,
    UNL,
    premiumAccess,
    DAILY_LOGIN,
    COLLECTION_PROGRESS,
    ARMORY_SEEN,
    SEALS,
    CHARMCOL,
    AWAKENING,
    SETUP,
    saveMeta,
    toast,
    sfx,
    demoKill,
    openPanel,
    lifecycle,
  } = views;
  const PRESETS = parsePresets(store.get('issen.presets', null));
  const presetScreen = createPresetScreen($('armory'), {
    presets: PRESETS,
    capacity: () => META.upgrades.presets,
    current: () => views.EQ,
    save: () => {
      store.set('issen.presets', PRESETS);
    },
    equip: (preset) => {
      Object.assign(
        views.EQ,
        presetEquipment(preset, accessibleUnlocks(), ITEMS, META.upgrades.awakening),
      );
      equipArmory(views.EQ);
      renderArmory();
    },
    temple: () => {
      $('templateContent').dataset.selectedUpgrade = 'presets';
      openPanel('template');
    },
  });
  lifecycle.add(presetScreen.dispose);
  function equipArmory(equipment: typeof views.EQ) {
    store.set('issen.equip', equipment);
    computeMods();
    applySeal();
    G.runBlade = views.EQ.blade;
    G.runRobe = views.EQ.robe;
  }
  const armory = createArmoryScreen($('armory'), {
    inspectionChanged: views.inspectionChanged,
    items: ITEMS,
    equipment: views.EQ,
    unlocks: UNL,
    owns: (id) => accessible(id) && (id === PREMIUM_FILM ? premiumAccess() : UNL.has(id)),
    accessible,
    progress: (id) =>
      id === SEVEN_DAWNS_CREST
        ? `Consecutive days: ${DAILY_LOGIN.streak}/7`
        : equipmentPack(id)
          ? collectionChallengeText(COLLECTION_PROGRESS, META, views.ST, id)
          : id === 'falling-leaves'
            ? `Kills: ${Math.min(views.ST.kills, 1000)} / 1,000`
            : id === 'ember-ash'
              ? `Duels: ${Math.min(views.ST.duels, 50)} / 50`
              : id === 'ink-wash'
                ? `Best run perfect cuts: ${Math.min(views.ST.bestRunPerfects, 100)} / 100`
                : id === 'pilgrims-bead'
                  ? `Duels: ${Math.min(views.ST.duels, 10)} / 10`
                  : '',
    statistics: views.ST,
    seen: ARMORY_SEEN,
    onViewed: () => {
      store.set('issen.armorySeen', [...ARMORY_SEEN]);
      refreshArmoryNew();
    },
    seals: SEALS,
    charms: CHARMCOL,
    awakeningAccess: (type) => META.upgrades.awakening >= (type === 'robe' ? 2 : 1),
    awakeningProgress: (id, type) =>
      type === 'blade' ? AWAKENING.blades[id] : AWAKENING.robes[id],
    awakeningPurchase: (id) => ({
      ready: accessible(id) && awakeningPurchasable(META, UNL, ITEMS, AWAKENING, id),
      cost: awakeningCost(id),
      balance: META.embers,
    }),
    buyAwakening: (id) => {
      if (!accessible(id) || !purchaseAwakening(META, UNL, ITEMS, AWAKENING, id)) return false;
      saveMeta();
      store.set('issen.unlocks', [...UNL]);
      refreshArmoryNew();
      toast({ k: '真', msg: 'Awakening unlocked' });
      return true;
    },
    powersEnabled: () => SETUP.upgrades !== false,
    events: {
      equipped: equipArmory,
      rendered: presetScreen.refresh,
      awaken: () => sfx.glint(),
      preview: demoKill,
    },
  });
  const renderArmory = armory.render;
  function refreshArmoryNew() {
    const unread = armory.hasNew();
    $('bArmory').classList.toggle('arm-unread', unread);
    if (unread) $('bArmory').setAttribute('aria-description', 'Unviewed equipment');
    else $('bArmory').removeAttribute('aria-description');
  }

  return { PRESETS, presetScreen, armory, equipArmory, renderArmory, refreshArmoryNew };
}
