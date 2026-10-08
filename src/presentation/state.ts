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

export function advancePresentationClock(presentationState: PresentationState, dt: number) {
  presentationState.time += dt;
  presentationState.wind =
    1 +
    0.55 * Math.sin(presentationState.time * 0.31) +
    0.35 * Math.sin(presentationState.time * 0.87 + 1) +
    0.2 * Math.sin(presentationState.time * 2.3);
}

export function advancePresentationCamera(presentationState: PresentationState, raw: number) {
  if (presentationState.lbT > 0) {
    presentationState.lbT -= raw;
    presentationState.lb += (1 - presentationState.lb) * (1 - Math.exp(-raw * 14));
  } else presentationState.lb += (0 - presentationState.lb) * (1 - Math.exp(-raw * 5));
  presentationState.zoom += (1 - presentationState.zoom) * (1 - Math.exp(-raw * 7));
}
