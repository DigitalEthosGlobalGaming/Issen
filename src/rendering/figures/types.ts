import type { SceneDrawing } from '../scene-drawing.ts';
import type { Palette } from '../palette.ts';
import type { Random } from '../../shared/random.ts';

import type { FigureSeed, Pose, BladeStyle, Aura } from '../../shared/character.ts';
export type { Pose, Point, FigureSeed, Aura, BladeStyle } from '../../shared/character.ts';
export interface Figure {
  /** Presentation-only spring angles in radians; no collision or pose changes. */
  secondary?: SecondaryMotion;
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
  /** Waiting enemies breathe cosmetically without modifying simulation poses. */
  waiting?: boolean;
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
  charmId?: string;
  pet?: string;
  blade?: BladeStyle | null;
  /** Outfit aura, independent of the blade; callers omit it for suppressed powers. */
  robeAura?: Aura | null;
  glint?: number;
  rf?: { tail?: number; armor?: number; patches?: number; strawy?: number };
}
export interface SecondaryMotion {
  cloth: number;
  charm: number;
}
export interface PlayerArtwork {
  drawPart(
    g: SceneDrawing,
    part: 'body' | 'head' | 'arms',
    f: Figure,
    env: FigureEnvironment,
  ): boolean;
}
export type EnemyPart =
  | 'body'
  | 'head'
  | 'arms'
  | 'hands'
  | 'torso'
  | 'skirt'
  | 'leftSleeve'
  | 'rightSleeve'
  | 'leftForearm'
  | 'rightForearm'
  | 'leftHand'
  | 'rightHand';
export interface EnemyArtwork {
  drawPart(g: SceneDrawing, part: EnemyPart, f: Figure, env: FigureEnvironment): boolean;
}
export interface CharmArtwork {
  draw(
    g: SceneDrawing,
    id: string | undefined,
    x: number,
    y: number,
    size: number,
    color?: string,
  ): boolean;
}
export interface CompanionArtwork {
  draw(
    type: string,
    g: SceneDrawing,
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
    g: SceneDrawing,
    gx: number,
    gy: number,
    ang: number,
    palette: Palette,
    style?: BladeStyle | null,
    id?: string,
  ): boolean;
}
export interface FigureEnvironment {
  inkPlayer?: PlayerArtwork;
  inkEnemy?: EnemyArtwork;
  inkCompanion?: CompanionArtwork;
  inkCharm?: CharmArtwork;
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
