import type { BladeStats } from '../progression/statistics.ts';
import type { Modifiers } from '../equipment/modifiers.ts';

/**
 * An unlockable alternative equipment form: a benefit, tradeoff and optional
 * visuals earned by playing with that blade/outfit after buying Awakening Access.
 * SPECIAL and ROBE_AWAKENINGS use base item IDs; progression/unlocks.ts grants
 * `id + '+'` when the corresponding AwakeningProgress.blades/robes record meets
 * `need`. The Armoury explicitly activates Equipment.bladeSp/robeSp independently.
 * Lifetime Statistics.bl is only a one-time legacy migration source, not the gate.
 *
 * Runtime REPLACES the category's base modifiers with `m`, then combines sources
 * through equipment/modifiers.ts. Upgrades Off suppresses awakened effects and
 * visuals without deleting ownership or preventing eligible challenge progress.
 * Blade style or robe accents/aura are rendered in both live and isolated preview
 * figures. Inactive forms reveal their requirements, never their power text.
 *
 * To add a form, use an existing equipment ID in its catalog and a BladeStats metric
 * actually recorded by the runtime, and supply the full benefit/tradeoff pair.
 * Keep descriptions consistent with modifier composition and consumers. A new
 * metric also needs runtime tracking, defaults and save validation; a new visual
 * mode needs a renderer. Preserve existing IDs because unlocks are saved by ID.
 */
export interface Awakening {
  /** Perk text displayed in the Armoury; the actual effect lives in `m`. */
  pk: string;
  /** Tradeoff text displayed beside the perk. */
  tr: string;
  /** Complete awakened equipment effect, not a delta from the base effect. */
  m: Partial<Modifiers>;
  /** [equipment challenge statistic, inclusive minimum, player-facing requirement].
   * Eligibility checks the item's independent challenge record >= minimum. Counters such as
   * kills accumulate; best-wave/score/combo metrics are maxima (see BladeStats).
   */
  need: [keyof BladeStats, number, string];
  /** Figure aura: `c` is comma-separated RGB, `mode` selects the renderer effect
   * (glow, dark, frost, after, bolt or petal); null disables the aura.
   */
  aura: { c: string; mode: string } | null;
  /** BladeStyle overrides (`c` RGB, `gold` finish), or outfit RGB fabric accent `c`. */
  st?: { c?: string; gold?: number };
}

export const SPECIAL: Record<string, Awakening> = {
  steel: {
    pk: 'Score ×1.15',
    tr: 'Enemies strike 5% faster',
    m: { score: 1.15, atk: 0.95 },
    need: ['k', 200, 'Cut down 200 foes'],
    aura: { c: '235,238,245', mode: 'glow' },
  },
  kuro: {
    pk: 'Parry window 30% longer',
    tr: 'Perfect arc 40% smaller',
    m: { parry: 1.3, pz: 0.08 },
    need: ['d', 5, 'Win 5 duels'],
    aura: { c: '20,18,16', mode: 'dark' },
  },
  beni: {
    pk: 'Perfect cut score ×2',
    tr: 'Normal cut score ×0.55',
    m: { perfect: 2, normal: 0.55 },
    need: ['p', 40, 'Land 40 perfect cuts'],
    aura: { c: '225,52,38', mode: 'glow' },
  },
  tsuki: {
    pk: 'Perfect arc 45% larger',
    tr: 'Enemies strike 12% faster',
    m: { pz: -0.09, atk: 0.88 },
    need: ['w', 15, 'Reach wave 15'],
    aura: { c: '200,215,255', mode: 'frost' },
  },
  oboro: {
    pk: 'Score ×1.45',
    tr: 'Feints 25 percentage points more likely',
    m: { score: 1.45, feint: 0.25 },
    need: ['rw', 9, 'Reach wave 9 in Ronin mode'],
    aura: { c: '230,228,220', mode: 'after' },
  },
  mura: {
    pk: 'Score ×1.9',
    tr: 'Enemies strike 22% faster',
    m: { score: 1.9, atk: 0.78 },
    need: ['sc', 30000, 'Score 30,000 in one run'],
    aura: { c: '150,14,12', mode: 'dark' },
  },
  raijin: {
    pk: 'Duel openings 45% longer',
    tr: 'Parry window 22% shorter',
    m: { stag: 1.45, parry: 0.78 },
    need: ['d', 8, 'Win 8 duels'],
    aura: { c: '205,220,255', mode: 'bolt' },
  },
  sakura: {
    pk: 'Combo multiplier climbs every 3 cuts',
    tr: 'Duel score ×0.2',
    m: { comboStep: 3, bossScore: 0.2 },
    need: ['c', 50, 'Reach a 50 combo'],
    aura: { c: '240,190,200', mode: 'petal' },
  },
  kage: {
    pk: 'First two wrong swipes per duel opening are forgiven',
    tr: 'No perfect arc, and duel arrows are hidden',
    m: { kage: 2, noArc: 1, duelBlind: 1 },
    need: ['p', 25, 'Land 25 perfect cuts'],
    aura: { c: '20,20,22', mode: 'after' },
  },
  bokken: {
    pk: 'Enemies strike 30% slower',
    tr: 'Score ×0.25',
    m: { atk: 1.3, score: 0.25 },
    need: ['w', 12, 'Reach wave 12'],
    aura: { c: '255,215,140', mode: 'glow' },
  },
  kodachi: {
    pk: 'Swipes register at 33% distance',
    tr: 'Parry window 30% shorter',
    m: { swipe: 0.33, parry: 0.7 },
    need: ['k', 300, 'Cut down 300 foes'],
    aura: { c: '235,238,245', mode: 'after' },
  },
  doji: {
    pk: 'Every boss hit counts triple',
    tr: 'No shrine blessings, and one fewer life',
    m: { bossDmg: 3, noShrine: 1, lives: -1 },
    need: ['d', 10, 'Win 10 duels'],
    aura: { c: '255,160,80', mode: 'glow' },
  },
  kiku: {
    pk: 'First two mistakes each wave keep your combo',
    tr: 'Score ×0.7',
    m: { kiku: 2, score: 0.7 },
    need: ['c', 80, 'Reach an 80 combo'],
    aura: { c: '255,225,130', mode: 'petal' },
  },
  masamune: {
    pk: 'Restore 1 life every 10 clean cuts',
    tr: 'Score ×0.7',
    m: { restore: 10, score: 0.7 },
    need: ['w', 18, 'Reach wave 18'],
    aura: { c: '220,235,255', mode: 'glow' },
  },
  orochi: {
    pk: '45% chance to also cut the next matching enemy',
    tr: 'Enemies strike 16% faster',
    m: { serpent: 0.45, atk: 0.84 },
    need: ['k', 400, 'Cut down 400 foes'],
    aura: { c: '110,170,125', mode: 'after' },
  },
  onikiri: {
    pk: 'Duel openings need two fewer swipes',
    tr: 'Parry window 30% shorter',
    m: { chain: -2, parry: 0.7 },
    need: ['d', 12, 'Win 12 duels'],
    aura: { c: '120,18,16', mode: 'dark' },
  },
  tsubame: {
    pk: 'Perfect arc 35% larger; perfect cut score ×1.6',
    tr: 'Enemies strike 18% faster',
    m: { pz: -0.07, perfect: 1.6, atk: 0.82 },
    need: ['p', 80, 'Land 80 perfect cuts'],
    aura: { c: '225,235,245', mode: 'after' },
  },
  koken: {
    pk: 'Perfect arc 40% larger',
    tr: 'Enemies strike 15% faster',
    m: { pz: -0.08, atk: 0.85 },
    need: ['k', 150, 'Cut down 150 foes'],
    aura: null,
    st: { c: '255,70,60' },
  },
  pan: {
    pk: 'Parry window 70% longer; boss hits count double',
    tr: 'Score ×0.3; no perfect cuts',
    m: { parry: 1.7, bossDmg: 2, score: 0.3, noPerfect: 1, noArc: 1, bonk: 1 },
    need: ['d', 5, 'Win 5 duels'],
    aura: { c: '255,215,120', mode: 'glow' },
    st: { gold: 1 },
  },
  yuki: {
    pk: 'Perfect cuts freeze the next attacker twice as long',
    tr: 'Normal cut score ×0.5',
    m: { freeze: 2, normal: 0.5 },
    need: ['p', 50, 'Land 50 perfect cuts'],
    aura: { c: '200,230,255', mode: 'frost' },
  },
};
