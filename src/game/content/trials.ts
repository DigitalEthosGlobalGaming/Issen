import type { Item } from './items.ts';

export interface TrialDefinition {
  id: string;
  name: string;
  description: string;
  objective: string;
  seed: number;
  arrows: boolean;
  wave?: { total: number; attack: number; feint: number; perfects: number };
  bosses?: readonly number[];
  cleanOpenings?: boolean;
  duelMaster?: boolean;
  reward: Pick<Item, 'id' | 'type' | 'k' | 'n' | 'f'> & Partial<Pick<Item, 'm' | 'pk' | 'tr'>>;
}

/** Fixed encounters, independent of the player's purchases and ordinary setup. */
export const TRIALS: readonly TrialDefinition[] = [
  {
    id: 'quiet-blade',
    name: 'Quiet Blade',
    seed: 9909,
    arrows: false,
    objective: '24 arrowless cuts, 18 perfect. No mistakes.',
    description: 'Read the real blade through feints and land 18 perfect cuts in 24 opponents.',
    wave: { total: 24, attack: 1.35, feint: 0.65, perfects: 18 },
    reward: {
      id: 'quiet-seal',
      type: 'seal',
      k: '静',
      n: 'Quiet jade',
      f: 'A muted jade seal for a steady eye.',
    },
  },
  {
    id: 'duel-master',
    name: 'Duel Master',
    seed: 10110,
    arrows: true,
    bosses: [1],
    cleanOpenings: true,
    duelMaster: true,
    objective: '20 counter-and-cut exchanges in a row. Each becomes faster. No mistakes.',
    description:
      'Counter each glint, then slash in the opening direction. One mistake ends the attempt.',
    reward: {
      id: 'first-strike',
      type: 'charm',
      k: '先',
      n: 'First Strike',
      f: 'Seize the opening before it closes.',
      pk: 'Earlier valid slashes earn up to 900 base points',
      tr: 'Replaces normal and perfect slash timing points; automatic kills receive no speed bonus',
      m: { swift: 1 },
    },
  },
  {
    id: 'unbroken',
    name: 'Unbroken',
    seed: 1101,
    arrows: true,
    objective: '20 cuts. No mistakes.',
    description:
      'Cut 20 ordered opponents without a mistake. Their attacks take around 1.2 seconds.',
    wave: { total: 20, attack: 1.2, feint: 0, perfects: 0 },
    reward: {
      id: 'trial-ripple',
      type: 'fx',
      k: '波',
      n: 'Still ripples',
      f: 'Three pale ripples spread from each cut.',
    },
  },
  {
    id: 'true-edge',
    name: 'True Edge',
    seed: 2202,
    arrows: true,
    objective: '10 perfect cuts in 12. No hits.',
    description: 'Cut 12 opponents without a mistake. Land at least 10 perfect cuts.',
    wave: { total: 12, attack: 1.5, feint: 0, perfects: 10 },
    reward: {
      id: 'trial-platinum',
      type: 'seal',
      k: '白',
      n: 'Platinum',
      f: 'A cool silver seal for a precise hand.',
    },
  },
  {
    id: 'still-water',
    name: 'Still Water',
    seed: 3303,
    arrows: true,
    objective: '16 feinting foes. No hits.',
    description: 'Cut 16 opponents without a mistake. Every blade feints; wait for it to turn.',
    wave: { total: 16, attack: 1.35, feint: 1, perfects: 0 },
    reward: {
      id: 'trial-dusk',
      type: 'film',
      k: '暮',
      n: 'Violet dusk',
      f: 'Violet shadows fading into muted amber.',
    },
  },
  {
    id: 'sightless',
    name: 'Read the Blade',
    seed: 4404,
    arrows: false,
    objective: '16 foes. No arrows or hits.',
    description:
      'Cut 16 opponents without arrows or mistakes. Read the blade; some opponents feint.',
    wave: { total: 16, attack: 1.3, feint: 0.35, perfects: 0 },
    reward: {
      id: 'trial-comet',
      type: 'fx',
      k: '星',
      n: 'Comet trail',
      f: 'A fan of bright stars follows the stroke.',
    },
  },
  {
    id: 'twin-fang',
    name: 'Two Glints',
    seed: 5505,
    arrows: true,
    objective: 'Defeat Twin Fang. No hits.',
    description: 'Defeat the Twin Fang in a Ronin duel without taking a hit. Parry both glints.',
    bosses: [4],
    reward: {
      id: 'trial-copper',
      type: 'seal',
      k: '銅',
      n: 'Burnished copper',
      f: 'A warm copper seal earned through the twin blades.',
    },
  },
  {
    id: 'three-masters',
    name: 'Three Masters',
    seed: 6606,
    arrows: true,
    objective: 'Defeat three masters. No mistakes.',
    description:
      'Defeat Kagemaru, Twin Fang and the Mirror in Ronin duels. No hits, wrong counters or missed openings.',
    bosses: [1, 4, 6],
    cleanOpenings: true,
    reward: {
      id: 'trial-dawn',
      type: 'film',
      k: '暁',
      n: 'Pale dawn',
      f: 'Soft jade highlights over rose-grey shadows.',
    },
  },
  {
    id: 'golden-sovereign',
    name: 'Golden Sovereign',
    seed: 7707,
    arrows: true,
    objective: '1,000 cuts. No hits.',
    description: 'Defeat 1,000 enemies in one unbroken wave.',
    wave: { total: 1000, attack: 1.2, feint: 0, perfects: 0 },
    reward: {
      id: 'trial-gold',
      type: 'film',
      k: '帝',
      n: 'Imperial gold',
      f: 'Pure gold light, gilded highlights and deep bronze shadows.',
    },
  },
  {
    id: 'broken-reality',
    name: 'Broken Reality',
    seed: 8808,
    arrows: true,
    objective: '1,000 perfect cuts. No mistakes.',
    description: 'Every cut must be perfect. One ordinary cut ends the trial.',
    wave: { total: 1000, attack: 1.5, feint: 0, perfects: 1000 },
    reward: {
      id: 'trial-glitch',
      type: 'film',
      k: '裂',
      n: 'Broken signal',
      f: 'Fractured colours, displaced scanlines and electric screen noise.',
    },
  },
];

export function trialRewardItems(): Item[] {
  return TRIALS.map((trial) => ({
    ...trial.reward,
    d: `Complete the ${trial.name} trial.`,
    ok: () => false,
  }));
}
