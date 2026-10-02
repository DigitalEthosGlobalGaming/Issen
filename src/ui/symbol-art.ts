import templeAtlas from './assets/temple-symbols-atlas.png';
import trialAtlas from './assets/trial-symbols-atlas.png';
import type { UpgradeId } from '../game/progression/meta.ts';
import './symbol-art.css';

const templeCells: Record<UpgradeId, number> = {
  precision: 0,
  discernment: 1,
  vitality: 2,
  focus: 3,
  offerings: 4,
  awakening: 5,
  knife: 6,
  composure: 7,
  recovery: 8,
};
const trialCells: Record<string, number> = {
  'quiet-blade': 0,
  'duel-master': 1,
  unbroken: 2,
  'true-edge': 3,
  'still-water': 4,
  sightless: 5,
  'twin-fang': 6,
  'three-masters': 7,
  'golden-sovereign': 8,
  'broken-reality': 9,
};

/** Decorative atlas art accompanies visible names and never replaces accessible text. */
export function createSymbolArt(
  doc: Document,
  family: 'temple' | 'trial',
  id: string,
): HTMLElement {
  const cells = family === 'temple' ? templeCells : trialCells;
  const cell = cells[id as keyof typeof cells];
  if (cell === undefined) throw new Error(`Missing ${family} symbol: ${id}`);
  const columns = family === 'temple' ? 3 : 4;
  const rows = 3;
  const art = doc.createElement('span');
  art.className = 'symbol-art';
  art.dataset.symbol = `${family}:${id}`;
  art.setAttribute('aria-hidden', 'true');
  art.style.backgroundImage = `url("${family === 'temple' ? templeAtlas : trialAtlas}")`;
  art.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
  art.style.backgroundPosition = `${((cell % columns) / (columns - 1)) * 100}% ${(Math.floor(cell / columns) / (rows - 1)) * 100}%`;
  return art;
}
