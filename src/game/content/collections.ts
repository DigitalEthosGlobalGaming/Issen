import type { Statistics } from '../progression/statistics.ts';
export const COLLECTIONS = {
  weapons: [
    ['sakura', 'kodachi', 'kage', 'bokken', 'yuki'],
    ['raijin', 'doji', 'kiku', 'oboro', 'onikiri'],
    ['tsuki', 'mura', 'masamune', 'orochi', 'tsubame'],
  ],
  outfits: [
    ['kasa', 'shiro', 'oni', 'monk', 'rags'],
    ['tengu', 'mino', 'jinbaori', 'shinobi', 'noh'],
    ['helm', 'kitsune', 'yoroi', 'komuso', 'kabuki'],
  ],
  blessings: [
    ['calm', 'momentum', 'zanshin', 'foresight', 'flurry'],
    ['fox', 'stormborn', 'knifedance', 'stolentempo', 'counter'],
    ['finalflourish', 'whetstone', 'duelist', 'steady', 'phoenix'],
    ['lantern', 'harvest', 'quickstep', 'paperward', 'echo'],
  ],
  curses: [['frenzy', 'silence', 'oath', 'haste', 'blind']],
} as const;
export type CollectionId = keyof typeof COLLECTIONS;
export const COLLECTION_CHALLENGES: Readonly<
  Record<string, readonly [keyof Statistics, number, string]>
> = {
  sakura: ['furthestStage', 2, 'Stage'],
  kodachi: ['perfects', 50, 'Perfect cuts'],
  kage: ['bestPStreak', 10, 'Perfect streak'],
  bokken: ['w1deaths', 10, 'Wave 1 deaths'],
  yuki: ['shrines', 10, 'Shrines'],
  raijin: ['duels', 10, 'Duels'],
  doji: ['duels', 15, 'Duels'],
  kiku: ['bestCombo', 60, 'Best combo'],
  oboro: ['roninWave', 6, 'Ronin wave'],
  onikiri: ['duels', 20, 'Duels'],
  tsuki: ['furthestStage', 8, 'Stage'],
  mura: ['bestScore', 50000, 'Best score'],
  masamune: ['flawlessWave', 12, 'Flawless wave'],
  orochi: ['kills', 1000, 'Kills'],
  tsubame: ['bestPStreak', 20, 'Perfect streak'],
  kasa: ['duels', 5, 'Duels'],
  shiro: ['bestScore', 20000, 'Best score'],
  oni: ['cleanDuels', 1, 'Clean duels'],
  monk: ['shrines', 5, 'Shrines'],
  tengu: ['perfects', 100, 'Perfect cuts'],
  mino: ['furthestStage', 7, 'Stage'],
  jinbaori: ['bestWave', 12, 'Wave'],
  shinobi: ['standoffs', 5, 'Standoffs'],
  noh: ['rares', 3, 'Rare blessings'],
  helm: ['bestWave', 20, 'Wave'],
  kitsune: ['mirrorWins', 1, 'Mirror victories'],
  yoroi: ['bestWave', 24, 'Wave'],
  komuso: ['bladeWave', 9, 'Blade Only wave'],
  kabuki: ['bestCombo', 70, 'Best combo'],
};
export function equipmentPack(
  id: string,
): { category: 'weapons' | 'outfits'; rank: number; key: string } | null {
  for (const category of ['weapons', 'outfits'] as const) {
    const index = COLLECTIONS[category].findIndex((pack) =>
      (pack as readonly string[]).includes(id),
    );
    if (index >= 0) return { category, rank: index + 1, key: `${category}${index + 1}` };
  }
  return null;
}
export function collectionBlessings(
  ranks: Readonly<Record<CollectionId, number>>,
  all: readonly string[],
): string[] {
  const locked = new Set<string>();
  for (const category of ['blessings', 'curses'] as const)
    COLLECTIONS[category].forEach((pack, index) => {
      if (index >= ranks[category]) for (const id of pack) locked.add(id);
    });
  return all.filter((id) => !locked.has(id));
}
