import { parseDailyLogin, SEVEN_DAWNS_CREST } from './daily-login.ts';
import { reconcileCinematicCompanion } from './secret-events.ts';
import { parseTrialProgress, grantTrialRewards } from './trials.ts';
import { parseMeta, sanitizeSetup } from './meta.ts';
import { parseAwakeningProgress } from './awakening-progress.ts';
import { parseCollectionProgress, initializeCollections } from './collection-progress.ts';
import { parseArmorySeen } from './armory-seen.ts';
import { PREMIUM_FILM } from '../../platform/premium.ts';
import type * as Saves from '../../platform/saves.ts';
import type { Statistics } from './statistics.ts';
import type { Item } from '../content/items.ts';
export interface ProfileServices {
  readonly store: { get(key: string, fallback: unknown): unknown; set(key: string, value: unknown): boolean };
  readonly loadStatistics: typeof Saves.loadStatistics;
  readonly loadSetup: typeof Saves.loadSetup;
  readonly loadUnlocks: typeof Saves.loadUnlocks;
  readonly loadEquipment: typeof Saves.loadEquipment;
  readonly premiumAccess: () => boolean;
  readonly accessible: (id: string) => boolean;
  readonly isTestProfile: () => boolean;
}
/** Phased initialization preserves the original profile reads/writes and identity. */
export function createProfileFoundation(services: Pick<ProfileServices, 'store' | 'loadStatistics' | 'loadSetup' | 'loadUnlocks' | 'premiumAccess'>) {
  const { store, loadStatistics, loadSetup, loadUnlocks, premiumAccess } = services;
  let ST = loadStatistics();
  const SETUP = loadSetup();
  const UNL = loadUnlocks();
  const DAILY_LOGIN = parseDailyLogin(store.get('issen.dailyLogin', null));
  if (UNL.has(SEVEN_DAWNS_CREST)) DAILY_LOGIN.earned = true;
  if (reconcileCinematicCompanion(ST, UNL)) store.set('issen.unlocks', [...UNL]);
  UNL.delete(PREMIUM_FILM);
  if (premiumAccess()) UNL.add(PREMIUM_FILM);
  const TRIAL_PROGRESS = parseTrialProgress(store.get('issen.trials', null));
  grantTrialRewards(TRIAL_PROGRESS, UNL);
  const playerStats = ST;
  return { ST, SETUP, UNL, DAILY_LOGIN, TRIAL_PROGRESS, playerStats };
}
export function createProfileProgress(services: Pick<ProfileServices, 'store'>, readStats: () => Statistics, SETUP: Saves.Setup, UNL: Set<string>) {
  const { store } = services;
  const ST = readStats();
  const META = parseMeta(store.get('issen.meta', null), ST, UNL);
  const AWAKENING = parseAwakeningProgress(store.get('issen.awakening', null), ST.bl);
  const saveAwakening = () => store.set('issen.awakening', AWAKENING);
  saveAwakening();
  const COLLECTION_PROGRESS = parseCollectionProgress(store.get('issen.collections', null), ST);
  initializeCollections(COLLECTION_PROGRESS, META, ST);
  const saveCollections = () => store.set('issen.collections', COLLECTION_PROGRESS);
  const saveMeta = () => {
    initializeCollections(COLLECTION_PROGRESS, META, readStats());
    saveCollections();
    return store.set('issen.meta', META);
  };
  saveMeta();
  const ARMORY_SEEN = parseArmorySeen(store.get('issen.armorySeen', null), UNL);
  store.set('issen.armorySeen', [...ARMORY_SEEN]);
  Object.assign(SETUP, sanitizeSetup(SETUP, META));
  return { META, AWAKENING, COLLECTION_PROGRESS, saveAwakening, saveCollections, saveMeta, ARMORY_SEEN };
}
export function createProfileEquipment(services: Pick<ProfileServices, 'store' | 'isTestProfile' | 'accessible' | 'loadEquipment'>, UNL: Set<string>, ITEMS: Item[]) {
  const { store, isTestProfile, accessible, loadEquipment } = services;
  const revokedSave = store.get('issen.revoked', []);
  const revoked = new Set<string>(
    isTestProfile() && Array.isArray(revokedSave)
      ? revokedSave.filter((id): id is string => typeof id === 'string')
      : [],
  );
  const accessibleUnlocks = () => new Set([...UNL].filter(accessible));
  let EQ = loadEquipment(accessibleUnlocks(), ITEMS);
  const playerEquipment = EQ;
  const savedFilm = (store.get('issen.equip', {}) as { film?: unknown } | null)?.film;
  const savedEquipment = store.get('issen.equip', {});
  return { revoked, accessibleUnlocks, EQ, playerEquipment, savedFilm, savedEquipment };
}
