export const FORTUNES = [
  { k: '大吉', n: 'Great blessing', d: 'Score ×1.5', m: { score: 1.5 } },
  { k: '中吉', n: 'Middle blessing', d: 'One extra life', m: { lives: 1 } },
  { k: '小吉', n: 'Small blessing', d: 'Parry window 20% longer', m: { parry: 1.2 } },
  { k: '吉', n: 'Blessing', d: 'Perfect arc 15% larger', m: { pz: -0.03 } },
  { k: '末吉', n: 'Future blessing', d: 'Enemies strike 8% slower', m: { atk: 1.08 } },
  { k: '凶', n: 'Curse', d: 'Enemies strike 10% faster, but score ×2', m: { atk: 0.9, score: 2 } },
];
