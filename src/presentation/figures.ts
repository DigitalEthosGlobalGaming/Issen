import { createFigureRenderer } from '../rendering/figures/figure.ts';
import {
  applyDeathPose,
  deathDuration,
  deathShadowOpacity,
  BOSS_SHADOW_DURATION,
} from '../rendering/figures/death.ts';
import { clamp, lerp, TAU } from '../shared/math.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { Figure, FigureEnvironment } from '../rendering/figures/types.ts';
import type { Enemy } from '../game/combat/enemy.ts';
import type { RunState } from '../game/run-state.ts';
import type { createInkCharmRenderer } from '../rendering/figures/ink-charms.ts';
import type { createInkCompanionRenderer } from '../rendering/figures/ink-companions.ts';
import type { createInkEnemyRenderer } from '../rendering/figures/ink-enemy.ts';
import type { createInkPlayerRenderer } from '../rendering/figures/ink-player.ts';
import type { createInkSwordRenderer } from '../rendering/figures/ink-sword.ts';
import type { createPalette } from '../rendering/palette.ts';

export interface FigureViews {
  readonly g: SceneDrawing;
  readonly inkCharm: ReturnType<typeof createInkCharmRenderer>;
  readonly inkCompanion: ReturnType<typeof createInkCompanionRenderer>;
  readonly inkEnemy: ReturnType<typeof createInkEnemyRenderer>;
  readonly inkPlayer: ReturnType<typeof createInkPlayerRenderer>;
  readonly inkSword: ReturnType<typeof createInkSwordRenderer>;
  readonly time: number;
  readonly wind: number;
  readonly G: Readonly<Pick<RunState, 'boss' | 'm' | 'petT'>>;
  readonly W: number;
  readonly H: number;
  readonly cols: FigureEnvironment['palette'];
  readonly R: FigureEnvironment['random'];
  readonly density: () => number;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly robePal: ReturnType<typeof createPalette>['robe'];
  readonly accessible: (id: string) => boolean;
  readonly EQ: Readonly<{ fx: string }>;
  readonly SEAL: string;
  readonly FONT: string;
}

/** Figure projection/drawing only; character updates remain gameplay-owned. */
export function createFiguresPresentation(readViews: () => FigureViews) {
  function figureRenderer() {
    const {
      g,
      inkCharm,
      inkCompanion,
      inkEnemy,
      inkPlayer,
      inkSword,
      time,
      wind,
      G,
      W,
      H,
      cols,
      R,
      density,
      reducedMotion,
      reducedFlashes,
      robePal,
      accessible,
      EQ,
      SEAL,
      FONT,
    } = readViews();
    {
      void inkCharm.prepare();
      void inkCompanion.prepare();
      void inkEnemy.prepare();
      void inkPlayer.prepare();
      void inkSword.prepare();
    }
    return createFigureRenderer(g, {
      inkCharm,
      inkCompanion,
      inkEnemy,
      inkPlayer,
      inkSword,
      time,
      wind,
      petActive: G.petT > 0,
      width: W,
      height: H,
      palette: cols,
      random: R,
      effectDensity: density(),
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
    });
  }
  function drawFigure(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawFigure']>) {
    return figureRenderer().drawFigure(...args);
  }
  function drawSplit(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawSplit']>) {
    return figureRenderer().drawSplit(...args);
  }
  function drawPetAt(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawPetAt']>) {
    return figureRenderer().drawPetAt(...args);
  }
  function drawSword(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawSword']>) {
    return figureRenderer().drawSword(...args);
  }
  function drawGlint(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawGlint']>) {
    return figureRenderer().drawGlint(...args);
  }
  function tipOf(...args: Parameters<ReturnType<typeof createFigureRenderer>['tipOf']>) {
    return figureRenderer().tipOf(...args);
  }
  function drawEnemy(e: Enemy) {
    const { reducedMotion } = readViews();
    const p = e.pos;
    const f: Figure = {
      x: p.x,
      y: p.y,
      h: p.h,
      fog: p.fog,
      alpha: p.alpha,
      d: e.d,
      pose: e.pose,
      lean: e.lean,
      variant: e.look,
      varied: true,
      waiting: e.state === 'idle',
      glint: e.glint,
    };
    if (e.state !== 'dying') {
      drawFigure(f);
      return;
    }
    const t = e.t,
      dtp = e.deathType ?? 'split';
    figureRenderer().drawGroundShadow(e.deathGround ?? p, deathShadowOpacity(e.shadowTime ?? t));
    f.noShadow = true;
    f.glint = 0;
    if (dtp === 'scatter' && !reducedMotion()) {
      figureRenderer().drawScattered(f, e.cutAng ?? 0, t);
      return;
    }
    if (dtp === 'split' && !reducedMotion()) {
      drawSplit(f, p, e.cutAng ?? 0, t, deathDuration(dtp));
      return;
    }
    applyDeathPose(f, dtp, t, e.fallDir ?? 1, reducedMotion());
    drawFigure(f);
  }
  function drawBoss() {
    const { G, robePal, accessible, EQ, reducedMotion, g, time, SEAL, FONT } = readViews();
    const b = G.boss;
    if (!b) return;
    const p = b.pos;
    const f = {
      x: p.x,
      y: p.y,
      h: p.h,
      fog: p.fog,
      alpha: p.alpha,
      d: b.d,
      pose: b.pose,
      lean: b.lean,
      variant: b.def.v,
      varied: b.varied,
      glint: b.glint,
      pal: b.def.pal ? robePal(b.def.pal) : null,
      twin: b.def.twin,
      spear: b.def.spear,
    };
    if (b.state === 'dying') {
      figureRenderer().drawGroundShadow(
        b.deathGround ?? p,
        deathShadowOpacity(b.shadowTime ?? b.t, BOSS_SHADOW_DURATION),
      );
      if (!G.m.bonk && accessible(EQ.fx) && EQ.fx === 'scattered-armour' && !reducedMotion())
        figureRenderer().drawScattered({ ...f, noShadow: true }, b.cutAng, b.t * (1.1 / 1.6));
      else drawSplit({ ...f, noShadow: true }, p, b.cutAng, b.t, 1.6);
    } else drawFigure(f);
    if (G.m.ofuda && b.state === 'feint') {
      const w = Math.max(26, p.h * 0.12),
        hh = w * 2.2,
        tx = p.x + p.h * 0.42,
        ty = Math.max(hh / 2 + 64, p.y - p.h * 0.75);
      g.save();
      g.translate(tx, ty);
      g.rotate(Math.sin(time * 6) * 0.08);
      g.fillStyle = '#ece3cf';
      g.fillRect(-w / 2, -hh / 2, w, hh);
      g.strokeStyle = SEAL;
      g.lineWidth = 2;
      g.strokeRect(-w / 2 + 3, -hh / 2 + 3, w - 6, hh - 6);
      g.fillStyle = SEAL;
      g.font = `800 ${w * 0.75}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('偽', 0, 0);
      g.restore();
    }
    if (b.state === 'flash') {
      const k = clamp(b.t / b.bp.flash);
      g.save();
      g.strokeStyle = `rgba(255,252,244,${0.9 * (1 - k * 0.4)})`;
      g.lineWidth = Math.max(2, p.h * 0.012);
      g.beginPath();
      g.arc(p.x, p.y - p.h * 0.62, lerp(p.h * 0.75, p.h * 0.2, k), 0, TAU);
      g.stroke();
      g.restore();
    }
  }

  return {
    figureRenderer,
    drawFigure,
    drawSplit,
    drawPetAt,
    drawSword,
    drawGlint,
    tipOf,
    drawEnemy,
    drawBoss,
  };
}
