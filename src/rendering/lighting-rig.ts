import type { SceneLighting } from './scene-frame.ts';

/** Session-only controls. Positions scale independently for each explicit render target. */
export function createLightingRig() {
  const defaults = {
    x: 0.5,
    y: 0.4,
    height: 0.5,
    radius: 1.6,
    intensity: 2,
    ambient: 0.55,
    enabled: true,
    color: '#fff0d8',
  };
  const listeners = new Set<() => void>();
  const state = new Proxy(
    { ...defaults },
    {
      set(target, property, value) {
        const previous = Reflect.get(target, property);
        const changed = Reflect.set(target, property, value);
        if (changed && previous !== value) for (const listener of listeners) listener();
        return changed;
      },
    },
  );
  return {
    state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset() {
      Object.assign(state, defaults);
    },
    lighting(width: number, height: number): SceneLighting {
      const scale = Math.max(width, height);
      const rgb = [1, 3, 5].map(
        (start) => parseInt(state.color.slice(start, start + 2), 16) / 255,
      ) as [number, number, number];
      return {
        materialLighting: state.enabled ? 1 : 0,
        ambient: [state.ambient, state.ambient, state.ambient],
        directional: [0.3, 0.3, 0.3],
        direction: [-0.4, -0.5, 1],
        points: [
          {
            x: state.x * width,
            y: state.y * height,
            z: state.height * scale,
            radius: state.radius * scale,
            intensity: state.intensity,
            color: rgb,
          },
        ],
      };
    },
  };
}
