import { selectSceneLights, type IdentifiedLight } from '../rendering/light-budget.ts';
import type { SceneLight, SceneLighting, SceneTransform } from '../rendering/scene-frame.ts';

export interface LightFrame {
  readonly width: number;
  readonly height: number;
  /** Presentation effects clock; never the gameplay random stream. */
  readonly time: number;
  /** Logical scene coordinates to physical target pixels, including camera and zoom. */
  readonly transform?: Readonly<SceneTransform>;
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

/** Scene sources use logical coordinates; independent preview sources may stay in pixels. */
export function transformSceneLight(
  light: Readonly<SceneLight>,
  frame: Readonly<LightFrame>,
): SceneLight {
  const t = frame.transform;
  if (!t) return { ...light };
  const scale = Math.sqrt(Math.abs(t.a * t.d - t.b * t.c));
  return {
    ...light,
    x: t.a * light.x + t.c * light.y + t.tx,
    y: t.b * light.x + t.d * light.y + t.ty,
    z: light.z * scale,
    radius: light.radius * scale,
  };
}
