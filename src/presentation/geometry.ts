import { createLayout } from '../rendering/layout.ts';
import type { createBackground } from '../rendering/scene/background.ts';
/** Current logical viewport and layout share one presentation-owned plain record. */
export function createPresentationGeometry() {
  const geometry = {
    W: 1, H: 1, DPR: 1, S: 1, portrait: true,
    L: createLayout(1, 1) as ReturnType<typeof createLayout> & { glows?: ReturnType<typeof createBackground>['glows'] },
    MIST: [146, 141, 132],
  };
  function layout() {
    geometry.portrait = geometry.H >= geometry.W * 0.9;
    geometry.S = Math.max(geometry.W, geometry.H) / 900;
    geometry.L = createLayout(geometry.W, geometry.H);
  }
  return Object.assign(geometry, { layout });
}
