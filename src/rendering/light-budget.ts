import type { SceneLight } from './scene-frame.ts';

export const MAX_SCENE_LIGHTS = 16;
export interface IdentifiedLight {
  readonly id: string;
  readonly light: Readonly<SceneLight>;
}

/** Exact area of a circular light footprint clipped to the viewport. */
export function lightFootprint(light: Readonly<SceneLight>, width: number, height: number): number {
  const { x, y, radius: r } = light;
  if (![x, y, r, width, height].every(Number.isFinite) || r <= 0 || width <= 0 || height <= 0)
    return 0;
  if (x + r <= 0 || y + r <= 0 || x - r >= width || y - r >= height) return 0;
  const integral = (t: number) =>
    0.5 * (t * Math.sqrt(Math.max(0, r * r - t * t)) + r * r * Math.asin(t / r));
  const quadrant = (x0: number, y0: number) => {
    const a = Math.min(Math.abs(x0), r),
      b = Math.min(Math.abs(y0), r);
    if (a * a + b * b <= r * r) return Math.sign(x0) * Math.sign(y0) * a * b;
    const cut = Math.sqrt(Math.max(0, r * r - b * b));
    return Math.sign(x0) * Math.sign(y0) * (b * cut + integral(a) - integral(cut));
  };
  return Math.max(
    0,
    Math.min(
      width * height,
      quadrant(width - x, height - y) -
        quadrant(-x, height - y) -
        quadrant(width - x, -y) +
        quadrant(-x, -y),
    ),
  );
}

/** Global frame budget; code-point IDs break ties independently of locale/source order. */
export function selectSceneLights(
  candidates: readonly IdentifiedLight[],
  width: number,
  height: number,
): readonly Readonly<SceneLight>[] {
  return candidates
    .map((entry, index) => ({
      ...entry,
      index,
      score: entry.light.intensity * lightFootprint(entry.light, width, height),
    }))
    .filter(
      ({ light, score }) =>
        Number.isFinite(score) &&
        score > 0 &&
        Number.isFinite(light.z) &&
        light.color.every((channel) => Number.isFinite(channel) && channel >= 0) &&
        light.color.some((channel) => channel > 0),
    )
    .sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : a.index - b.index))
    .slice(0, MAX_SCENE_LIGHTS)
    .map(({ light }) => light);
}
