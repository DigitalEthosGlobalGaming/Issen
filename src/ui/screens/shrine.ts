import type { Blessing } from '../../game/shrine/blessings.ts';
import { TIER, TIERNAME } from '../../game/content/blessings.ts';

export function renderShrine(
  list: HTMLElement,
  offers: readonly Blessing[],
  choose: (blessing: Blessing) => void,
): void {
  const doc = list.ownerDocument;
  const buttons = offers.map((blessing) => {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'item ' + TIER[blessing.t];
    // All markup values come from the static, repository-owned catalog.
    button.innerHTML = `<span class="ik">${blessing.k}</span><span><span class="in">${blessing.n}</span>${blessing.t ? `<span class="tag">${TIERNAME[blessing.t]}</span>` : ''}<br><span class="id">${blessing.d}</span></span>`;
    button.addEventListener('click', () => choose(blessing));
    return button;
  });
  list.replaceChildren(...buttons);
}
