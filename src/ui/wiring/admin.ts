import { renderAdmin } from '../screens/admin.ts';
import { SPECIAL, STEEL_THIRD } from '../../game/content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../../game/content/robe-awakenings.ts';
import { STAGES } from '../../game/content/stages.ts';
import { EMPTY_UPGRADES, TEMPLATE_UPGRADES, sanitizeSetup } from '../../game/progression/meta.ts';
import { trialsUnlocked } from '../../game/progression/trials.ts';
import { DEFAULT_EQUIPMENT, parseEquipment } from '../../platform/saves.ts';
import {
  clearTestProfile,
  isTestProfile,
  switchTestProfile,
  store,
} from '../../platform/storage.ts';
import type { Equipment, Setup } from '../../platform/saves.ts';
import type { Item, ItemCategory } from '../../game/content/items.ts';
import type { RunState, Screen } from '../../game/run-state.ts';
import type { Statistics } from '../../game/progression/statistics.ts';
import type { MetaProgress } from '../../game/progression/meta.ts';
import type { AwakeningProgress } from '../../game/progression/awakening-progress.ts';

export interface AdminViews {
  readonly AWAKENING: AwakeningProgress;
  readonly EQ: Equipment;
  readonly G: RunState;
  readonly ITEMS: Item[];
  readonly ITEM_BY: Record<string, Item>;
  readonly META: MetaProgress;
  readonly SETUP: Setup;
  readonly UNL: Set<string>;
  readonly playerEquipment: Equipment;
  readonly playerStats: Statistics;
  readonly revoked: Set<string>;
  readonly applySeal: () => void;
  readonly checkUnlocks: () => void;
  readonly computeMods: () => void;
  readonly hud: (on: boolean) => void;
  readonly launchTutorial: () => void;
  readonly refreshArmoryNew: () => void;
  readonly renderLives: () => void;
  readonly renderSetup: () => void;
  readonly saveAwakening: () => void;
  readonly saveMeta: () => void;
  readonly setBestLine: () => void;
  readonly setTrialsWasUnlocked: (value: boolean) => void;
  readonly showScreen: (id: Screen | null) => void;
  readonly testJump: (stage: number, wave: number, boss: boolean) => void;
  readonly toast: (item: { k: string; msg?: string; n?: string; type?: ItemCategory }) => void;
}

/** Testing controls retain their guards and persistence keys. EQ is a live getter. */
export function createAdminWiring(root: HTMLElement, views: AdminViews) {
  function showAdmin() {
    const {
      AWAKENING,
      G,
      ITEMS,
      ITEM_BY,
      META,
      SETUP,
      UNL,
      applySeal,
      checkUnlocks,
      computeMods,
      hud,
      launchTutorial,
      playerEquipment,
      playerStats,
      refreshArmoryNew,
      renderLives,
      renderSetup,
      revoked,
      saveAwakening,
      saveMeta,
      setBestLine,
      showScreen,
      testJump,
      toast,
    } = views;
    renderAdmin(
      root,
      [
        ...ITEMS,
        ...Object.keys({ ...SPECIAL, ...ROBE_AWAKENINGS }).map((id) => ({
          id: id + '+',
          n: `${ITEM_BY[id]?.n ?? id} awakened`,
        })),
        { id: 'steel++', n: 'Tamahagane third awakening' },
      ],
      STAGES,
      {
        testing: isTestProfile(),
        modeMilestone: META.bossMilestone,
        trialsUnlocked: trialsUnlocked(playerStats.roninWave),
        upgradesEnabled: SETUP.upgrades !== false,
        tutorialStatus: META.tutorial,
        embers: META.embers,
        currentLives: G.lives,
        currentKnives: G.knives,
        currentStage: G.stage,
        currentWave: G.wave,
        clearProfile: () => clearTestProfile(),
        unlockAll: () => {
          if (!isTestProfile()) return;
          const ids = [
            ...ITEMS.map((item) => item.id),
            ...Object.keys({ ...SPECIAL, ...ROBE_AWAKENINGS }).map((id) => id + '+'),
            'steel++',
          ];
          for (const id of ids) {
            UNL.add(id);
            revoked.delete(id);
          }
          store.set('issen.revoked', [...revoked]);
          store.set('issen.unlocks', [...UNL]);
          // Endless and No lives share the first Vitality access gate.
          META.upgrades.vitality = Math.max(1, META.upgrades.vitality);
          saveMeta();
          refreshArmoryNew();
          showAdmin();
        },
        unlockRonin: () => {
          if (!isTestProfile() || META.bossMilestone >= 2) return;
          META.bossMilestone = 2;
          META.revealSeen = Math.max(META.revealSeen, 2);
          saveMeta();
        },
        setTrialsUnlocked: (enabled) => {
          if (!isTestProfile()) return;
          if (enabled && META.bossMilestone < 2) {
            META.bossMilestone = 2;
            META.revealSeen = Math.max(META.revealSeen, 2);
            saveMeta();
          }
          playerStats.roninWave = enabled ? Math.max(10, playerStats.roninWave) : 0;
          store.set('issen.stats', playerStats);
          views.setTrialsWasUnlocked(enabled);
          setBestLine();
        },
        switchProfile: (enabled) => {
          if (!switchTestProfile(enabled))
            toast({ k: '!', msg: 'Profile switching is unavailable in this browser session.' });
        },
        jump: testJump,
        restart: () => testJump(G.stage, ((Math.max(1, G.wave) - 1) % 3) + 1, !!G.boss),
        item: (id, action) => {
          if (!isTestProfile()) return;
          const awakened = id.endsWith('+');
          const third = id === 'steel++';
          const base = id.replace(/\++$/, '');
          const item = ITEM_BY[base];
          if (!item || (awakened && !SPECIAL[base] && !ROBE_AWAKENINGS[base])) return;
          if (action === 'remove') {
            if (!Object.values(DEFAULT_EQUIPMENT).includes(id)) revoked.add(id);
            if (!awakened) revoked.add(id + '+');
            if (base === 'steel' && !awakened) revoked.add('steel++');
            UNL.delete(id);
            if (!awakened) UNL.delete(id + '+');
            if (base === 'steel' && !awakened) UNL.delete('steel++');
            for (const value of Object.values(DEFAULT_EQUIPMENT))
              if (typeof value === 'string') UNL.add(value);
            Object.assign(views.EQ, parseEquipment(views.EQ, UNL, ITEMS));
            if (!UNL.has(views.EQ.blade + '+')) views.EQ.bladeSp = false;
            if (!UNL.has('steel++')) views.EQ.bladeThird = false;
            if (!UNL.has(views.EQ.robe + '+')) views.EQ.robeSp = false;
          } else {
            revoked.delete(base);
            revoked.delete(id);
            UNL.add(base);
            UNL.add(id);
            if (action === 'equip') {
              views.EQ[item.type] = base;
              if (item.type === 'blade') {
                views.EQ.bladeSp = awakened && !third;
                views.EQ.bladeThird = third;
              }
              if (item.type === 'robe') views.EQ.robeSp = awakened;
            }
          }
          store.set('issen.revoked', [...revoked]);
          store.set('issen.unlocks', [...UNL]);
          store.set('issen.equip', playerEquipment);
          computeMods();
          applySeal();
          G.runBlade = views.EQ.blade;
          G.runRobe = views.EQ.robe;
        },
        lives: (value) => {
          if (!Number.isFinite(value)) return;
          G.maxLives = Math.max(1, Math.min(99, Math.floor(value)));
          G.lives = Math.max(0, Math.min(99, Math.floor(value)));
          renderLives();
        },
        currency: (value) => {
          if (Number.isFinite(value)) {
            META.embers = Math.max(0, Math.min(1000000, Math.floor(value)));
            saveMeta();
          }
        },
        resetUpgrades: () => {
          META.upgrades = { ...EMPTY_UPGRADES };
          saveMeta();
        },
        upgrades: TEMPLATE_UPGRADES.map((upgrade) => ({
          ...upgrade,
          rank: META.upgrades[upgrade.id],
        })),
        setUpgrade: (id, rank) => {
          const definition = TEMPLATE_UPGRADES.find((u) => u.id === id);
          if (!definition || !Number.isFinite(rank)) return;
          META.upgrades[definition.id] = Math.max(
            0,
            Math.min(definition.maxRank, Math.floor(rank)),
          );
          saveMeta();
        },
        setKnives: (value) => {
          if (Number.isFinite(value)) {
            G.knives = Math.max(0, Math.min(3, Math.floor(value)));
            G.maxKnives = Math.max(G.maxKnives, G.knives);
            hud(true);
          }
        },
        setUpgradesEnabled: (enabled) => {
          SETUP.upgrades = enabled;
          store.set('issen.setup', SETUP);
        },
        completeChallenge: (id) => {
          const base = id.replace(/\++$/, '');
          const definition =
            id === 'steel++' ? STEEL_THIRD : (SPECIAL[base] ?? ROBE_AWAKENINGS[base]);
          if (!definition) return;
          const table = SPECIAL[base] ? AWAKENING.blades : AWAKENING.robes;
          const row = (table[base] ??= { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
          row[definition.need[0]] = definition.need[1];
          saveAwakening();
          checkUnlocks();
        },
        milestone: (value) => {
          META.bossMilestone = Math.max(0, Math.min(3, value));
          META.revealSeen = META.bossMilestone;
          Object.assign(SETUP, sanitizeSetup(SETUP, META));
          saveMeta();
        },
        tutorial: (value) => {
          META.tutorial = value;
          saveMeta();
        },
        replayTutorial: launchTutorial,
        replayReveals: () => {
          META.revealSeen = 0;
          saveMeta();
          G.panelFrom = 'title';
          G.panel = 'setup';
          renderSetup();
          showScreen('setup');
        },
        inspect: () =>
          `Stage ${G.stage + 1}, wave ${G.wave}, lives ${G.lives}; knives ${G.knives}\n${META.embers} Embers; mode milestone ${META.bossMilestone}; Trials ${trialsUnlocked(playerStats.roninWave)}; awakening access ${META.upgrades.awakening > 0}; next run upgrades ${SETUP.upgrades !== false}\nRanks: ${JSON.stringify(META.upgrades)}\nModifiers: ${JSON.stringify(G.m)}`,
      },
    );
  }

  return { showAdmin };
}
