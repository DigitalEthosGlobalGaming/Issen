import { selectSceneLights, type IdentifiedLight } from '../rendering/light-budget.ts';
import type { SceneLight, SceneLighting } from '../rendering/scene-frame.ts';

export interface LightFrame {
  readonly width: number;
  readonly height: number;
  /** Presentation effects clock; never the gameplay random stream. */
  readonly time: number;
}
export interface FrameLight {
  /** Stable within this source across frames. */
  readonly id: string;
  readonly light: Readonly<SceneLight>;
}
export type LightSource = (frame: Readonly<LightFrame>) => readonly FrameLight[];

/** Presentation-owned extension registry; sources added/removed during sampling apply next frame. */
export function createLightSources() {
  const sources = new Map<string, LightSource>();
  return {
    register(name: string, source: LightSource) {
      if (!name.trim()) throw new Error('Light source name must not be empty.');
      if (sources.has(name)) throw new Error(`Duplicate light source: ${name}`);
      sources.set(name, source);
      return () => {
        if (sources.get(name) === source) sources.delete(name);
      };
    },
    lighting(frame: Readonly<LightFrame>, base: SceneLighting): SceneLighting {
      const candidates: IdentifiedLight[] = base.points.map((light, index) => ({
        id: JSON.stringify(['rig', index]),
        light,
      }));
      for (const [name, source] of [...sources]) {
        const ids = new Set<string>();
        for (const entry of source(frame)) {
          if (!entry.id || ids.has(entry.id))
            throw new Error(`Invalid light ID in source: ${name}`);
          ids.add(entry.id);
          candidates.push({ id: JSON.stringify(['source', name, entry.id]), light: entry.light });
        }
      }
      return { ...base, points: selectSceneLights(candidates, frame.width, frame.height) };
    },
    dispose() {
      sources.clear();
    },
  };
}
