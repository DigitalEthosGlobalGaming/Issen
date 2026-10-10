import type { createGraphicsQuality } from '../../platform/graphics-quality.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { SceneryDetail } from '../../rendering/environment/scenery-detail.ts';

/** Apply cheap choices immediately; coalesce viewport and scenery rebuilds. */
export function createGraphicsApplication(
  canvas: HTMLCanvasElement,
  graphics: ReturnType<typeof createGraphicsQuality>,
  lifecycle: ReturnType<typeof createLifecycle>,
  invalidate: () => void,
  prepareScene: () => void,
) {
  const doc = canvas.ownerDocument,
    win = doc.defaultView!,
    data = doc.documentElement.dataset;
  let requested = NaN,
    applied = Number(data.graphicsResolution ?? 100),
    timer = 0;
  let requestedScenery: SceneryDetail | undefined,
    appliedScenery = data.graphicsScenery as SceneryDetail | undefined;
  function applying(value: boolean) {
    data.graphicsApplying = String(value);
  }
  function commitHeavyChoices() {
    timer = 0;
    const resized = applied !== requested,
      sceneryChanged = appliedScenery !== requestedScenery;
    applied = requested;
    appliedScenery = requestedScenery;
    data.graphicsResolution = String(applied);
    data.graphicsScenery = appliedScenery!;
    if (resized) win.dispatchEvent(new Event('issen:graphics-resolution'));
    if (sceneryChanged) prepareScene();
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
      if (requested !== state.resolution || requestedScenery !== state.scenery) {
        requested = state.resolution;
        requestedScenery = state.scenery;
        lifecycle.clearTimeout(timer);
        timer = 0;
        if (requested === applied && requestedScenery === appliedScenery) applying(false);
        else if (immediate) commitHeavyChoices();
        else {
          applying(true);
          timer = lifecycle.timeout(commitHeavyChoices, 300);
        }
      }
      invalidate();
    },
  };
}
