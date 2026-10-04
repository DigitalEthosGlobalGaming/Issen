import { parseStatistics } from '../../platform/saves.ts';
import type { Statistics } from './statistics.ts';
import type { RunState } from '../run-state.ts';
import { COLLECTIONS, COLLECTION_CHALLENGES, equipmentPack } from '../content/collections.ts';
import type { MetaProgress } from './meta.ts';

export interface CollectionProgress {
  version: 1;
  records: Record<string, Statistics>;
  lastStats: Statistics;
}
export function parseCollectionProgress(
  raw: unknown,
  stats: Statistics = parseStatistics({}),
): CollectionProgress {
  const saved = raw && typeof raw === 'object' ? (raw as Partial<CollectionProgress>) : {};
  const records: Record<string, Statistics> = {};
  for (const category of ['weapons', 'outfits'] as const)
    COLLECTIONS[category].forEach((_, i) => {
      const key = `${category}${i + 1}`;
      if (saved.records && Object.hasOwn(saved.records, key))
        records[key] = parseStatistics(saved.records[key]);
    });
  return { version: 1, records, lastStats: parseStatistics(saved.lastStats ?? stats) };
}
/** Initialize purchased ranks at zero; buying access never copies lifetime progress. */
export function initializeCollections(
  progress: CollectionProgress,
  meta: MetaProgress,
  stats: Statistics,
): void {
  for (const category of ['weapons', 'outfits'] as const)
    for (let rank = 1; rank <= meta.upgrades[category]; rank++)
      progress.records[`${category}${rank}`] ??= parseStatistics({});
  progress.lastStats = structuredClone(stats);
}
const maxima = new Set([
  'bestScore',
  'bestRonin',
  'bestWave',
  'roninWave',
  'furthestStage',
  'bestCombo',
  'bestZen',
  'bestPStreak',
  'bestRunPerfects',
  'flawlessWave',
  'bladeWave',
  'rushBest',
  'flawless',
]);
/** Cumulative events use deltas; maxima use the current eligible run, never old records. */
export function syncCollectionProgress(
  progress: CollectionProgress,
  meta: MetaProgress,
  stats: Statistics,
  run: RunState,
): void {
  const live: Partial<Statistics> = {
    bestWave: run.zen ? 0 : run.wave,
    roninWave: run.mode === 'ronin' && !run.zen ? run.wave : 0,
    furthestStage: run.zen ? 0 : Math.floor((run.wave - 1) / 3),
    bestScore: run.zen ? 0 : run.score,
    bestRonin: run.mode === 'ronin' && !run.zen ? run.score : 0,
    bestCombo: run.zen ? 0 : run.maxCombo,
    bestZen: run.zen ? run.maxCombo : 0,
    bestPStreak: run.pStreak,
    bestRunPerfects: run.perfects,
    flawlessWave: !run.zen && !run.lostLife ? run.wave : 0,
    bladeWave: run.blade && !run.zen ? run.wave : 0,
    rushBest: run.rush ? run.bossesSlain : 0,
    flawless: !run.zen && !run.lostLife && run.wave >= 9 ? 1 : 0,
  };
  for (const category of ['weapons', 'outfits'] as const)
    for (let rank = 1; rank <= meta.upgrades[category]; rank++) {
      const row = (progress.records[`${category}${rank}`] ??= parseStatistics({}));
      for (const [key, value] of Object.entries(stats)) {
        if (typeof value !== 'number') continue;
        const k = key as keyof Statistics;
        const before = progress.lastStats[k];
        if (maxima.has(key))
          Object.assign(row, { [key]: Math.max(Number(row[k]), Number(live[k] ?? 0)) });
        else
          Object.assign(row, { [key]: Number(row[k]) + Math.max(0, value - Number(before ?? 0)) });
      }
      for (const [reason, value] of Object.entries(stats.deaths))
        row.deaths[reason] =
          (row.deaths[reason] ?? 0) + Math.max(0, value - (progress.lastStats.deaths[reason] ?? 0));
    }
  progress.lastStats = structuredClone(stats);
}
export function collectionItemStats(
  progress: CollectionProgress,
  meta: MetaProgress,
  stats: Statistics,
  id: string,
): Statistics | null {
  const pack = equipmentPack(id);
  return !pack
    ? stats
    : meta.upgrades[pack.category] < pack.rank
      ? null
      : (progress.records[pack.key] ?? parseStatistics({}));
}

export function collectionChallengeText(
  progress: CollectionProgress,
  meta: MetaProgress,
  stats: Statistics,
  id: string,
): string {
  const pack = equipmentPack(id);
  if (!pack) return '';
  const row = collectionItemStats(progress, meta, stats, id);
  if (!row)
    return `Open ${pack.category === 'weapons' ? 'Weapons' : 'Outfits'} rank ${pack.rank} in Temple to begin this challenge.`;
  if (id === 'rags')
    return `Deaths: ${Math.min(
      15,
      Object.values(row.deaths).reduce((a, b) => a + b, 0),
    )}/15`;
  const challenge = COLLECTION_CHALLENGES[id];
  if (!challenge) return 'Challenge progress counts from your pack purchase.';
  const [metric, goal, label] = challenge;
  const current = Math.min(goal, Number(row[metric]));
  return `${label}: ${metric === 'furthestStage' ? current + 1 : current}/${metric === 'furthestStage' ? goal + 1 : goal}`;
}
