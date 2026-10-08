export interface Pose {
  gx: number;
  gy: number;
  ang: number;
}
export type Point = [number, number];
export interface FigureSeed {
  hem: number[];
  sl: [number[], number[]];
  spots: [number, number, number, boolean][];
  grass: [number, number, number, number][];
  hair: Point[];
  seed: number;
}
export interface Aura {
  c: string;
  mode: string;
}
export interface BladeStyle {
  len: number;
  kind?: string;
  c?: string;
  gold?: number;
  aura?: Aura | null;
  glow?: string;
  alpha?: number;
  d?: string;
  l?: string;
  m?: string;
  edge?: string;
  edgeW?: number;
}
