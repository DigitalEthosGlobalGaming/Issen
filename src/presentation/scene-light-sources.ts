import type { RunState } from '../game/run-state.ts';
import type { Effects } from '../rendering/effects/state.ts';
import type { Figure } from '../rendering/figures/types.ts';
import type { SceneLight } from '../rendering/scene-frame.ts';
import { resolveFigurePose, figureBladeTip } from '../rendering/figures/figure-pose.ts';
import { foxfirePose } from './foxfire-pose.ts';
import { clamp } from '../shared/math.ts';
import {
  transformSceneLight,
  type createLightSources,
  type LightFrame,
  type FrameLight,
} from './light-sources.ts';

interface SceneLightViews {
  readonly G: Readonly<Pick<RunState, 'enemies' | 'boss' | 'm' | 'foxUsed' | 'state'>>;
  readonly fx: Readonly<Pick<Effects, 'px' | 'embers'>>;
  readonly player: Readonly<{ x: number; y: number; h: number }>;
  readonly scale: number;
  readonly sceneLoading: boolean;
  readonly cinematic: boolean;
  readonly reducedMotion: boolean;
  readonly reducedFlashes: boolean;
}

/** Samples existing visual poses and particles; never advances their simulation or RNG. */
export function bindSceneLightSources(
  sources: ReturnType<typeof createLightSources>,
  read: () => SceneLightViews,
) {
  const identities = new WeakMap<object, string>();
  let sequence = 0;
  function id(owner: object): string {
    let value = identities.get(owner);
    if (!value) {
      value = String(++sequence);
      identities.set(owner, value);
    }
    return value;
  }
  function entry(owner: object, light: SceneLight, frame: Readonly<LightFrame>): FrameLight {
    return { id: id(owner), light: transformSceneLight(light, frame) };
  }
  const remove = [
    sources.register('sword-glints', (frame) => {
      const v = read();
      if (v.sceneLoading || v.reducedFlashes) return [];
      const glints: FrameLight[] = [];
      const glint = (owner: object, input: Figure) => {
        if (!(input.glint! > 0)) return;
        const figure = resolveFigurePose(input, frame.time, v.reducedMotion);
        const [x, y] = figureBladeTip(figure);
        glints.push(
          entry(
            owner,
            {
              x,
              y,
              z: figure.h * 0.12,
              radius: figure.h * figure.glint! * 0.3,
              intensity: Math.min(1, figure.glint!) * (figure.alpha ?? 1) * 0.7,
              color: [1, 0.95, 0.8],
            },
            frame,
          ),
        );
      };
      for (const enemy of v.G.enemies) {
        if (enemy.state === 'dying') continue;
        const p = enemy.pos;
        glint(enemy, {
          x: p.x,
          y: p.y,
          h: p.h,
          fog: p.fog,
          alpha: p.alpha,
          d: enemy.d,
          pose: enemy.pose,
          lean: enemy.lean,
          varied: true,
          waiting: enemy.state === 'idle',
          glint: enemy.glint,
        });
      }
      const boss = v.G.boss;
      if (boss && boss.state !== 'dying') {
        const p = boss.pos;
        glint(boss, {
          x: p.x,
          y: p.y,
          h: p.h,
          fog: p.fog,
          alpha: p.alpha,
          d: boss.d,
          pose: boss.pose,
          lean: boss.lean,
          varied: boss.varied,
          spear: boss.def.spear,
          twin: boss.def.twin,
          glint: boss.glint,
        });
      }
      return glints;
    }),
    sources.register('lanterns', (frame) => {
      const v = read();
      if (v.cinematic || v.sceneLoading) return [];
      return v.fx.px
        .filter((q) => q.k === 'lantern' && q.t >= 0 && q.t < q.life)
        .map((q) =>
          entry(
            q,
            {
              x: q.x + Math.sin(frame.time * 2 + (q.ph ?? 0)) * 4 * v.scale,
              y: q.y,
              z: Math.max(1, q.s),
              radius: q.s * 4,
              intensity: (1 - clamp((q.t / q.life - 0.65) / 0.35)) * 0.55,
              color: [1, 190 / 255, 110 / 255],
            },
            frame,
          ),
        );
    }),
    sources.register('embers', (frame) => {
      const v = read();
      if (v.cinematic || v.sceneLoading) return [];
      return v.fx.embers
        .filter((q) => q.t >= 0 && q.t < q.life)
        .map((q) =>
          entry(
            q,
            {
              x: q.x,
              y: q.y,
              z: 3 * v.scale,
              radius: 14 * v.scale,
              intensity:
                (1 - q.t / q.life) *
                (v.reducedFlashes ? 0.6 : 0.6 + 0.4 * Math.sin(frame.time * 20 + q.ph)) *
                0.25,
              color: [1, 220 / 255, 180 / 255],
            },
            frame,
          ),
        );
    }),
    sources.register('foxfire', (frame) => {
      const v = read();
      if (v.sceneLoading || v.cinematic || !v.G.m?.foxfire) return [];
      const pose = foxfirePose(v.player, frame.time);
      return [
        {
          id: 'companion',
          light: transformSceneLight(
            {
              x: pose.x,
              y: pose.y,
              z: pose.radius * 2,
              radius: pose.radius * 8,
              intensity: v.G.foxUsed && v.G.state !== 'title' ? 0.12 : 0.5,
              color: [90 / 255, 150 / 255, 1],
            },
            frame,
          ),
        },
      ];
    }),
    sources.register('boss-auras', (frame) => {
      const v = read(),
        boss = v.G.boss;
      if (v.sceneLoading || v.reducedFlashes || !boss || boss.state !== 'flash') return [];
      const k = clamp(boss.t / boss.bp.flash),
        p = boss.pos;
      return [
        entry(
          boss,
          {
            x: p.x,
            y: p.y - p.h * 0.62,
            z: p.h * 0.15,
            radius: p.h * (0.75 + (0.2 - 0.75) * k),
            intensity: 0.45 * (1 - k * 0.4) * p.alpha,
            color: [1, 252 / 255, 244 / 255],
          },
          frame,
        ),
      ];
    }),
  ];
  return () => {
    for (const unregister of remove) unregister();
  };
}
