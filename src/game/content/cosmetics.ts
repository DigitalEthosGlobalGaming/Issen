import type { BladeStyle } from '../../rendering/figures/types.ts';
export interface RobeStyle {
  robeD?: number[];
  robe?: number[];
  robeL?: number[];
  obi?: number[];
  inner?: number[];
  variant?: string;
  cape?: number;
  coat?: number;
  armor?: number;
  patches?: number;
  strawy?: number;
  tail?: number;
}
export const BLADES: Record<string, BladeStyle | null> = {
  steel: null,
  kuro: {
    len: 0.52,
    d: '#0b0b0a',
    m: '#262422',
    l: '#4d4a46',
    edge: 'rgba(255,253,246,.95)',
    edgeW: 0.005,
  },
  beni: {
    len: 0.52,
    d: '#5c5a56',
    m: '#a7a49e',
    l: '#f2eee6',
    edge: 'rgba(200,38,26,.95)',
    edgeW: 0.008,
  },
  tsuki: {
    len: 0.68,
    d: '#8f8d88',
    m: '#d8d5ce',
    l: '#ffffff',
    edge: 'rgba(255,255,255,.95)',
    glow: 'rgba(235,240,255,.22)',
  },
  masamune: { len: 0.54, d: '#6b6a66', m: '#c4c2bb', l: '#ffffff', edge: 'rgba(255,255,255,.95)' },
  orochi: { len: 0.56, d: '#2f3a33', m: '#7d8a80', l: '#dfe8e0', edge: 'rgba(200,235,210,.9)' },
  onikiri: { len: 0.55, d: '#3a2622', m: '#8d7470', l: '#efe2de', edge: 'rgba(255,230,220,.9)' },
  tsubame: { len: 0.5, d: '#5f646b', m: '#b5bcc4', l: '#fbfdff', edge: 'rgba(240,248,255,.95)' },
  koken: { kind: 'beam', len: 0.62, c: '120,190,255' },
  pan: { kind: 'pan', len: 0.46 },
  kodachi: { len: 0.38, d: '#5c5a56', m: '#aaa7a0', l: '#f6f3ec', edge: 'rgba(255,253,246,.9)' },
  doji: {
    len: 0.56,
    d: '#3d3b38',
    m: '#8f8c86',
    l: '#e6e2d8',
    edge: 'rgba(255,245,230,.95)',
    glow: 'rgba(255,230,200,.18)',
  },
  kiku: {
    len: 0.52,
    d: '#6a6660',
    m: '#b9b5ad',
    l: '#fffdf6',
    edge: 'rgba(255,253,246,.95)',
    edgeW: 0.006,
  },
  yuki: {
    len: 0.52,
    d: '#7c8a94',
    m: '#c6d2d8',
    l: '#ffffff',
    edge: 'rgba(225,240,255,.95)',
    glow: 'rgba(210,230,255,.25)',
  },
  oboro: {
    len: 0.56,
    d: '#6e6c68',
    m: '#bdbab3',
    l: '#ffffff',
    edge: 'rgba(255,255,255,.9)',
    glow: 'rgba(240,238,230,.32)',
    alpha: 0.6,
  },
};
export const ROBES: Record<string, RobeStyle> = {
  sumi: {},
  hai: { robeD: [48, 46, 43], robe: [84, 81, 76], robeL: [136, 131, 123], obi: [28, 27, 25] },
  aka: { obi: [146, 34, 25], robeL: [96, 54, 47], inner: [150, 48, 38] },
  shiro: {
    robeD: [128, 124, 117],
    robe: [184, 180, 172],
    robeL: [228, 224, 215],
    obi: [36, 34, 32],
    inner: [90, 86, 80],
  },
  kasa: { robe: [40, 38, 35], robeL: [90, 85, 78], variant: 'kasa' },
  oni: { variant: 'oni' },
  tengu: { robe: [40, 36, 34], variant: 'tengu' },
  monk: { robeD: [20, 19, 18], robe: [42, 40, 37], inner: [196, 192, 184], variant: 'monk' },
  mino: { variant: 'kasa', cape: 1 },
  yoroi: {
    robeD: [26, 14, 12],
    robe: [58, 24, 20],
    robeL: [110, 52, 42],
    variant: 'kabuto',
    armor: 1,
  },
  komuso: { robe: [30, 29, 27], variant: 'komuso' },
  rags: {
    robeD: [62, 58, 53],
    robe: [98, 93, 86],
    robeL: [142, 136, 126],
    obi: [80, 70, 60],
    patches: 1,
  },
  kabuki: { variant: 'mane' },
  scarecrow: {
    robeD: [90, 76, 48],
    robe: [140, 120, 80],
    robeL: [190, 170, 120],
    obi: [70, 50, 30],
    variant: 'kasa',
    strawy: 1,
  },
  tanuki: {
    robeD: [48, 34, 22],
    robe: [92, 68, 44],
    robeL: [140, 110, 78],
    obi: [40, 30, 22],
    inner: [200, 180, 150],
    variant: 'tanuki',
    tail: 1,
  },
  jinbaori: { robe: [26, 25, 23], coat: 1 },
  shinobi: {
    robeD: [8, 8, 8],
    robe: [18, 18, 19],
    robeL: [40, 40, 42],
    obi: [20, 20, 20],
    inner: [30, 30, 32],
    variant: 'shinobi',
  },
  kitsune: { variant: 'kitsune' },
  noh: { variant: 'noh' },
  helm: { variant: 'kabuto', obi: [70, 30, 24] },
};
