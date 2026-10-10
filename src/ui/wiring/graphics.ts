import type { createGraphicsQuality } from '../../platform/graphics-quality.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';

/** Apply cheap choices immediately; coalesce changes that rebuild the viewport. */
export function createGraphicsApplication(
  canvas: HTMLCanvasElement,
  graphics: ReturnType<typeof createGraphicsQuality>,
  lifecycle: ReturnType<typeof createLifecycle>,
  invalidate: () => void,
) {
  const doc = canvas.ownerDocument,
    win = doc.defaultView!,
    data = doc.documentElement.dataset;
  let requested = NaN,
    applied = Number(data.graphicsResolution ?? 100),
    timer = 0;
  function applying(value: boolean) {
    data.graphicsApplying = String(value);
  }
  function commitResolution() {
    timer = 0;
    applied = requested;
    data.graphicsResolution = String(applied);
    win.dispatchEvent(new Event('issen:graphics-resolution'));
    invalidate();
    if (canvas.dataset.sceneState !== 'loading') applying(false);
  }
  const observer = new MutationObserver(() => {
    if (!timer && canvas.dataset.sceneState !== 'loading') applying(false);
  });
  observer.observe(canvas, { attributes: true, attributeFilter: ['data-scene-state'] });
  lifecycle.add(() => {
    observer.disconnect();
    applying(false);
  });
  return {
    apply(immediate = false) {
      const state = graphics.effective;
      data.graphicsLighting = state.lighting;
      data.graphicsParticles = state.particles;
      data.graphicsGrass = state.grass;
      data.graphicsWeather = state.weather;
      data.graphicsReductions = [
        ...new Set(graphics.reductions.map((reduction) => reduction.key)),
      ].join(',');
      if (requested !== state.resolution) {
        requested = state.resolution;
        lifecycle.clearTimeout(timer);
        timer = 0;
        if (requested === applied) applying(false);
        else if (immediate) commitResolution();
        else {
          applying(true);
          timer = lifecycle.timeout(commitResolution, 300);
        }
      }
      invalidate();
    },
  };
}
