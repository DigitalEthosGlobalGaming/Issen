import { createEffects } from '../rendering/effects/state.ts';

/** Mutable cosmetic state; plain run records and gameplay timing live separately. */
export function createPresentationState() {
  return {
    time: 0,
    wind: 1,
    shake: 0,
    flashA: 0,
    flashCol: '255,255,255',
    lb: 0,
    lbT: 0,
    zoom: 1,
    zoomX: 0,
    zoomY: 0,
    inkPulse: 0,
    fx: createEffects(),
  };
}
export type PresentationState = ReturnType<typeof createPresentationState>;
