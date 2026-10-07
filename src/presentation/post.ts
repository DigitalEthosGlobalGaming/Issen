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
  return function drawPost(frame: PostFrame) {
    const {
      G,
      g,
      W,
      H,
      cvs,
      sceneFilm,
      premiumAccess,
      time,
      reducedMotion,
      reducedFlashes,
      grainPats,
      vig,
      pz,
      inkEdge,
      lb,
      flashCol,
    } = readViews();
    if (G.event === 'blood' && (G.state === 'playing' || G.state === 'dead')) {
      g.fillStyle = 'rgba(120,18,12,0.16)';
      g.fillRect(0, 0, W, H);
    }
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
    const pat = grainPats[frame.grain];
    if (pat) {
      g.save();
      g.translate(frame.grainX, frame.grainY);
      g.fillStyle = pat;
      g.fillRect(0, 0, W + 180, H + 180);
      g.restore();
    }
    if (frame.blot) {
      g.fillStyle = 'rgba(8,6,4,.55)';
      g.beginPath();
      g.arc(frame.blot.x, frame.blot.y, frame.blot.radius, 0, TAU);
      g.fill();
    }
    for (const s of frame.scratches) {
      g.strokeStyle = `rgba(225,220,210,${s.a})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(s.x, s.y0);
      g.lineTo(s.x + 1.5, s.y1);
      g.stroke();
    }
    for (const dust of frame.dust) {
      g.fillStyle = dust.dark ? 'rgba(10,10,9,.35)' : 'rgba(230,225,215,.3)';
      g.beginPath();
      g.arc(dust.x, dust.y, dust.radius, 0, TAU);
      g.fill();
    }
    if (vig) {
      g.drawImage(vig, 0, 0, W, H);
      if (G.attacker && G.state === 'playing' && G.attacker.p >= pz() && !G.m.noArc) {
        g.globalAlpha = reducedFlashes() ? 0.5 : 0.5 + 0.2 * Math.sin(time * 30);
        g.drawImage(vig, 0, 0, W, H);
        g.globalAlpha = 1;
      }
    }
    if (STAGES[G.stage]!.weather === 'night' && vig) {
      g.globalAlpha = 0.35;
      g.drawImage(vig, 0, 0, W, H);
      g.globalAlpha = 1;
    }
    if (inkEdge && frame.inkVisible) {
      g.globalAlpha = frame.inkAlpha;
      g.drawImage(inkEdge, 0, 0, W, H);
      g.globalAlpha = 1;
    }
    if (lb > 0.005) {
      const bh = lb * H * 0.085;
      g.fillStyle = '#060605';
      g.fillRect(0, 0, W, bh);
      g.fillRect(0, H - bh, W, bh);
    }
    g.fillStyle = `rgba(0,0,0,${frame.flicker})`;
    g.fillRect(0, 0, W, H);
    if (frame.flash > 0) {
      g.fillStyle = `rgba(${flashCol},${frame.flash})`;
      g.fillRect(0, 0, W, H);
    }
  };
}
