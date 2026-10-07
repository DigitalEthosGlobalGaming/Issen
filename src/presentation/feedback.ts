import { TAU } from '../shared/math.ts';
import { updateEffects } from '../rendering/effects/update.ts';
import { scaledCount } from '../rendering/effects/quality.ts';
import type { Weather } from '../game/content/stages.ts';
import type { Leaf } from '../rendering/scene/ambient.ts';
import type { PresentationState } from './state.ts';
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
  readonly state: PresentationState;
  readonly reducedFlashes: () => boolean;
  readonly reducedMotion: () => boolean;
  readonly weather: Weather;
  readonly newLeaf: (anywhere: boolean) => Leaf;
  readonly leaves: Leaf[];
  readonly killEffect: () => string;
  readonly clink: () => void;
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
    const { fx, S, R, density, sfx } = readViews();
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

  function flash(a: number, col?: string) {
    const { state: presentationState, reducedFlashes } = readViews();
    presentationState.flashA = Math.max(
      presentationState.flashA,
      reducedFlashes() ? Math.min(a, 0.035) : a,
    );
    presentationState.flashCol = col || '255,255,255';
  }
  function letterbox(d: number) {
    const { state: presentationState } = readViews();
    presentationState.lbT = Math.max(presentationState.lbT, d);
  }
  function punch(z: number, x: number, y: number) {
    const { state: presentationState, reducedMotion } = readViews();
    if (reducedMotion()) return;
    presentationState.zoom = Math.max(presentationState.zoom, z);
    presentationState.zoomX = x;
    presentationState.zoomY = y;
  }

  function weatherBurst(cx: number, cy: number, sc: number) {
    const { weather: w, state: presentationState, R, S, density, newLeaf, leaves } = readViews();
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < scaledCount(16, density()); i++) {
        const a = R() * TAU,
          sp = (120 + R() * 260) * sc;
        presentationState.fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 80 * sc,
          t: 0,
          life: 0.4 + R() * 0.3,
          c: '215,220,225',
        });
      }
    } else if (w === 'snow') {
      for (let i = 0; i < scaledCount(22, density()); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 200) * sc;
        presentationState.fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60 * sc,
          t: 0,
          life: 0.8 + R() * 0.6,
          c: '246,244,238',
          drift: 1,
        });
      }
      dust(cx, cy + 30 * sc, 60 * sc);
    } else if (w === 'sakura') {
      for (let i = 0; i < scaledCount(14, density()); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 240) * sc;
        presentationState.fx.petals.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 100 * sc,
          rot: R() * TAU,
          vr: (R() - 0.5) * 10,
          s: (2 + R() * 2.5) * sc,
          t: 0,
          life: 1.4 + R() * 0.8,
        });
      }
    } else if (w === 'smoke') {
      for (let i = 0; i < scaledCount(14, density()); i++)
        presentationState.fx.embers.push({
          x: cx + (R() - 0.5) * 30 * sc,
          y: cy,
          vx: (R() - 0.5) * 140 * sc,
          vy: -(80 + R() * 200) * sc,
          t: 0,
          life: 0.7 + R() * 0.8,
          ph: R() * TAU,
        });
    } else if (w !== 'night') {
      for (let i = 0; i < scaledCount(8, density()); i++) {
        const l = newLeaf(false);
        l.x = cx + (R() - 0.5) * 40 * sc;
        l.y = cy + (R() - 0.5) * 40 * sc;
        l.z = 1.3 + R() * 0.6;
        l.s = (3 + R() * 4) * l.z * S;
        l.gust = 1;
        l.col = 'rgba(24,23,21,.85)';
        leaves.push(l);
      }
    }
  }
  function killFx(cx: number, cy: number, ang: number, sc: number) {
    const { killEffect } = readViews();
    weatherBurst(cx, cy, sc);
    effectSpawner().killFx(killEffect(), cx, cy, ang, sc);
  }
  function updateFx(dt: number, raw: number) {
    const { state: presentationState, S, R, clink } = readViews();
    updateEffects(presentationState.fx, dt, raw, {
      scale: S,
      wind: presentationState.wind,
      time: presentationState.time,
      random: R,
      onSwordStuck: clink,
    });
  }
  return {
    flash,
    letterbox,
    punch,
    weatherBurst,
    killFx,
    updateFx,
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
