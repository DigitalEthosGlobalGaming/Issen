import type { createLifecycle } from '../platform/lifecycle.ts';
import type { EnvironmentState } from './environment-state.ts';
import { documentImageBudget } from '../platform/main-images.ts';

export function drawingPixelRatio(doc: Document, width: number, height: number, ratio: number) {
  const requested = Number(doc.documentElement?.dataset.graphicsResolution ?? 100);
  const scale = Number.isFinite(requested) ? Math.max(50, Math.min(100, requested)) / 100 : 1;
  const capped =
    documentImageBudget(doc) <= 256 * 1024 * 1024
      ? Math.min(1.5, ratio, Math.sqrt(600_000 / (width * height)))
      : Math.min(2, ratio);
  return capped * scale;
}
export interface ViewportViews {
  W: number;
  H: number;
  DPR: number;
  readonly cvs: HTMLCanvasElement;
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly artworkReady: boolean;
  readonly environmentState: Pick<EnvironmentState, 'prevBg' | 'stageFade'>;
  readonly screenAnimation: { invalidate(): void };
  layout(): void;
  buildBG(): void;
  buildMist(): void;
  buildGrass(): void;
  buildLeaves(): void;
  buildWeather(resetSimulation?: boolean): void;
  buildPost(): void;
  prepareScene(): unknown;
  reposition(): void;
}
/** Own viewport rebuilding and resize debounce; character adoption is a rule port. */
export function createViewport(readViews: () => ViewportViews) {
  let rt = 0;
  let viewportPrepared = false;
  function resize() {
    const views = readViews();
    const {
      cvs,
      layout,
      buildBG,
      buildMist,
      buildGrass,
      buildLeaves,
      buildWeather,
      buildPost,
      screenAnimation,
      artworkReady,
      prepareScene,
      environmentState,
      reposition,
    } = views;
    const r = cvs.getBoundingClientRect();
    const width = Math.max(1, r.width);
    const height = Math.max(1, r.height);
    const ratio = drawingPixelRatio(cvs.ownerDocument, width, height, window.devicePixelRatio || 1);
    if (
      viewportPrepared &&
      views.W === width &&
      views.H === height &&
      views.DPR === ratio &&
      cvs.width === Math.round(width * ratio) &&
      cvs.height === Math.round(height * ratio)
    )
      return;
    views.W = width;
    views.H = height;
    views.DPR = ratio;
    cvs.width = Math.round(views.W * views.DPR);
    cvs.height = Math.round(views.H * views.DPR);
    layout();
    buildBG();
    buildMist();
    buildGrass();
    buildLeaves();
    buildWeather(false);
    buildPost();
    viewportPrepared = true;
    screenAnimation.invalidate();
    if (artworkReady) prepareScene();
    environmentState.prevBg = null;
    environmentState.stageFade = 0;
    reposition();
  }
  const { lifecycle } = readViews();
  window.addEventListener('issen:graphics-resolution', resize);
  lifecycle.add(() => window.removeEventListener('issen:graphics-resolution', resize));
  lifecycle.listen(window, 'resize', () => {
    lifecycle.clearTimeout(rt);
    rt = lifecycle.timeout(resize, 80);
  });
  return { resize };
}
