import { createSceneComposer } from './scene-composer.ts';
import { applyFilm } from '../rendering/effects/film.ts';
import { PREMIUM_FILM } from '../platform/premium.ts';
import { STAGES } from '../game/content/stages.ts';
import { TAU } from '../shared/math.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { PostFrame } from '../rendering/effects/post-frame.ts';
import type { RunState } from '../game/run-state.ts';

export interface PostViews {
  readonly G: Readonly<Pick<RunState, 'event' | 'state' | 'attacker' | 'm' | 'stage'>>;
  readonly g: SceneDrawing;
  readonly W: number;
  readonly H: number;
  readonly cvs: HTMLCanvasElement;
  readonly sceneFilm: () => string;
  readonly premiumAccess: () => boolean;
  readonly time: number;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly grainPats: readonly (CanvasPattern | null)[];
  readonly vig: HTMLCanvasElement | null;
  readonly pz: () => number;
  readonly inkEdge: HTMLCanvasElement | null;
  readonly lb: number;
  readonly flashCol: string;
}

/** Drawing consumes a prepared frame; effects clocks, RNG and haptics advance elsewhere. */
export function createPostPresentation(readViews: () => PostViews) {
  const filmComposer = createSceneComposer<PostFrame, PostViews>([
    {
      name: 'grade',
      draw(_frame, views) {
        const { g, W, H, cvs, sceneFilm, premiumAccess, time, reducedMotion, reducedFlashes } =
          views;
        applyFilm(
          g,
          W,
          H,
          cvs,
          sceneFilm() === PREMIUM_FILM && !premiumAccess() ? 'mono' : sceneFilm(),
          time,
          {
            reducedMotion: reducedMotion(),
            reducedFlashes: reducedFlashes(),
          },
        );
      },
    },
  ]);
  const composer = createSceneComposer<PostFrame, PostViews>([
    {
      name: 'blood-tint',
      draw(_frame, views) {
        const { G, g, W, H } = views;
        if (G.event === 'blood' && (G.state === 'playing' || G.state === 'dead')) {
          g.fillStyle = 'rgba(120,18,12,0.16)';
          g.fillRect(0, 0, W, H);
        }
      },
    },
    { name: 'film', draw: (frame, views) => filmComposer.draw(frame, views) },
    {
      name: 'grain',
      draw(frame, views) {
        const { g, W, H, grainPats } = views;
        const pat = grainPats[frame.grain];
        if (pat) {
          g.save();
          g.translate(frame.grainX, frame.grainY);
          g.fillStyle = pat;
          g.fillRect(0, 0, W + 180, H + 180);
          g.restore();
        }
      },
    },
    {
      name: 'blot',
      draw(frame, views) {
        const { g } = views;
        if (frame.blot) {
          g.fillStyle = 'rgba(8,6,4,.55)';
          g.beginPath();
          g.arc(frame.blot.x, frame.blot.y, frame.blot.radius, 0, TAU);
          g.fill();
        }
      },
    },
    {
      name: 'scratches',
      draw(frame, views) {
        const { g } = views;
        for (const s of frame.scratches) {
          g.strokeStyle = `rgba(225,220,210,${s.a})`;
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(s.x, s.y0);
          g.lineTo(s.x + 1.5, s.y1);
          g.stroke();
        }
      },
    },
    {
      name: 'dust',
      draw(frame, views) {
        const { g } = views;
        for (const dust of frame.dust) {
          g.fillStyle = dust.dark ? 'rgba(10,10,9,.35)' : 'rgba(230,225,215,.3)';
          g.beginPath();
          g.arc(dust.x, dust.y, dust.radius, 0, TAU);
          g.fill();
        }
      },
    },
    {
      name: 'vignette',
      draw(_frame, views) {
        const { G, g, W, H, time, reducedFlashes, vig, pz } = views;
        if (vig) {
          g.drawImage(vig, 0, 0, W, H);
          if (G.attacker && G.state === 'playing' && G.attacker.p >= pz() && !G.m.noArc) {
            g.globalAlpha = reducedFlashes() ? 0.5 : 0.5 + 0.2 * Math.sin(time * 30);
            g.drawImage(vig, 0, 0, W, H);
            g.globalAlpha = 1;
          }
        }
      },
    },
    {
      name: 'night-vignette',
      draw(_frame, views) {
        const { G, g, W, H, vig } = views;
        if (STAGES[G.stage]!.weather === 'night' && vig) {
          g.globalAlpha = 0.35;
          g.drawImage(vig, 0, 0, W, H);
          g.globalAlpha = 1;
        }
      },
    },
    {
      name: 'ink-edge',
      draw(frame, views) {
        const { g, W, H, inkEdge } = views;
        if (inkEdge && frame.inkVisible) {
          g.globalAlpha = frame.inkAlpha;
          g.drawImage(inkEdge, 0, 0, W, H);
          g.globalAlpha = 1;
        }
      },
    },
    {
      name: 'letterbox',
      draw(_frame, views) {
        const { g, W, H, lb } = views;
        if (lb > 0.005) {
          const bh = lb * H * 0.085;
          g.fillStyle = '#060605';
          g.fillRect(0, 0, W, bh);
          g.fillRect(0, H - bh, W, bh);
        }
      },
    },
    {
      name: 'flicker',
      draw(frame, views) {
        const { g, W, H } = views;
        g.fillStyle = `rgba(0,0,0,${frame.flicker})`;
        g.fillRect(0, 0, W, H);
      },
    },
    {
      name: 'flash',
      draw(frame, views) {
        const { g, W, H, flashCol } = views;
        if (frame.flash > 0) {
          g.fillStyle = `rgba(${flashCol},${frame.flash})`;
          g.fillRect(0, 0, W, H);
        }
      },
    },
  ]);
  return Object.assign(
    function drawPost(frame: PostFrame) {
      composer.draw(frame, readViews());
    },
    { composer, filmComposer },
  );
}
