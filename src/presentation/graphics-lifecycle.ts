import type { createLifecycle } from '../platform/lifecycle.ts';
import type { createFrameLoop } from '../platform/frame-loop.ts';
import type { createAudio } from '../audio/audio.ts';
import type { createCombatHaptics } from '../platform/haptics.ts';
import type { SceneSurface } from '../rendering/scene-surface.ts';
import type { RunState } from '../game/run-state.ts';
import { reportGraphicsError, GRAPHICS_ERROR_EVENT } from '../rendering/graphics-error.ts';
import { pageActive, onActivityChange } from '../platform/activity.ts';
export interface GraphicsLifecycleViews {
  lifecycle: ReturnType<typeof createLifecycle>;
  frameLoop: ReturnType<typeof createFrameLoop>;
  combatHaptics: ReturnType<typeof createCombatHaptics>;
  audio: ReturnType<typeof createAudio>;
  G: RunState;
  showPauseScreen(): void;
  cvs: HTMLCanvasElement;
  nativeScene: NonNullable<SceneSurface['native']>;
  $(id: string): HTMLElement;
  screenAnimation: { invalidate(): void };
  visitToday(): void;
  artworkReady: boolean;
}
/** Own graphics failure, restore deadlines and activity suspension. */
export function bindGraphicsLifecycle(readViews: () => GraphicsLifecycleViews) {
  const { lifecycle, frameLoop, combatHaptics, audio, G, showPauseScreen, cvs, nativeScene, $, screenAnimation, visitToday } = readViews();
  let graphicsFailed = false;
  lifecycle.listen(document, GRAPHICS_ERROR_EVENT, () => {
    graphicsFailed = true;
    frameLoop.stop();
    combatHaptics.stop();
    audio.setInactive(true);
    if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) {
      G.pausedFrom = G.state;
      G.state = 'paused';
      showPauseScreen();
    }
  });
  const resumeFrames = () => {
    if (!graphicsFailed) frameLoop.start();
  };
  if (nativeScene) {
    let recoveryTimer: ReturnType<typeof setTimeout> | undefined;
    lifecycle.listen(cvs, 'webglcontextlost', () => {
      frameLoop.stop();
      combatHaptics.stop();
      audio.setInactive(true);
      if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) {
        G.pausedFrom = G.state;
        G.state = 'paused';
        showPauseScreen();
      }
      ($('bResume') as HTMLButtonElement).disabled = true;
      recoveryTimer = lifecycle.timeout(() => {
        if (!nativeScene?.contextLost) return;
        reportGraphicsError(cvs);
      }, 8000);
    });
    lifecycle.listen(cvs, 'webglcontextrestored', () => {
      if (!nativeScene) return;
      if (recoveryTimer !== undefined) lifecycle.clearTimeout(recoveryTimer);
      ($('bResume') as HTMLButtonElement).disabled = false;
      screenAnimation.invalidate();
      audio.setInactive(!pageActive());
      if (pageActive()) resumeFrames();
    });
  }
  lifecycle.add(
    onActivityChange((active) => {
      if (active) visitToday();
      audio.setInactive(!active);
      if (!active) {
        combatHaptics.stop();
        frameLoop.stop();
      } else if (readViews().artworkReady && !nativeScene?.contextLost) resumeFrames();
    }),
  );

}
