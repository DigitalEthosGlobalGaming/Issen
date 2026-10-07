import { createEffectSpawner, type EffectSpawning } from '../rendering/effects/spawn.ts';
import { createEffectRenderer } from '../rendering/effects/draw.ts';
import type { Effects } from '../rendering/effects/state.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { Random } from '../shared/random.ts';

export interface FeedbackViews {
  readonly g: SceneDrawing;
  readonly fx: Effects;
  readonly S: number;
  readonly time: number;
  readonly FONT: string;
  readonly SEAL: string;
  readonly mistSprite: HTMLCanvasElement | null;
  readonly R: Random;
  readonly density: () => number;
  readonly flash: (amount: number, colour?: string) => void;
  readonly sfx: EffectSpawning['sounds'];
  readonly W: number;
  readonly H: number;
  readonly portrait: boolean;
}

/** Cosmetic effect spawning and drawing; this owner has no run record or combat RNG. */
export function createFeedbackPresentation(readViews: () => FeedbackViews) {
  function pop(x: number, y: number, text: string, size?: number) {
    const { portrait, W, H, S, fx } = readViews();
    const ax = portrait ? W * 0.25 : W * 0.18,
      ay = portrait ? H * 0.8 : H * 0.7,
      lh = Math.max(22, 26 * S);
    while (fx.pops.length >= 4) fx.pops.shift();
    const n = fx.pops.filter((q) => q.t < q.life * 0.7).length;
    fx.pops.push({
      x: ax,
      y: ay - n * lh,
      text,
      t: 0,
      life: 0.8,
      size: Math.min(size || Math.max(16, 19 * S), Math.max(18, 23 * S)),
    });
  }
  function stamp(text: string, x: number, y: number, size: number, seal: boolean, life?: number) {
    const { portrait, W, H, fx } = readViews();
    fx.stamps.push({
      text,
      x: portrait ? W * 0.27 : W * 0.18,
      y: portrait ? H * 0.62 : H * 0.36,
      size: size * 0.8,
      seal: !!seal,
      t: 0,
      life: (life || 1.1) * 0.75,
    });
  }
  function effectSpawner(state?: Effects, scale?: number, preview = false) {
    const { fx, S, R, density, flash, sfx } = readViews();
    state ??= fx;
    scale ??= S;
    return createEffectSpawner(state, {
      scale,
      random: R,
      density: density(),
      flash: preview ? () => {} : flash,
      sounds: sfx,
    });
  }
  function addSlash(...args: Parameters<ReturnType<typeof createEffectSpawner>['addSlash']>) {
    effectSpawner().addSlash(...args);
  }
  function inkBurst(...args: Parameters<ReturnType<typeof createEffectSpawner>['inkBurst']>) {
    effectSpawner().inkBurst(...args);
  }
  function scraps(...args: Parameters<ReturnType<typeof createEffectSpawner>['scraps']>) {
    effectSpawner().scraps(...args);
  }
  function ring(...args: Parameters<ReturnType<typeof createEffectSpawner>['ring']>) {
    effectSpawner().ring(...args);
  }
  function sparks(...args: Parameters<ReturnType<typeof createEffectSpawner>['sparks']>) {
    effectSpawner().sparks(...args);
  }
  function dust(...args: Parameters<ReturnType<typeof createEffectSpawner>['dust']>) {
    effectSpawner().dust(...args);
  }
  function effectRenderer(context?: SceneDrawing, state?: Effects, scale?: number) {
    const { g, fx, S, time, FONT, SEAL, mistSprite } = readViews();
    context ??= g;
    state ??= fx;
    scale ??= S;
    return createEffectRenderer(context, state, {
      scale,
      time,
      font: FONT,
      seal: SEAL,
      mistSprite,
    });
  }
  function drawFx() {
    effectRenderer().drawFx();
  }
  function drawFx2() {
    effectRenderer().drawFx2();
  }
  function drawStains() {
    effectRenderer().drawStains();
  }
  function drawPops() {
    effectRenderer().drawPops();
  }
  function drawStamps() {
    effectRenderer().drawStamps();
  }

  return {
    pop,
    stamp,
    effectSpawner,
    addSlash,
    inkBurst,
    scraps,
    ring,
    sparks,
    dust,
    effectRenderer,
    drawFx,
    drawFx2,
    drawStains,
    drawPops,
    drawStamps,
  };
}
