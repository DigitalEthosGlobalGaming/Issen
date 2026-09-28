import { BLESS_BY } from '../../game/content/blessings.ts';

export function renderPauseBlessings(root: HTMLElement, owned: ReadonlySet<string>): void {
  const list = root.querySelector<HTMLElement>('#pauseBlessings');
  if (!list) throw new Error('Missing pause blessings list');
  const doc = root.ownerDocument;
  list.replaceChildren();
  for (const id of owned) {
    const blessing = BLESS_BY[id];
    if (!blessing) continue;
    const row = doc.createElement('div');
    row.className = 'pause-blessing';
    const glyph = doc.createElement('span');
    glyph.className = 'pause-blessing-glyph';
    glyph.textContent = blessing.k;
    const words = doc.createElement('span');
    const name = doc.createElement('strong');
    name.textContent = blessing.n;
    const effect = doc.createElement('small');
    effect.textContent = blessing.d;
    words.append(name, effect);
    row.append(glyph, words);
    list.append(row);
  }
  if (!list.childElementCount) list.textContent = 'No blessings yet';
  list.scrollTop = 0;
}
