import type { Screen } from '../game/run-state.ts';
import type { FrameDemand } from '../platform/frame-loop.ts';

interface ScreenAnimation {
  scene: 'animated' | 'snapshot';
  preview?: boolean;
}

/** Screens own their animation needs; the frame loop owns callback scheduling. */
export const SCREEN_ANIMATION = {
  title: { scene: 'animated' },
  over: { scene: 'animated' },
  shrine: { scene: 'animated' },
  paused: { scene: 'snapshot' },
  armory: { scene: 'snapshot', preview: true },
  stats: { scene: 'snapshot' },
  setup: { scene: 'snapshot' },
  template: { scene: 'snapshot' },
  admin: { scene: 'snapshot' },
  trials: { scene: 'snapshot' },
  support: { scene: 'snapshot' },
  options: { scene: 'snapshot' },
} satisfies Record<Screen, ScreenAnimation>;

const ANIMATED: FrameDemand = { update: true, render: true, afterRender: false };
const SETTLED: FrameDemand = { update: false, render: false, afterRender: false };
const PREVIEW: FrameDemand = { ...SETTLED, afterRender: true };
const ENTERING_PREVIEW: FrameDemand = { ...ANIMATED, afterRender: true };
const GAME_ANIMATION: ScreenAnimation = { scene: 'animated' };

/** Keep the scene live through screen fades, then hold its last complete image. */
export function createScreenAnimation(now: () => number, initial: Screen | null) {
  let screen = initial;
  let settleAt = now() + 450; // Matches the screen opacity transition.
  let dirty = true;
  return {
    show(next: Screen | null) {
      screen = next;
      settleAt = now() + 450;
      dirty = true;
    },
    invalidate() {
      // A resize clears the canvas. Redraw even if the menu was already settled.
      settleAt = now() + 450;
      dirty = true;
    },
    demand(covered = false): FrameDemand {
      const policy: ScreenAnimation = screen ? SCREEN_ANIMATION[screen] : GAME_ANIMATION;
      const scene = !covered && (dirty || policy.scene === 'animated' || now() < settleAt);
      if (scene) dirty = false;
      return scene
        ? policy.preview
          ? ENTERING_PREVIEW
          : ANIMATED
        : policy.preview
          ? PREVIEW
          : SETTLED;
    },
  };
}
