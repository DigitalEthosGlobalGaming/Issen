import type { Item, ItemCategory } from '../../game/content/items.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Statistics, BladeStats } from '../../game/progression/statistics.ts';
import { SPECIAL } from '../../game/content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../../game/content/robe-awakenings.ts';

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
  awakeningAccess?(type: ItemCategory): boolean;
  awakeningProgress?(id: string, type: 'blade' | 'robe'): BladeStats | undefined;
  powersEnabled?(): boolean;
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
  const access = (type: ItemCategory) => options.awakeningAccess?.(type) ?? false;
  const powersEnabled = () => options.powersEnabled?.() ?? true;
  const awakening = (it: Item) =>
    it.type === 'blade' ? SPECIAL[it.id] : it.type === 'robe' ? ROBE_AWAKENINGS[it.id] : undefined;
  const selectedAwakening = (it: Item) =>
    access(it.type) &&
    UNL.has(it.id) &&
    UNL.has(it.id + '+') &&
    !!awakening(it) &&
    (it.type === 'blade'
      ? EQ.blade === it.id && EQ.bladeSp
      : it.type === 'robe'
        ? EQ.robe === it.id && EQ.robeSp
        : false);
  const activeAwakening = (it: Item) => selectedAwakening(it) && powersEnabled();
  // Opening a category or selecting a different tile is not explicit activation.
  let activationReady: string | null = null;
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
        activationReady = null;
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
        spU = own && access(it.type) && !!awakening(it) && UNL.has(it.id + '+'),
        aw = on && activeAwakening(it);
      b.className =
        'tile' +
        (own ? '' : ' locked') +
        (on ? ' on' : '') +
        (armSel === it.id ? ' sel' : '') +
        (aw ? ' awake' : '');
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute(
        'aria-label',
        (hid ? 'Hidden outfit or item' : it.n) + (own ? '' : ' (locked)'),
      );
      const swc = armTab === 'seal' ? SEALS[it.id] : armTab === 'charm' ? CHARMCOL[it.id] : null;
      b.innerHTML = `<span class="tk${swc ? ' sw' : ''}${it.k.length >= 4 ? ' k4' : it.k.length === 3 ? ' k3' : ''}"${swc ? ` style="background:${swc}"` : ''}>${hid ? '？' : it.k}</span><span class="tn">${hid ? 'Hidden' : (aw ? '真 ' : '') + it.n}</span>${spU ? '<span class="spb">真</span>' : ''}`;
      b.addEventListener('click', () => {
        const again = activationReady === it.id && armSel === it.id && EQ[armTab] === it.id;
        armSel = it.id;
        activationReady = own ? it.id : null;
        if (own) {
          if (armTab === 'blade') {
            if (again && spU) {
              EQ.bladeSp = !EQ.bladeSp;
              if (EQ.bladeSp && powersEnabled()) {
                events.awaken();
              }
            } else if (EQ.blade !== it.id) EQ.bladeSp = false;
          }
          if (armTab === 'robe') {
            if (again && spU) {
              EQ.robeSp = !EQ.robeSp;
              if (EQ.robeSp && powersEnabled()) events.awaken();
            } else if (EQ.robe !== it.id) EQ.robeSp = false;
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
      awk = activeAwakening(it),
      sp = awk ? awakening(it) : undefined;
    if (it.hidden && !own) {
      $('armInfo').innerHTML =
        `<div class="nm">？ Hidden<small>Secret</small></div><div class="fl">Hint: ${it.hint}</div>`;
      return;
    }
    $('armInfo').innerHTML =
      `<div class="nm">${awk ? '真 ' : ''}${it.k} ${it.n}<small>${own ? (EQ[armTab] === it.id ? 'Equipped' : '') : 'Locked'}</small></div><div class="fl">${own ? it.f : 'To unlock: ' + it.d}</div>` +
      (sp
        ? `<div class="awakening-active"><strong>Awakened active</strong><div class="pk">+ ${sp.pk}</div><div class="tr">− ${sp.tr}</div></div>`
        : (it.pk ? `<div class="pk">+ ${it.pk}</div>` : '') +
          (it.tr ? `<div class="tr">− ${it.tr}</div>` : '')) +
      spInfo(it, own);
  }
  function spInfo(it: Item, own: boolean) {
    if (!access(it.type) || !own || (it.type !== 'blade' && it.type !== 'robe')) return '';
    const sp = awakening(it);
    if (!sp) return '';
    const u = UNL.has(it.id + '+'),
      q = options.awakeningProgress
        ? options.awakeningProgress(it.id, it.type)
        : it.type === 'blade'
          ? ST.bl[it.id]
          : undefined,
      cur = Math.min(q?.[sp.need[0]] || 0, sp.need[1]);
    const st = u
      ? selectedAwakening(it)
        ? powersEnabled()
          ? 'Active. Tap again to return to normal.'
          : 'Selected, but powers are suppressed by the current setup. Base stats apply. Tap again to return to normal.'
        : EQ[it.type] === it.id
          ? 'Ready. Select this tile, then tap it again to activate.'
          : 'Equip it, then tap again to awaken it.'
      : `Challenge: ${sp.need[2]} ${it.type === 'blade' ? 'with this blade' : 'while wearing this outfit'} (${cur.toLocaleString()}/${sp.need[1].toLocaleString()}).`;
    return `<div class="spx">真 Awakening: ${st}</div>`;
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
