import { clamp } from '../../shared/math.ts';
import type { Random } from '../../shared/random.ts';
import type { Effects } from './state.ts';

type Scratch = Effects['scratches'][number];
export interface PostState {
  frame: number;
  ink: number;
  heartbeatTimer: number;
  heartbeatPulse: number;
}
export const createPostState = (): PostState => ({
  frame: 0,
  ink: 0,
  heartbeatTimer: 0,
  heartbeatPulse: 0,
});
export interface PostInput {
  raw: number;
  width: number;
  height: number;
  nitrate: boolean;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  active: boolean;
  limitedLives: boolean;
  dead: boolean;
  lives: number;
  maxLives: number;
  imminentAttack: boolean;
  inkPulse: number;
  flash: number;
  scratches: readonly Scratch[];
}
export interface PostFrame {
  grain: number;
  grainX: number;
  grainY: number;
  blot: { x: number; y: number; radius: number } | null;
  scratches: readonly Scratch[];
  dust: readonly { x: number; y: number; radius: number; dark: boolean }[];
  inkAlpha: number;
  inkVisible: boolean;
  flicker: number;
  flash: number;
}

/** Advance cosmetic state once; replaying the returned frame is side-effect free. */
export function preparePost(state: Readonly<PostState>, input: PostInput, random: Random) {
  const { width: w, height: h, raw, reducedMotion, reducedFlashes, nitrate } = input;
  const animated = !reducedMotion && !reducedFlashes;
  const grainX = animated ? -((random() * 180) | 0) : 0;
  const grainY = animated ? -((random() * 180) | 0) : 0;
  const blot =
    nitrate && !reducedFlashes && random() < 0.03
      ? { x: random() * w, y: random() * h, radius: 6 + random() * 30 }
      : null;
  const scratches = input.scratches.map((s) => ({ ...s }));
  if (animated && random() < (nitrate ? 0.4 : 0.07)) {
    scratches.push({
      x: random() * w,
      y0: random() < 0.5 ? 0 : random() * h * 0.5,
      y1: random() < 0.5 ? h : h * (0.5 + random() * 0.5),
      t: 0,
      life: 0.06 + random() * 0.3,
      a: 0.05 + random() * 0.12,
    });
  }
  for (const scratch of scratches) scratch.t += raw;
  const dust: { x: number; y: number; radius: number; dark: boolean }[] = [];
  // Preserve the existing stochastic dust cadence and keep it outside drawing.
  for (let i = 0; i < (animated ? (random() * 3) | 0 : 0); i++) {
    const dark = random() < 0.5;
    dust.push({ dark, x: random() * w, y: random() * h, radius: 0.6 + random() * 1.6 });
  }
  const target =
    input.active && input.limitedLives
      ? clamp((input.maxLives - input.lives) / Math.max(1, input.maxLives - 1))
      : 0;
  const ink = state.ink + (target - state.ink) * (1 - Math.exp(-raw * 3));
  let heartbeatTimer = state.heartbeatTimer,
    heartbeatPulse = state.heartbeatPulse;
  let heartbeat = false;
  if (input.active && input.limitedLives && input.lives === 1 && !input.dead) {
    heartbeatTimer -= raw;
    if (heartbeatTimer <= 0) {
      heartbeatTimer = input.imminentAttack ? 0.6 : 0.9;
      heartbeatPulse = 1;
      heartbeat = true;
    }
  }
  heartbeatPulse = Math.max(0, heartbeatPulse - raw * 3.5);
  const inkPulse = Math.max(0, input.inkPulse - raw * 1.4);
  const frame: PostFrame = {
    grain: (state.frame + 1) % 3,
    grainX,
    grainY,
    blot,
    scratches,
    dust,
    inkAlpha: clamp(ink * 0.8 + heartbeatPulse * 0.3 * ink + inkPulse * 0.6),
    inkVisible: ink > 0.01 || inkPulse > 0.01,
    flicker: reducedFlashes ? 0.02 : random() * (nitrate ? 0.12 : 0.035),
    flash: reducedFlashes ? Math.min(input.flash, 0.035) : input.flash,
  };
  return {
    state: { frame: state.frame + 1, ink, heartbeatTimer, heartbeatPulse },
    frame,
    heartbeat,
    inkPulse,
    flash: Math.max(0, input.flash - raw * 2.4),
    scratches: scratches.filter((s) => s.t < s.life),
  };
}
