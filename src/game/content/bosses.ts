import type { BossDefinition } from '../encounters/boss.ts';
export const BOSSES: readonly BossDefinition[] = [
  { v: 'kasa', k: '影丸', n: 'Kagemaru the Unmoving' },
  { v: 'kabuto', k: '鉄斎', n: 'Tessai of the Iron Crest' },
  { v: 'hair', k: '風蓮', n: 'Fūren the Drifting Blade' },
  { v: 'mask', k: '双牙', n: 'Sōga the Twin Fang', twin: 1 },
  { v: 'jingasa', k: '槍兵衛', n: 'Yarihyōe the Long Reach', spear: 1 },
  { v: 'hair', k: '鏡月', n: 'Kyōgetsu the Mirror', mirror: 1, pal: 'shiro' },
];
