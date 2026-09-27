import { clamp } from '../shared/math.ts';
import { ROBES } from '../game/content/cosmetics.ts';
export const BASE = {
  robeD: [14, 13, 12],
  robe: [33, 31, 29],
  robeL: [76, 72, 66],
  inner: [120, 114, 105],
  obi: [58, 54, 50],
  skin: [134, 124, 110],
  skinD: [88, 80, 71],
  hair: [11, 10, 9],
  steelD: [92, 90, 86],
  steel: [168, 165, 158],
  steelL: [246, 243, 236],
  hilt: [20, 19, 18],
  tsuba: [44, 42, 39],
  straw: [128, 120, 105],
  grass: [24, 23, 21],
  shadow: [6, 6, 6],
  metal: [50, 48, 45],
} satisfies Record<string, [number, number, number]>;

export type Palette = Record<keyof typeof BASE, string>;
const names = Object.keys(BASE) as (keyof typeof BASE)[];
export function createPalette() {
  const fogCache = new Map<string, Palette>();
  const robeCache = new Map<string, Palette>();
  function fog(amount: number, mist: readonly number[]): Palette {
    const k = Math.round(clamp(amount) * 50),
      key = `${mist.join(',')}:${k}`;
    const cached = fogCache.get(key);
    if (cached) return cached;
    const f = k / 50;
    const palette = Object.fromEntries(
      names.map((name) => {
        const b = BASE[name];
        return [
          name,
          `rgb(${Math.round(b[0] + ((mist[0] ?? b[0]) - b[0]) * f)},${Math.round(b[1] + ((mist[1] ?? b[1]) - b[1]) * f)},${Math.round(b[2] + ((mist[2] ?? b[2]) - b[2]) * f)})`,
        ];
      }),
    ) as Palette;
    fogCache.set(key, palette);
    return palette;
  }
  function robe(id: string): Palette {
    const cached = robeCache.get(id);
    if (cached) return cached;
    const overrides: Record<string, unknown> = Object.hasOwn(ROBES, id) ? { ...ROBES[id] } : {};
    const palette = Object.fromEntries(
      names.map((name) => {
        const value = overrides[name];
        const b = Array.isArray(value) ? value : BASE[name];
        return [name, `rgb(${b[0]},${b[1]},${b[2]})`];
      }),
    ) as Palette;
    robeCache.set(id, palette);
    return palette;
  }
  return { fog, robe, clearFog: () => fogCache.clear() };
}
