import { createPostState, preparePost, type PostFrame } from '../rendering/effects/post-frame.ts';
import type { PresentationFrame } from './scene.ts';
import type { Effects } from '../rendering/effects/state.ts';
import type { Random } from '../shared/random.ts';
import type { RunState } from '../game/run-state.ts';

export interface PostSignals {
  inkPulse: number;
  flashA: number;
  shake: number;
}
export interface PostPreparationViews {
  readonly W: number;
  readonly H: number;
  readonly G: Readonly<
    Pick<RunState, 'state' | 'zen' | 'hard' | 'maxLives' | 'lives' | 'attacker' | 'boss'>
  >;
  readonly R: Random;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly sceneFilm: () => string;
  readonly pz: () => number;
  readonly fx: Pick<Effects, 'scratches'>;
  readonly buzz: (duration: number) => void;
  readonly signals: PostSignals;
  readonly time: number;
  readonly S: number;
}

/** Owns cosmetic post history. Prepare once, then replay any number of draws. */
export function createPostPreparation(readViews: () => PostPreparationViews) {
  let postState = createPostState();
  function advancePost(raw: number): PostFrame {
    const { W, H, G, R, reducedMotion, reducedFlashes, sceneFilm, pz, fx, buzz, signals } =
      readViews();
    const prepared = preparePost(
      postState,
      {
        raw,
        width: W,
        height: H,
        nitrate: sceneFilm() === 'nitrate',
        reducedMotion: reducedMotion(),
        reducedFlashes: reducedFlashes(),
        active: ['playing', 'boss', 'standoff', 'between', 'shrine', 'dead'].includes(G.state),
        limitedLives: !G.zen && !G.hard && G.maxLives > 1,
        dead: G.state === 'dead',
        lives: G.lives,
        maxLives: G.maxLives,
        imminentAttack: !!(
          (G.attacker && G.attacker.p >= pz()) ||
          (G.boss && ['windup', 'flash'].includes(G.boss.state))
        ),
        inkPulse: signals.inkPulse,
        flash: signals.flashA,
        scratches: fx.scratches,
      },
      R,
    );
    postState = prepared.state;
    signals.inkPulse = prepared.inkPulse;
    signals.flashA = prepared.flash;
    fx.scratches = prepared.scratches;
    if (prepared.heartbeat) buzz(8);
    return prepared.frame;
  }
  function preparePresentation(raw: number): PresentationFrame {
    const { reducedMotion, R, signals, sceneFilm, time, S } = readViews();
    const sx = reducedMotion() ? 0 : (R() - 0.5) * signals.shake,
      sy = reducedMotion()
        ? 0
        : (R() - 0.5) * signals.shake +
          (sceneFilm() === 'nitrate' ? Math.sin(time * 7) * 1.2 + (R() < 0.02 ? R() * 4 : 0) : 0);
    signals.shake = Math.max(0, signals.shake - raw * 45 * S);
    return { cameraX: sx, cameraY: sy, post: advancePost(raw) };
  }

  return {
    advancePost,
    preparePresentation,
    get state() {
      return postState;
    },
  };
}
