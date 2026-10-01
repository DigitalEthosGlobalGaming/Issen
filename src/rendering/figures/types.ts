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
  /** Cosmetic regular-enemy variation; bosses retain their authored identity. */
  varied?: boolean;
  /** Saved equipment identities select only explicitly supported sprite replacements. */
  robeId?: string;
  bladeId?: string;
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
export interface PlayerArtwork {
  drawPart(
    g: CanvasRenderingContext2D,
    part: 'body' | 'head' | 'arms',
    f: Figure,
    env: FigureEnvironment,
  ): boolean;
}
export interface EnemyArtwork {
  drawPart(
    g: CanvasRenderingContext2D,
    part: 'body' | 'head' | 'arms' | 'hands',
    f: Figure,
    env: FigureEnvironment,
  ): boolean;
}
export interface CompanionArtwork {
  draw(
    type: string,
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    time?: number,
    active?: boolean,
    reducedMotion?: boolean,
  ): boolean;
}
export interface SwordArtwork {
  draw(
    g: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    ang: number,
    palette: Palette,
    style?: BladeStyle | null,
    id?: string,
  ): boolean;
}
export interface FigureEnvironment {
  artwork?: 'classic' | 'ink';
  inkPlayer?: PlayerArtwork;
  inkEnemy?: EnemyArtwork;
  inkCompanion?: CompanionArtwork;
  inkSword?: SwordArtwork;
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
