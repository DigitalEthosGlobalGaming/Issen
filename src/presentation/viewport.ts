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
  prepareResolution?(ratio: number, signal: AbortSignal): Promise<(() => boolean) | undefined>;
  reposition(): void;
}
/** Own viewport rebuilding and resize debounce; character adoption is a rule port. */
export function createViewport(readViews: () => ViewportViews) {
  let rt = 0;
  let viewportPrepared = false;
  let resolutionRequest: AbortController | undefined;
  let resolutionRetry = 0;
  function applyResize(scenePrepared = false) {
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
    if (artworkReady && !scenePrepared) prepareScene();
    environmentState.prevBg = null;
    environmentState.stageFade = 0;
    reposition();
  }
  const { lifecycle } = readViews();
  function resize() {
    resolutionRequest?.abort();
    lifecycle.clearTimeout(resolutionRetry);
    applyResize();
  }
  async function resolution() {
    resolutionRequest?.abort();
    lifecycle.clearTimeout(resolutionRetry);
    const views = readViews(),
      doc = views.cvs.ownerDocument;
    const rect = views.cvs.getBoundingClientRect();
    if (
      !viewportPrepared ||
      !views.artworkReady ||
      !views.prepareResolution ||
      doc.documentElement.dataset.graphicsOpen === 'true' ||
      rect.width !== views.W ||
      rect.height !== views.H
    ) {
      resize();
      return;
    }
    const ratio = drawingPixelRatio(doc, views.W, views.H, window.devicePixelRatio || 1);
    if (ratio === views.DPR) return;
    const request = (resolutionRequest = new AbortController());
    const commit = await views.prepareResolution(ratio, request.signal);
    if (request.signal.aborted || lifecycle.disposed) return;
    if (commit?.()) applyResize(true);
    else resolutionRetry = lifecycle.timeout(() => void resolution(), 500);
  }
  window.addEventListener('issen:graphics-resolution', resolution);
  lifecycle.add(() => {
    resolutionRequest?.abort();
    lifecycle.clearTimeout(resolutionRetry);
    window.removeEventListener('issen:graphics-resolution', resolution);
  });
  lifecycle.listen(window, 'resize', () => {
    lifecycle.clearTimeout(rt);
    rt = lifecycle.timeout(resize, 80);
  });
  return { resize };
}
