import type { Item } from './items.ts';

export interface TrialDefinition {
  id: string;
  name: string;
  description: string;
  seed: number;
  arrows: boolean;
  wave?: { total: number; attack: number; feint: number; perfects: number };
  bosses?: readonly number[];
  cleanOpenings?: boolean;
  reward: Pick<Item, 'id' | 'type' | 'k' | 'n' | 'f'>;
}

/** Fixed encounters, independent of the player's purchases and ordinary setup. */
export const TRIALS: readonly TrialDefinition[] = [
  {
    id: 'unbroken',
    name: 'Unbroken',
    seed: 1101,
    arrows: true,
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
];

export function trialRewardItems(): Item[] {
  return TRIALS.map((trial) => ({
    ...trial.reward,
    d: `Complete the ${trial.name} trial. Trials unlock at Ronin wave 10.`,
    ok: () => false,
  }));
}
