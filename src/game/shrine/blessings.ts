import { BLESS } from '../content/blessings.ts';
import type { Modifiers } from '../equipment/modifiers.ts';
import { shuffle } from '../../shared/random.ts';
import type { Random } from '../../shared/random.ts';

export type Blessing = (typeof BLESS)[number];
export interface BlessingState {
  bless: Set<string>;
  zen: boolean;
  hard: boolean;
  lives: number;
  maxLives: number;
  runWards: number;
}
export interface ShrineState extends BlessingState {
  bossCount: number;
  m: Pick<Modifiers, 'noShrine' | 'shrineN' | 'rare' | 'rareShrine'>;
}

/** Returns offers in display order without changing the run or content catalog. */
export function shrineOffers(state: ShrineState, random: Random = Math.random): Blessing[] {
  if (state.m.noShrine) return [];
  const available = (b: Blessing) =>
    !state.bless.has(b.id) &&
    (!b.lives || (!state.zen && !state.hard)) &&
    (b.id !== 'blood' || state.lives > 1);
  const pool = (tier: number) =>
    shuffle(
      BLESS.filter((b) => b.t === tier && available(b)),
      random,
    );
  const common = pool(0),
    rare = pool(1),
    curse = pool(2);
  const offers: Blessing[] = [];
  const take = (items: Blessing[]) => {
    const item = items.pop();
    if (item) offers.push(item);
  };
  if (curse.length && state.bossCount >= 2 && random() < 0.4) take(curse);
  while (offers.length < state.m.shrineN) {
    const items =
      rare.length && random() < Math.max(0, Math.min(1, 0.3 + state.m.rare))
        ? rare
        : common.length
          ? common
          : rare;
    if (!items.length) break;
    take(items);
  }
  const guaranteed = Math.min(state.m.shrineN, Math.max(0, Math.floor(state.m.rareShrine)));
  while (offers.filter((b) => b.t === 1).length < guaranteed && rare.length) {
    if (offers.length >= state.m.shrineN) {
      const replace = offers.findIndex((b) => b.t !== 1);
      if (replace < 0) break;
      offers.splice(replace, 1);
    }
    take(rare);
  }
  return shuffle(offers, random);
}

/** Applies immediate effects after the chosen blessing has been added to the set.
 * Returns extra blessings from Twin for caller-owned notification.
 */
export function applyBlessing(
  state: BlessingState,
  id: string,
  random: Random = Math.random,
): Blessing[] {
  const livesMode = !state.zen && !state.hard;
  if (id === 'blood') state.lives = Math.max(1, state.lives - 1);
  if (id === 'iron' && livesMode) {
    state.maxLives = Math.min(5, state.maxLives + 1);
    state.lives = Math.min(state.maxLives, state.lives + 1);
  }
  if (id === 'paperward') state.runWards += 2;
  if (id === 'glass' && livesMode) {
    state.maxLives = 1;
    state.lives = 1;
  }
  if (id !== 'twin') return [];
  const extras = shuffle(
    BLESS.filter((b) => b.t === 0 && !state.bless.has(b.id) && (!b.lives || livesMode)),
    random,
  ).slice(0, 2);
  for (const blessing of extras) {
    state.bless.add(blessing.id);
    applyBlessing(state, blessing.id, random);
  }
  return extras;
}
