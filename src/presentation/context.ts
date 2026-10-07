import type { Random } from '../shared/random.ts';
import type { createEffectSpawner } from '../rendering/effects/spawn.ts';
import type { createLayout } from '../rendering/layout.ts';

/** Cosmetic randomness and effects never receive the gameplay random generator. */
export interface PresentationContext {
  readonly random: Random;
  readonly effects: () => ReturnType<typeof createEffectSpawner>;
  readonly layout: () => ReturnType<typeof createLayout>;
  readonly viewport: () => { width: number; height: number; dpr: number; scale: number };
  readonly camera: {
    shake: number;
    zoom: number;
    zoomX: number;
    zoomY: number;
  };
}
