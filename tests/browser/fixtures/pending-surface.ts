import { WebGLRenderer } from 'pixi.js';
import { SceneSurface } from '../../../src/rendering/scene-surface.ts';

/** Hold initialization after GPU resources exist to exercise late disposal. */
export async function disposePendingSurface() {
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const initialize = WebGLRenderer.prototype.init;
  const destroy = WebGLRenderer.prototype.destroy;
  let releases = 0;
  WebGLRenderer.prototype.init = async function (...args) {
    await Reflect.apply(initialize, this, args);
    entered();
    await gate;
  };
  WebGLRenderer.prototype.destroy = function (...args) {
    releases++;
    return Reflect.apply(destroy, this, args);
  };
  const surface = new SceneSurface(document.createElement('canvas'));
  try {
    const pending = surface.initialize();
    await ready;
    surface.dispose();
    release();
    await pending;
    return { releases, drawing: !!surface.drawing, native: !!surface.native };
  } finally {
    release();
    surface.dispose();
    WebGLRenderer.prototype.init = initialize;
    WebGLRenderer.prototype.destroy = destroy;
  }
}
