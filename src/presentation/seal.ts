import { setSealTextures } from '../rendering/ui-art.ts';
import type { Equipment } from '../platform/saves.ts';
export const SEALS: Readonly<Record<string, string>> = {
  verm: '#a3271d', gold: '#a67c22', indigo: '#2d3e72', jade: '#2f6f55',
  sumiseal: '#1b1a18', 'trial-platinum': '#aebbc5', 'trial-copper': '#c1845e', 'quiet-seal': '#678b7b',
};
/** Seal presentation reads current equipment identity when the selection is applied. */
export function createSealPresentation(readEquipment: () => Pick<Equipment, 'seal'>,
  element: (id: string) => HTMLElement) {
  const sealState = { SEAL: '#a3271d', SEALARC: '#a3271d' };
  function applySeal() {
    const equipment = readEquipment();
    sealState.SEAL = SEALS[equipment.seal] || '#a3271d';
    sealState.SEALARC = equipment.seal === 'sumiseal' ? '#e9e3d6' : sealState.SEAL;
    document.documentElement.style.setProperty('--seal', sealState.SEAL);
    void setSealTextures(element('app'), sealState.SEAL);
  }
  return { SEALS, sealState, applySeal };
}
