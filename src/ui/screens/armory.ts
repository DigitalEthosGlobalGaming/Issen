import type { Item, ItemCategory } from '../../game/content/items.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Statistics } from '../../game/progression/statistics.ts';
import { SPECIAL } from '../../game/content/awakenings.ts';

const ARM: readonly (readonly [ItemCategory, string])[] = [
  ['blade', 'Blades'],
  ['robe', 'Outfits'],
  ['charm', 'Charms'],
  ['crest', 'Crests'],
  ['pet', 'Companions'],
  ['fx', 'Kill effects'],
  ['film', 'Film looks'],
  ['seal', 'Seals'],
];

export interface ArmoryOptions {
  items: readonly Item[];
  equipment: Equipment;
  unlocks: ReadonlySet<string>;
  statistics: Statistics;
  seals: Readonly<Record<string, string>>;
  charms: Readonly<Record<string, string>>;
  events: { equipped(equipment: Equipment): void; awaken(): void; preview(): void };
}

/** Owns selection and DOM updates; the caller owns persistence and game effects. */
export function createArmoryScreen(root: HTMLElement, options: ArmoryOptions) {
  const {
    items: ITEMS,
    equipment: EQ,
    unlocks: UNL,
    statistics: ST,
    seals: SEALS,
    charms: CHARMCOL,
    events,
  } = options;
  const doc = root.ownerDocument;
  const $ = (id: string) => {
    const element = root.querySelector<HTMLElement>('#' + id);
    if (!element) throw new Error('Missing armory element ' + id);
    return element;
  };
  const ITEM_BY: Record<string, Item> = Object.fromEntries(ITEMS.map((item) => [item.id, item]));
  let armTab: ItemCategory = 'blade',
    armSel: string | null = null;
  const isSp = () => !!(EQ.bladeSp && SPECIAL[EQ.blade] && UNL.has(EQ.blade + '+'));
  const preview = $('prevC');
  const onPreview = () => {
    if (armTab === 'fx') events.preview();
  };
  preview.addEventListener('click', onPreview);
  function render() {
    const tabs = $('armTabs');
    tabs.innerHTML = '';
    for (const [t, label] of ARM) {
      const all = ITEMS.filter((i) => i.type === t),
        own = all.filter((i) => UNL.has(i.id)).length;
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(t === armTab));
      b.innerHTML = `${label}<small>${own}/${all.length}</small>`;
      b.addEventListener('click', () => {
        armTab = t;
        armSel = null;
        render();
      });
      tabs.appendChild(b);
    }
    const act = tabs.querySelector('[aria-selected="true"]');
    if (act) {
      const tr = tabs.getBoundingClientRect(),
        ar = act.getBoundingClientRect();
      tabs.scrollLeft = Math.max(
        0,
        tabs.scrollLeft + (ar.left - tr.left) - tr.width / 2 + ar.width / 2,
      );
    }
    const tiles = $('armTiles');
    tiles.innerHTML = '';
    if (!armSel || ITEM_BY[armSel]?.type !== armTab) armSel = EQ[armTab];
    for (const it of ITEMS.filter((i) => i.type === armTab)) {
      const own = UNL.has(it.id),
        on = EQ[armTab] === it.id;
      const b = doc.createElement('button');
      b.type = 'button';
      const hid = it.hidden && !own,
        spU = !hid && armTab === 'blade' && UNL.has(it.id + '+'),
        aw = on && armTab === 'blade' && isSp();
      b.className =
        'tile' +
        (own ? '' : ' locked') +
        (on ? ' on' : '') +
        (armSel === it.id ? ' sel' : '') +
        (aw ? ' awake' : '');
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', it.n + (own ? '' : ' (locked)'));
      const swc = armTab === 'seal' ? SEALS[it.id] : armTab === 'charm' ? CHARMCOL[it.id] : null;
      b.innerHTML = `<span class="tk${swc ? ' sw' : ''}${it.k.length >= 4 ? ' k4' : it.k.length === 3 ? ' k3' : ''}"${swc ? ` style="background:${swc}"` : ''}>${hid ? '？' : it.k}</span><span class="tn">${hid ? 'Hidden' : (aw ? '真 ' : '') + it.n}</span>${spU ? '<span class="spb">真</span>' : ''}`;
      b.addEventListener('click', () => {
        const again = armSel === it.id && EQ[armTab] === it.id;
        armSel = it.id;
        if (own) {
          if (armTab === 'blade') {
            if (again && spU) {
              EQ.bladeSp = !EQ.bladeSp;
              if (EQ.bladeSp) {
                events.awaken();
              }
            } else if (EQ.blade !== it.id) EQ.bladeSp = false;
          }
          EQ[armTab] = it.id;
          events.equipped(EQ);
          if (armTab === 'fx') events.preview();
        }
        render();
      });
      tiles.appendChild(b);
    }
    const it = ITEM_BY[armSel];
    if (!it) return;
    const own = UNL.has(it.id),
      awk = armTab === 'blade' && EQ.blade === it.id && isSp();
    if (it.hidden && !own) {
      $('armInfo').innerHTML =
        `<div class="nm">？ Hidden<small>Secret</small></div><div class="fl">Hint: ${it.hint}</div>`;
      return;
    }
    $('armInfo').innerHTML =
      `<div class="nm">${awk ? '真 ' : ''}${it.k} ${it.n}<small>${own ? (EQ[armTab] === it.id ? 'Equipped' : '') : 'Locked'}</small></div><div class="fl">${own ? it.f : 'To unlock: ' + it.d}</div>` +
      (it.pk ? `<div class="pk">+ ${it.pk}</div>` : '') +
      (it.tr ? `<div class="tr">− ${it.tr}</div>` : '') +
      spInfo(it, own);
  }
  function spInfo(it: Item, _own: boolean) {
    if (it.type !== 'blade' || !SPECIAL[it.id]) return '';
    const sp = SPECIAL[it.id]!,
      u = UNL.has(it.id + '+'),
      q = ST.bl[it.id],
      cur = Math.min(q?.[sp.need[0]] || 0, sp.need[1]);
    const st = u
      ? EQ.blade === it.id && isSp()
        ? 'Active. Tap again to return to normal.'
        : EQ.blade === it.id
          ? 'Tap this blade again to awaken it.'
          : 'Equip it, then tap again to awaken it.'
      : `Locked. ${sp.need[2]} with this blade (${cur.toLocaleString()}/${sp.need[1].toLocaleString()}).`;
    return `<div class="spx">真 Awakened: ${st}</div><div class="pk">+ ${sp.pk}</div><div class="tr">− ${sp.tr}</div>`;
  }
  return {
    render,
    get tab() {
      return armTab;
    },
    dispose() {
      preview.removeEventListener('click', onPreview);
      $('armTabs').replaceChildren();
      $('armTiles').replaceChildren();
    },
  };
}
