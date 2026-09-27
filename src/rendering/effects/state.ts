interface Timed {
  t: number;
  life: number;
}
interface Positioned extends Timed {
  x: number;
  y: number;
}
interface Moving extends Positioned {
  vx: number;
  vy: number;
}
interface Rotating extends Moving {
  rot: number;
  vr: number;
  s: number;
}
interface Phased extends Moving {
  ph: number;
}
export interface Particle extends Positioned {
  k:
    | 'moon'
    | 'star'
    | 'lantern'
    | 'crane'
    | 'koi'
    | 'puff'
    | 'wave'
    | 'crack'
    | 'flake'
    | 'soul'
    | 'maple'
    | 'fw'
    | 'conf'
    | 'duck';
  s: number;
  vx?: number;
  vy?: number;
  rot?: number;
  vr?: number;
  g?: number;
  drag?: number;
  ph?: number;
  c?: string;
  pts?: [number, number][];
}
export interface Effects {
  knives: (Timed & { x0: number; y0: number; x1: number; y1: number })[];
  slashes: (Timed & { x1: number; y1: number; x2: number; y2: number; w: number; dark: boolean })[];
  drops: (Moving & { r: number })[];
  sparks: Moving[];
  pops: (Positioned & { text: string; size: number })[];
  dust: (Positioned & { vx: number; r: number })[];
  scratches: (Timed & { x: number; y0: number; y1: number; a: number })[];
  rings: (Positioned & { r0: number; r1: number; w: number })[];
  scraps: Rotating[];
  stains: (Positioned & { rx: number })[];
  stamps: (Positioned & { text: string; size: number; seal: boolean })[];
  petals: Rotating[];
  bolts: (Timed & { pts: [number, number][] })[];
  embers: Phased[];
  crows: (Phased & { s: number })[];
  swords: (Moving & { ang: number; vr: number; len: number; ground: number; stuck: boolean })[];
  splash: (Moving & { c: string; drift?: number })[];
  kanji: (Positioned & { rot: number; s: number; ch: string })[];
  flies: Phased[];
  shards: Rotating[];
  coins: (Timed & { x0: number; y0: number })[];
  px: Particle[];
}

export function createEffects(): Effects {
  return {
    knives: [],
    slashes: [],
    drops: [],
    sparks: [],
    pops: [],
    dust: [],
    scratches: [],
    rings: [],
    scraps: [],
    stains: [],
    stamps: [],
    petals: [],
    bolts: [],
    embers: [],
    crows: [],
    swords: [],
    splash: [],
    kanji: [],
    flies: [],
    shards: [],
    coins: [],
    px: [],
  };
}
