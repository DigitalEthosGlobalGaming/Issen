const DEFAULT_MODIFIERS = {
  /** Enemy attack duration factor: below 1 makes attacks faster. */
  atk: 1,
  /** Multiplier for the time available to parry a duel attack. */
  parry: 1,
  /** Multiplier for the boss's staggered opening after a successful parry. */
  stag: 1,
  /** Offset to the normalized perfect-zone threshold; negative enlarges the arc. */
  pz: 0,
  score: 1,
  perfect: 1,
  normal: 1,
  feint: 0,
  feintMul: 1,
  bossHp: 0,
  bossScore: 1,
  comboStep: 5,
  comboCap: 4,
  hazard: 1,
  shrineN: 3,
  runWard: 0,
  kage: 0,
  noArc: 0,
  /** Added swipes required during a duel opening; negative makes it shorter. */
  chain: 0,
  blind: 0,
  swipe: 1,
  bossDmg: 1,
  noShrine: 0,
  kiku: 0,
  freeze: 0,
  /** Added starting lives, subject to the selected mode's life rules. */
  lives: 0,
  standoff: 1,
  foxsight: 0,
  rareShrine: 0,
  rare: 0,
  regen: 0,
  soWin: 1,
  duelBlind: 0,
  restore: 0,
  serpent: 0,
  noPerfect: 0,
  bonk: 0,
  bladeScore: 1,
  scarScore: 0,
  comboBonus: 0,
  feintSafe: 0,
  suzu: 0,
  maneki: 0,
  daruma: 0,
  foxfire: 0,
  furin: 0,
  ofuda: 0,
  waveBonus: 1,
  gap: 1,
  kagami: 0,
  noFade: 0,
  noRing: 0,
};
/**
 * Resolved gameplay tuning for a run, composed from equipment/fortune sources
 * and blessing IDs by computeModifiers. Catalogs supply Partial<Modifiers>;
 * consumers receive the defaults plus every active source.
 *
 * Values do not all stack alike: duration/score factors multiply, comboStep takes
 * the minimum, comboCap/bossDmg/standoff/shrineN take the maximum, and remaining
 * source fields add. Numeric flags use zero for off. Blessings apply afterwards.
 * Add a field with a neutral default, an explicit stacking rule and a gameplay
 * consumer; changing a catalog description alone never implements a mechanic.
 */
export type Modifiers = typeof DEFAULT_MODIFIERS;

export function computeModifiers(
  sources: readonly (Partial<Modifiers> | undefined)[],
  B: ReadonlySet<string>,
): Modifiers {
  const m: Modifiers = { ...DEFAULT_MODIFIERS };
  for (const mm of sources) {
    if (!mm) continue;
    for (const k of Object.keys(mm) as (keyof Modifiers)[]) {
      const v = mm[k];
      if (v === undefined) continue;
      if (
        [
          'atk',
          'parry',
          'stag',
          'score',
          'perfect',
          'normal',
          'bossScore',
          'hazard',
          'swipe',
          'soWin',
          'bladeScore',
          'waveBonus',
          'gap',
        ].includes(k)
      )
        m[k] *= v;
      else if (k === 'comboStep') m.comboStep = Math.min(m.comboStep, v);
      else if (k === 'comboCap' || k === 'bossDmg' || k === 'standoff') m[k] = Math.max(m[k], v);
      else if (k === 'shrineN') m.shrineN = Math.max(m.shrineN, v);
      else m[k] += v;
    }
  }
  if (B.has('wind')) m.atk *= 1.12;
  if (B.has('eye')) m.pz -= 0.06;
  if (B.has('focus')) m.parry *= 1.25;
  if (B.has('fortune')) m.score *= 1.25;
  if (B.has('edge')) m.chain -= 1;
  if (B.has('calm')) m.feintMul *= 0.5;
  if (B.has('momentum')) m.comboStep = Math.min(m.comboStep, 3);
  if (B.has('stormborn')) m.hazard *= 0.5;
  if (B.has('haste')) {
    m.atk *= 0.8;
    m.perfect *= 3;
  }
  if (B.has('blood')) m.score *= 2;
  if (B.has('blind')) {
    m.score *= 1.8;
    m.blind = 1;
  }
  if (B.has('patience')) m.gap *= 1.2;
  if (B.has('whetstone')) m.normal *= 1.4;
  if (B.has('duelist')) m.bossScore *= 1.5;
  if (B.has('steady')) m.stag *= 1.2;
  if (B.has('lantern')) m.noFade = 1;
  if (B.has('harvest')) m.waveBonus *= 2.5;
  if (B.has('quickstep')) m.swipe *= 0.75;
  if (B.has('gold')) m.score *= 1.5;
  if (B.has('dragon')) m.pz -= 0.1;
  if (B.has('glass')) m.score *= 2.5;
  if (B.has('frenzy')) {
    m.gap *= 0.3;
    m.atk *= 0.85;
    m.comboCap = Math.max(m.comboCap, 6);
  }
  if (B.has('silence')) {
    m.noRing = 1;
    m.noArc = 1;
    m.score *= 1.7;
  }
  return m;
}
