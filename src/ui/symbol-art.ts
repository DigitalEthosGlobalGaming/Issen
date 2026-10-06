import { uiTexture } from './ui-texture.ts';
import tantoSymbol from './assets/tanto-symbol.svg';
import collectionAtlas from './assets/collection-symbols.svg';
import presetSymbol from './assets/preset-symbol.svg';
import type { UpgradeId } from '../game/progression/meta.ts';
import './symbol-art.css';

const templeCells: Record<UpgradeId, number> = {
  presets: -3,
  blessings: -2,
  curses: -2,
  weapons: -2,
  outfits: -2,
  precision: 0,
  discernment: 1,
  vitality: 2,
  focus: 3,
  offerings: 4,
  awakening: 5,
  knife: 6,
  composure: 7,
  recovery: 8,
  tanto: -1,
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
  const demon = family === 'trial' && id === 'demon-mirror';
  if (cell === undefined && !demon) throw new Error(`Missing ${family} symbol: ${id}`);
  const art = doc.createElement('span');
  art.className = 'symbol-art';
  art.dataset.symbol = `${family}:${id}`;
  art.setAttribute('aria-hidden', 'true');
  if (family === 'temple' && id === 'presets') {
    art.style.backgroundImage = `url("${presetSymbol}")`;
    art.style.backgroundSize = '80% 80%';
    art.style.backgroundPosition = 'center';
    return art;
  }
  if (family === 'temple' && cell === -2) {
    const index = ['blessings', 'curses', 'weapons', 'outfits'].indexOf(id);
    art.style.backgroundImage = `url("${collectionAtlas}")`;
    art.style.backgroundSize = '400% 100%';
    art.style.backgroundPosition = `${(index / 3) * 100}% center`;
    return art;
  }
  if (demon || (family === 'temple' && id === 'tanto')) {
    art.style.backgroundImage = demon ? uiTexture('demon-mirror-symbol') : `url("${tantoSymbol}")`;
    art.style.backgroundSize = '80% 80%';
    art.style.backgroundPosition = 'center';
    return art;
  }
  art.style.backgroundImage = uiTexture(`${family}-symbols-atlas`, cell);
  art.style.backgroundSize = '100% 100%';
  art.style.backgroundPosition = 'center';
  return art;
}
