import type { createGraphicsQuality } from '../../platform/graphics-quality.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { SceneryDetail } from '../../rendering/environment/scenery-detail.ts';
import type { GraphicsSettings } from '../../platform/graphics-settings.ts';
import { applyMainImageBudget } from '../../platform/main-images.ts';
import { reclaimSceneMemory } from '../../platform/scene-memory.ts';

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
    timer = 0,
    memoryPending = 0;
  let requestedScenery: SceneryDetail | undefined,
    appliedScenery = data.graphicsScenery as SceneryDetail | undefined;
  let requestedMemory: GraphicsSettings['memory'] | undefined,
    appliedMemory = data.graphicsMemory as GraphicsSettings['memory'] | undefined;
  let requestedAntialias: boolean | undefined,
    appliedAntialias: boolean | undefined =
      data.graphicsAntialias === undefined ? undefined : data.graphicsAntialias === 'true';
  function settled() {
    return (
      !memoryPending &&
      canvas.dataset.sceneState !== 'loading' &&
      (appliedAntialias === undefined ||
        canvas.dataset.graphicsAntialiasApplied === String(appliedAntialias))
    );
  }
  function applying(value: boolean) {
    data.graphicsApplying = String(value);
  }
  function commitHeavyChoices() {
    timer = 0;
    const resized = applied !== requested,
      sceneryChanged = appliedScenery !== requestedScenery,
      memoryChanged = appliedMemory !== requestedMemory;
    applied = requested;
    appliedScenery = requestedScenery;
    data.graphicsResolution = String(applied);
    data.graphicsScenery = appliedScenery!;
    appliedMemory = requestedMemory;
    data.graphicsMemory = appliedMemory!;
    appliedAntialias = requestedAntialias;
    data.graphicsAntialias = String(appliedAntialias);
    if (memoryChanged) {
      applyMainImageBudget(doc);
      const pending: Promise<unknown>[] = [];
      memoryPending++;
      doc.dispatchEvent(new CustomEvent('issen:graphics-memory', { detail: { pending } }));
      reclaimSceneMemory(doc);
      void Promise.allSettled(pending).then(() => {
        memoryPending--;
        if (!timer && settled()) applying(false);
      });
    }
    if (resized) win.dispatchEvent(new Event('issen:graphics-resolution'));
    if (sceneryChanged) prepareScene();
    invalidate();
    applying(!settled());
  }
  const observer = new MutationObserver(() => {
    if (!timer && settled()) applying(false);
  });
  observer.observe(canvas, {
    attributes: true,
    attributeFilter: ['data-scene-state', 'data-graphics-antialias-applied'],
  });
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
      if (
        requested !== state.resolution ||
        requestedScenery !== state.scenery ||
        requestedMemory !== state.memory ||
        requestedAntialias !== state.antialias
      ) {
        requested = state.resolution;
        requestedScenery = state.scenery;
        requestedMemory = state.memory;
        requestedAntialias = state.antialias;
        lifecycle.clearTimeout(timer);
        timer = 0;
        if (
          requested === applied &&
          requestedScenery === appliedScenery &&
          requestedMemory === appliedMemory &&
          requestedAntialias === appliedAntialias
        )
          applying(!settled());
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
