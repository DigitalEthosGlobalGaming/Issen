import { createPalette } from '../palette.ts';
import type { Figure } from './types.ts';
const palettes = createPalette();
const hats = ['', 'hair', 'kasa', 'jingasa', 'monk', 'kabuto'];
const tones = ['sumi', 'hai', 'rags', 'tanuki'];
/** Visual identity is derived from the saved figure seed, never the combat RNG. */
export function enemyAppearance(f: Figure) {
  const seed = Math.abs(Math.floor(f.d.seed * 10007));
  return {
    variant: f.variant || hats[seed % hats.length]!,
    palette: f.pal || palettes.robe(tones[Math.floor(seed / hats.length) % tones.length]!),
    width: 0.94 + (Math.floor(seed / 29) % 7) * 0.02,
  };
}
