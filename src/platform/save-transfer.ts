import { parseStatistics, parseEquipment, parseSetup, DEFAULT_EQUIPMENT } from './saves.ts';
import { parseSettings } from './settings.ts';
import { parseMeta } from '../game/progression/meta.ts';
import { parseAwakeningProgress } from '../game/progression/awakening-progress.ts';
import { parseTrialProgress, grantTrialRewards } from '../game/progression/trials.ts';
import { unlockEligibleItems } from '../game/progression/unlocks.ts';
import { reconcileCinematicCompanion } from '../game/progression/secret-events.ts';
import { createItems } from '../game/content/items.ts';
import { parseRunCheckpoint } from './run-checkpoint.ts';
import {
  parseCollectionProgress,
  collectionItemStats,
} from '../game/progression/collection-progress.ts';
import { parseTesterPremium } from './tester-premium.ts';
import { mergeDailyLogin, SEVEN_DAWNS_CREST } from '../game/progression/daily-login.ts';

export type SaveData = Record<string, unknown>;
const record = (value: unknown): value is SaveData =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const safeKey = (key: string) => !['__proto__', 'constructor', 'prototype'].includes(key);
const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string' && id.length <= 160)
    : [];

/** Progress merges by maxima/unions, never addition. Missing/bad fields retain local values. */
function merge(a: unknown, b: unknown, depth = 0): unknown {
  if (depth > 20) return a;
  if (
    a !== undefined &&
    b != null &&
    (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b))
  )
    return a;
  if (typeof b === 'number')
    return Number.isFinite(b) && b >= 0
      ? Math.max(typeof a === 'number' && Number.isFinite(a) ? a : 0, b)
      : a;
  if (typeof b === 'boolean') return b || a === true;
  if (Array.isArray(b)) return [...new Set([...strings(a), ...strings(b)])];
  if (record(b)) {
    const old = record(a) ? a : {};
    return Object.fromEntries(
      [...new Set([...Object.keys(old), ...Object.keys(b)])]
        .filter(safeKey)
        .map((key) => [
          key,
          merge(
            Object.hasOwn(old, key) ? old[key] : undefined,
            Object.hasOwn(b, key) ? b[key] : undefined,
            depth + 1,
          ),
        ]),
    );
  }
  return b ?? a;
}
function preferences(local: unknown, incoming: unknown): SaveData {
  return { ...(record(local) ? local : {}), ...(record(incoming) ? incoming : {}) };
}
function archiveOverlay(archive: unknown, current: unknown, depth = 0): unknown {
  if (depth > 20 || current === undefined) return archive;
  if (record(archive) && record(current))
    return Object.fromEntries(
      [...new Set([...Object.keys(archive), ...Object.keys(current)])]
        .filter(safeKey)
        .map((key) => [
          key,
          archiveOverlay(
            Object.hasOwn(archive, key) ? archive[key] : undefined,
            Object.hasOwn(current, key) ? current[key] : undefined,
            depth + 1,
          ),
        ]),
    );
  return current;
}

export function exportSave(data: SaveData, gameVersion: string, testing = false): string {
  const { transferArchive, importBackup: _backup, ...current } = data;
  // Keep unfamiliar sections/IDs from newer versions through a round trip.
  const archived = record(transferArchive) ? transferArchive : {};
  const preserved = archiveOverlay(archived, current) as SaveData;
  for (const key of ['unlocks', 'trials']) preserved[key] = merge(archived[key], current[key]);
  return JSON.stringify(
    {
      format: 'issen-save',
      version: 1,
      gameVersion,
      createdAt: new Date().toISOString(),
      profile: testing ? 'testing' : 'player',
      data: preserved,
    },
    null,
    2,
  );
}

export interface ImportPlan {
  data: SaveData;
  summary: string;
  warnings: string[];
  sourceProfile: string;
}
export function prepareImport(text: string, local: SaveData): ImportPlan {
  if (text.length > 8_000_000) throw new Error('This save file is too large.');
  let root: unknown;
  try {
    root = JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('This file is not readable JSON. Your save has not changed.');
  }
  if (!record(root)) throw new Error('Choose an Issen save file.');
  if (root.format && root.format !== 'issen-save') throw new Error('Choose an Issen save file.');
  if (root.format === 'issen-save' && !record(root.data))
    throw new Error('This save has no profile data.');
  const source = record(root.data) ? root.data : root;
  const warnings: string[] = [];
  const incoming: SaveData = {};
  for (const [rawKey, raw] of Object.entries(source)) {
    const key = rawKey.replace(/^issen\.(?:testing\.)?/, '');
    if (
      !/^[a-z][a-zA-Z0-9]*$/.test(key) ||
      !safeKey(key) ||
      ['importJournal', 'importBackup', 'transferArchive', 'revoked'].includes(key)
    )
      continue;
    let value = raw;
    if (rawKey.startsWith('issen.') && typeof raw === 'string') {
      try {
        value = JSON.parse(raw);
      } catch {
        warnings.push(`${key}: unreadable section skipped`);
        continue;
      }
    }
    incoming[key] = value;
  }
  if (
    !['stats', 'unlocks', 'meta', 'trials', 'awakening', 'equip'].some((key) =>
      Object.hasOwn(incoming, key),
    )
  )
    throw new Error('No Issen progress was found in this file.');
  if (
    !['stats', 'meta', 'trials', 'awakening', 'equip'].some((key) => record(incoming[key])) &&
    !Array.isArray(incoming.unlocks)
  )
    throw new Error('No readable progress was found in this file. Your save has not changed.');
  const stats = parseStatistics(
    merge(parseStatistics(local.stats, local.best), incoming.stats),
    Math.max(Number(local.best) || 0, Number(incoming.best) || 0),
  );
  const unlocked = new Set([
    ...strings(local.unlocks),
    ...strings(incoming.unlocks),
    ...Object.values(DEFAULT_EQUIPMENT).filter((id): id is string => typeof id === 'string'),
  ]);
  const trials = parseTrialProgress(merge(local.trials, incoming.trials));
  const dailyLogin = mergeDailyLogin(local.dailyLogin, incoming.dailyLogin);
  if (unlocked.has(SEVEN_DAWNS_CREST)) dailyLogin.earned = true;
  if (dailyLogin.earned) unlocked.add(SEVEN_DAWNS_CREST);
  grantTrialRewards(trials, unlocked);
  const meta = parseMeta(
    merge(
      parseMeta(local.meta, local.stats, new Set(strings(local.unlocks))),
      parseMeta(incoming.meta, incoming.stats, unlocked),
    ),
    stats,
    unlocked,
  );
  if (record(local.meta) && local.meta.tutorial === 'completed') meta.tutorial = 'completed';
  const awakening = parseAwakeningProgress(
    merge(
      parseAwakeningProgress(local.awakening, parseStatistics(local.stats).bl),
      parseAwakeningProgress(incoming.awakening, parseStatistics(incoming.stats).bl),
    ),
  );
  const collections = parseCollectionProgress(
    merge(local.collections, incoming.collections),
    stats,
  );
  collections.lastStats = structuredClone(stats);
  const items = createItems(() => unlocked);
  reconcileCinematicCompanion(stats, unlocked);
  unlockEligibleItems(stats, unlocked, items, () => {}, {
    access: meta.upgrades.awakening,
    progress: awakening,
    itemStats: (id) => collectionItemStats(collections, meta, stats, id),
    paidAwakenings: true,
  });
  const data: SaveData = {
    stats,
    best: stats.bestScore,
    unlocks: [...unlocked],
    trials,
    meta,
    awakening,
    collections,
    dailyLogin,
    testerPremium: parseTesterPremium(merge(local.testerPremium, incoming.testerPremium)),
    equip: parseEquipment(preferences(local.equip, incoming.equip), unlocked, items),
    setup: parseSetup(preferences(local.setup, incoming.setup)),
    settings: parseSettings(
      { version: 1, ...preferences(local.settings, incoming.settings) },
      typeof incoming.muted === 'boolean' ? incoming.muted : local.muted === true,
    ),
    armorySeen: merge(local.armorySeen, incoming.armorySeen),
    guidedLessons: merge(local.guidedLessons, incoming.guidedLessons),
    hints: merge(local.hints, incoming.hints),
    daily: merge(local.daily, incoming.daily),
    transferArchive: archiveOverlay(local.transferArchive, incoming),
  };
  data.muted = (data.settings as { muted: boolean }).muted;
  // An old checkpoint could overwrite imported progression on startup. Transfer only an explicit compatible one,
  // replacing its profile snapshots with the merged permanent progress.
  const checkpoint = parseRunCheckpoint(incoming.runCheckpoint);
  data.runCheckpoint = checkpoint
    ? { ...checkpoint, stats, meta, awakening, collections, unlocks: [...unlocked] }
    : null;
  if (incoming.runCheckpoint && !checkpoint)
    warnings.push('The unfinished run was incompatible; permanent progress was recovered.');
  for (const key of ['stats', 'meta', 'awakening', 'trials', 'settings', 'equip']) {
    if (Object.hasOwn(incoming, key) && !record(incoming[key]))
      warnings.push(`${key}: damaged section repaired using your current progress`);
  }
  for (const [key, value] of Object.entries(data)) if (value === undefined) delete data[key];
  return {
    data,
    warnings,
    sourceProfile: root.profile === 'testing' ? 'testing' : 'player',
    summary: `${unlocked.size} unlocks · ${trials.completed.length} completed Trials · ${meta.embers.toLocaleString()} Embers · best score ${stats.bestScore.toLocaleString()}`,
  };
}
