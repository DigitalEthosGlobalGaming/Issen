import { SEVEN_DAWNS_IMAGE } from '../../rendering/crest-art.ts';
const crestUrls: Record<string, string> = {
  'seven-dawns': SEVEN_DAWNS_IMAGE,
  tomoe: new URL('../assets/world-ui-crest-tomoe.webp', import.meta.url).href,
  kikyo: new URL('../assets/world-ui-crest-kikyo.webp', import.meta.url).href,
  juji: new URL('../assets/world-ui-crest-juji.webp', import.meta.url).href,
  aoi: new URL('../assets/world-ui-crest-aoi.webp', import.meta.url).href,
  fuji: new URL('../assets/world-ui-crest-fuji.webp', import.meta.url).href,
  tsuru: new URL('../assets/world-ui-crest-tsuru.webp', import.meta.url).href,
  rokumon: new URL('../assets/world-ui-crest-rokumon.compact.png', import.meta.url).href,
};
import type { Item, ItemCategory } from '../../game/content/items.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Statistics, BladeStats } from '../../game/progression/statistics.ts';
import { SPECIAL, STEEL_THIRD } from '../../game/content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../../game/content/robe-awakenings.ts';
import { isNewArmoryItem, markArmoryItemViewed } from '../../game/progression/armory-seen.ts';
import { itemPresentation } from './item-presentation.ts';
import { createArmoryInspection } from './armory-inspection.ts';
import { confirmEmberSpend } from '../confirm-action.ts';

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
  inspectionChanged?: (expanded: boolean) => void;
  items: readonly Item[];
  equipment: Equipment;
  unlocks: ReadonlySet<string>;
  owns?(id: string): boolean;
  accessible?(id: string): boolean;
  progress?(id: string): string;
  statistics: Statistics;
  seen?: Set<string>;
  onViewed?(): void;
  seals: Readonly<Record<string, string>>;
  charms: Readonly<Record<string, string>>;
  awakeningAccess?(type: ItemCategory): boolean;
  awakeningProgress?(id: string, type: 'blade' | 'robe'): BladeStats | undefined;
  powersEnabled?(): boolean;
  awakeningPurchase?(id: string): { ready: boolean; cost: number; balance: number };
  buyAwakening?(id: string): boolean;
  events: {
    equipped(equipment: Equipment): void;
    awaken(): void;
    preview(): void;
    rendered?(): void;
  };
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
  const accessible = (id: string) => options.accessible?.(id) ?? true;
  const owns = (id: string) => accessible(id) && (options.owns?.(id) ?? UNL.has(id));
  const seen = options.seen ?? new Set<string>();
  const newItem = (item: Item) => isNewArmoryItem(item, UNL, seen);
  let armTab: ItemCategory = 'blade',
    armSel: string | null = null;
  const access = (type: ItemCategory) => options.awakeningAccess?.(type) ?? false;
  const powersEnabled = () => options.powersEnabled?.() ?? true;
  const awakening = (it: Item) =>
    it.type === 'blade' ? SPECIAL[it.id] : it.type === 'robe' ? ROBE_AWAKENINGS[it.id] : undefined;
  const selectedAwakening = (it: Item) =>
    access(it.type) &&
    owns(it.id) &&
    owns(it.id + '+') &&
    !!awakening(it) &&
    (it.type === 'blade'
      ? EQ.blade === it.id && (EQ.bladeSp || (it.id === 'steel' && EQ.bladeThird))
      : it.type === 'robe'
        ? EQ.robe === it.id && EQ.robeSp
        : false);
  const activeAwakening = (it: Item) => selectedAwakening(it) && powersEnabled();
  let detailsOpen = false;
  const tabs = $('armTabs');
  const preview = $('prevC') as HTMLCanvasElement;
  const inspection = createArmoryInspection(root, preview, options.inspectionChanged);
  const onPreview = () => {
    if (!inspection.expanded) inspection.open();
    if (armTab === 'fx') events.preview();
  };
  preview.addEventListener('click', onPreview);
  function render() {
    events.rendered?.();
    const tabScroll = tabs.scrollLeft;
    tabs.innerHTML = '';
    for (const [t, label] of ARM) {
      const all = ITEMS.filter((i) => i.type === t),
        own = all.filter((i) => owns(i.id)).length;
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(t === armTab));
      b.innerHTML = `<span class="arm-label">${label}</span><small>${own}/${all.length}</small>`;
      if (all.some(newItem)) {
        b.classList.add('arm-unread');
        b.setAttribute('aria-description', 'Unviewed equipment');
      }
      b.addEventListener('click', () => {
        armTab = t;
        armSel = null;
        $('armTiles').scrollTop = 0;
        root.querySelector<HTMLElement>('.armTop')!.scrollTop = 0;
        render();
        const selected = tabs.querySelector<HTMLButtonElement>('[aria-selected="true"]')!;
        const tr = tabs.getBoundingClientRect(),
          ar = selected.getBoundingClientRect();
        tabs.scrollLeft += ar.left - tr.left - (tr.width - ar.width) / 2;
        selected.focus({ preventScroll: true });
      });
      tabs.appendChild(b);
    }
    tabs.scrollLeft = tabScroll;
    const tiles = $('armTiles');
    const tileScroll = tiles.scrollTop;
    tiles.innerHTML = '';
    if (!armSel || ITEM_BY[armSel]?.type !== armTab) armSel = EQ[armTab];
    const category = ITEMS.filter((i) => i.type === armTab);
    for (const it of [
      ...category.filter((i) => owns(i.id)),
      ...category.filter((i) => !owns(i.id)),
    ]) {
      const own = owns(it.id),
        on = EQ[armTab] === it.id;
      const b = doc.createElement('button');
      b.type = 'button';
      const hid = it.hidden && !own,
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
      b.innerHTML = `<span class="tk${swc ? ' sw' : ''}${it.k.length >= 4 ? ' k4' : it.k.length === 3 ? ' k3' : ''}"${swc ? ` style="background:${swc}"` : ''}>${hid ? '？' : crestUrls[it.id] ? `<img class="crest-symbol" src="${crestUrls[it.id]}" alt="" />` : it.k}</span><span class="tn">${hid ? 'Hidden' : it.n}</span>${!accessible(it.id) ? '<small>Requires Premium</small>' : ''}${on ? '<span class="arm-equipped" aria-hidden="true">装</span>' : ''}${on && selectedAwakening(it) ? `<span class="arm-form-mark${aw ? '' : ' suppressed'}" aria-hidden="true">${it.id === 'steel' && EQ.bladeThird ? '極' : '真'}</span>` : ''}`;
      const states = on ? ['Equipped'] : [];
      if (on && selectedAwakening(it)) {
        states.push(it.id === 'steel' && EQ.bladeThird ? 'Third Awakening' : 'Awakened');
        if (!powersEnabled()) states.push('Powers off');
      }
      if (newItem(it)) {
        b.classList.add('arm-unread');
        states.push('Unviewed equipment');
      }
      if (states.length) b.setAttribute('aria-description', states.join(' · '));
      b.addEventListener('click', () => {
        if (armSel !== it.id) {
          root.querySelector<HTMLElement>('.armTop')!.scrollTop = 0;
        }
        armSel = it.id;
        if (markArmoryItemViewed(it.id, UNL, seen)) options.onViewed?.();
        if (own) {
          if (armTab === 'blade' && EQ.blade !== it.id) {
            EQ.bladeSp = false;
            EQ.bladeThird = false;
          }
          if (armTab === 'robe' && EQ.robe !== it.id) EQ.robeSp = false;
          EQ[armTab] = it.id;
          events.equipped(EQ);
        }
        render();
        tiles
          .querySelector<HTMLButtonElement>(`[data-item="${it.id}"]`)
          ?.focus({ preventScroll: true });
        if (armTab === 'fx') events.preview();
      });
      b.dataset.item = it.id;
      tiles.appendChild(b);
    }
    tiles.scrollTop = tileScroll;
    const it = ITEM_BY[armSel];
    if (!it) return;
    const own = owns(it.id),
      awk = activeAwakening(it),
      sp = awk ? (it.id === 'steel' && EQ.bladeThird ? STEEL_THIRD : awakening(it)) : undefined;
    const display = itemPresentation(it);
    if (it.hidden && !own) {
      $('armInfo').innerHTML =
        `<div class="nm">？ Hidden<small>Secret</small></div><div class="fl">Hint: ${it.hint}</div>`;
      return;
    }
    $('armInfo').innerHTML =
      `<div class="nm">${it.k} ${it.n}<small>${!accessible(it.id) ? 'Requires Premium' : own ? '' : 'Locked'}</small></div>` +
      spInfo(it, own) +
      (!own ? `<div class="fl">To unlock: ${display.unlockCondition}</div>` : '') +
      (sp
        ? `<div class="awakening-active">${effectLines(sp.pk, 'pk', '+')}${effectLines(sp.tr, 'tr', '−')}</div>`
        : (display.benefit ? `<div class="pk">+ ${display.benefit}</div>` : '') +
          (display.tradeoff ? `<div class="tr">− ${display.tradeoff}</div>` : '') +
          (own && it.role ? `<div class="item-role">${it.role}</div>` : '')) +
      (!own && options.progress?.(it.id)
        ? `<div class="arm-unlock-condition">${options.progress(it.id)}</div>`
        : '') +
      (own && (display.flavor || display.unlockCondition)
        ? `<details class="arm-details"${detailsOpen ? ' open' : ''}><summary>Details</summary><div class="fl">${display.flavor}</div>${display.unlockCondition ? `<div class="arm-unlock-condition">Unlocked: ${display.unlockCondition}</div>` : ''}</details>`
        : '');
    const details = root.querySelector<HTMLDetailsElement>('.arm-details');
    details?.addEventListener('toggle', () => {
      if (!root.contains(details)) return;
      detailsOpen = details.open;
      if (details.open) details.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-form]')) {
      button.addEventListener('click', async () => {
        const form = button.dataset.form;
        if (button.disabled || button.getAttribute('aria-pressed') === 'true') return;
        const id = it.id + (form === 'third' ? '++' : '+');
        if (form !== 'normal' && !owns(id)) {
          const purchase = options.awakeningPurchase?.(id);
          if (
            !purchase?.ready ||
            !(await confirmEmberSpend(
              root,
              `${it.n} ${form === 'third' ? 'third form' : 'Awakening'}`,
              purchase.cost,
              purchase.balance,
            ))
          )
            return;
          if (!options.buyAwakening?.(id)) {
            render();
            return;
          }
        }
        if (it.type === 'blade') {
          EQ.bladeSp = form === 'awakened';
          EQ.bladeThird = form === 'third';
        } else EQ.robeSp = form === 'awakened';
        events.equipped(EQ);
        if (form !== 'normal' && powersEnabled()) events.awaken();
        render();
        root
          .querySelector<HTMLButtonElement>(`[data-form="${form}"]`)
          ?.focus({ preventScroll: true });
      });
    }
  }

  function effectLines(copy: string, className: string, sign: string) {
    return copy
      .split('; ')
      .map(
        (line) =>
          `<div class="${className}">${sign} ${line.charAt(0).toUpperCase() + line.slice(1)}</div>`,
      )
      .join('');
  }
  function spInfo(it: Item, own: boolean) {
    if (!access(it.type) || !own || (it.type !== 'blade' && it.type !== 'robe')) return '';
    const sp = awakening(it);
    if (!sp) return '';
    const u = owns(it.id + '+'),
      q = options.awakeningProgress
        ? options.awakeningProgress(it.id, it.type)
        : it.type === 'blade'
          ? ST.bl[it.id]
          : undefined,
      cur = Math.min(q?.[sp.need[0]] || 0, sp.need[1]);
    const selected = selectedAwakening(it)
      ? it.id === 'steel' && EQ.bladeThird
        ? 'third'
        : 'awakened'
      : 'normal';
    const thirdUnlocked = u && owns('steel++');
    const forms = [
      ['normal', 'Normal', true],
      ['awakened', 'Awakened', u],
    ] as const;
    const button = (form: string, label: string, unlocked: boolean) => {
      const purchase =
        form === 'normal' || unlocked
          ? undefined
          : options.awakeningPurchase?.(it.id + (form === 'third' ? '++' : '+'));
      const ready = purchase?.ready && purchase.balance >= purchase.cost;
      return `<button type="button" data-form="${form}" aria-pressed="${selected === form}"${unlocked || ready ? '' : ' disabled aria-describedby="armFormChallenge"'}>${purchase?.ready ? `Buy · ${purchase.cost} Embers` : label}</button>`;
    };
    const challenge = !u
      ? `Awakening: ${sp.need[2]} ${it.type === 'blade' ? 'with this blade' : 'while wearing this outfit'} (${cur.toLocaleString()}/${sp.need[1].toLocaleString()}).`
      : it.id === 'steel' && !thirdUnlocked
        ? `Third: ${STEEL_THIRD.need[2]} with this blade (${Math.min(q?.[STEEL_THIRD.need[0]] ?? 0, STEEL_THIRD.need[1]).toLocaleString()}/${STEEL_THIRD.need[1].toLocaleString()}).`
        : '';
    return (
      `<div class="arm-forms" role="group" aria-label="${it.type === 'blade' ? 'Blade' : 'Outfit'} form">${forms.map(([form, label, unlocked]) => button(form, label, unlocked)).join('')}${it.id === 'steel' && u ? button('third', 'Third', thirdUnlocked) : ''}</div>` +
      (selected !== 'normal' && !powersEnabled()
        ? '<div class="arm-power-state">Powers off · normal effects apply</div>'
        : '') +
      (challenge ? `<div class="arm-challenge" id="armFormChallenge">${challenge}</div>` : '')
    );
  }
  return {
    render,
    get inspectionExpanded() {
      return inspection.expanded;
    },
    hasNew: () => ITEMS.some(newItem),
    get selected() {
      return armSel;
    },
    get tab() {
      return armTab;
    },
    dispose() {
      inspection.dispose();
      preview.removeEventListener('click', onPreview);
      $('armTabs').replaceChildren();
      $('armTiles').replaceChildren();
    },
  };
}
