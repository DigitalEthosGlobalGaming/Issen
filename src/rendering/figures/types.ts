import type { Palette } from '../palette.ts';
import type { Random } from '../../shared/random.ts';

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
export interface Figure {
  x: number;
  y: number;
  h: number;
  fog: number;
  d: FigureSeed;
  pose: Pose;
  lean?: number;
  rot?: number;
  sy?: number;
  alpha?: number;
  pal?: Palette | null;
  variant?: string | null;
  back?: boolean;
  noShadow?: boolean;
  noSword?: boolean;
  spear?: number | boolean;
  twin?: number | boolean;
  coat?: number | boolean;
  cape?: number | boolean;
  crest?: string | null;
  charm?: string;
  pet?: string;
  blade?: BladeStyle | null;
  /** Outfit aura, independent of the blade; callers omit it for suppressed powers. */
  robeAura?: Aura | null;
  glint?: number;
  rf?: { tail?: number; armor?: number; patches?: number; strawy?: number };
}
export interface FigureEnvironment {
  reducedMotion?: boolean;
  reducedFlashes?: boolean;
  time: number;
  effectDensity?: number;
  wind: number;
  petActive: boolean;
  width: number;
  height: number;
  palette(fog: number): Palette;
  random: Random;
}
