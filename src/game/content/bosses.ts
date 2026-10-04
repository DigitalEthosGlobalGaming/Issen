import type { BossDefinition } from '../encounters/boss.ts';
export const BOSSES: readonly BossDefinition[] = [
  { v: 'kasa', k: '影丸', n: 'Kagemaru the Unmoving' },
  { v: 'kabuto', k: '鉄斎', n: 'Tessai of the Iron Crest' },
  { v: 'hair', k: '風蓮', n: 'Fūren the Drifting Blade' },
  { v: 'mask', k: '双牙', n: 'Sōga the Twin Fang', twin: 1 },
  { v: 'jingasa', k: '槍兵衛', n: 'Yarihyōe the Long Reach', spear: 1 },
  { v: 'hair', k: '鏡月', n: 'Kyōgetsu the Mirror', mirror: 1, pal: 'shiro' },
];
/** Names and cloth tones stay within each recognizable boss archetype. */
export const BOSS_IDENTITIES = [
  {
    names: ['Kagemaru the Unmoving', 'Shizumaru the Unmoving', 'Kuroha the Unmoving'],
    tones: ['sumi', 'hai', 'rags'],
  },
  {
    names: ['Tessai of the Iron Crest', 'Genzō of the Iron Crest', 'Ishigane of the Iron Crest'],
    tones: ['helm', 'yoroi', 'hai'],
  },
  {
    names: ['Fūren the Drifting Blade', 'Kazehira the Drifting Blade', 'Hayate the Drifting Blade'],
    tones: ['sakura', 'mino', 'kasa'],
  },
  {
    names: ['Sōga the Twin Fang', 'Renga the Twin Fang', 'Akiba the Twin Fang'],
    tones: ['oni', 'aka', 'kabuki'],
  },
  {
    names: ['Yarihyōe the Long Reach', 'Nagatsugu the Long Reach', 'Takezō the Long Reach'],
    tones: ['kasa', 'monk', 'rags'],
  },
  {
    names: ['Kyōgetsu the Mirror', 'Shirotsuki the Mirror', 'Mizukage the Mirror'],
    tones: ['shiro', 'hai', 'noh'],
  },
] as const;
