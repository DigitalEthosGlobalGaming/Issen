import { createHud } from '../hud.ts';
import { createScreenAnimation } from '../screen-animation.ts';
import type { Screen } from '../../game/run-state.ts';

type Hud = ReturnType<typeof createHud>;
export interface ScreenViews {
 readonly G: Readonly<Parameters<Hud['renderScore']>[0] & { boss: Parameters<Hud['renderBossHealth']>[0] }>;
 readonly activeDaily: boolean;
 /** Transitional progression port; preserves collection sync before score display. */
 readonly syncCollections: () => void;
}

/** Owns screen/HUD presentation; callers retain progression and phase actions. */
export function createRuntimeScreens(root: HTMLElement, now: () => number, readViews: () => ScreenViews) {
 const hudView = createHud(root);
 const screenAnimation = createScreenAnimation(now, hudView.activeScreen);
  function showScreen(id: Screen | null) {
    screenAnimation.show(id);
    hudView.showScreen(id);
  }
  function renderLives() {
    const { G } = readViews();
    hudView.renderLives(G);
  }
  function hud(on: boolean) {
    const { G, activeDaily } = readViews();
    hudView.render(G, on, activeDaily ? 'Daily' : undefined);
  }
  function setScore() {
    const { G, syncCollections } = readViews();
    syncCollections();
    hudView.renderScore(G);
  }
  const banner = hudView.showBanner;
  function renderHp() {
    const { G } = readViews();
    hudView.renderBossHealth(G.boss);
  }

 return { hudView, screenAnimation, showScreen, renderLives, hud, setScore, banner, renderHp };
}
