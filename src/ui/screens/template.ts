import {
  TEMPLATE_UPGRADES,
  purchaseUpgrade,
  type MetaProgress,
  type UpgradeId,
} from '../../game/progression/meta.ts';
import { createSymbolArt } from '../symbol-art.ts';

export function templeStatus(meta: MetaProgress, premiumAccess: boolean) {
  const available = TEMPLATE_UPGRADES.filter((u) => !u.premium || premiumAccess);
  return {
    complete: available.every((u) => meta.upgrades[u.id] >= u.maxRank),
    affordable: available.filter((u) => {
      const cost = u.costs[meta.upgrades[u.id]];
      return (
        cost !== undefined && meta.embers >= cost && (!u.requires || meta.upgrades[u.requires] > 0)
      );
    }).length,
  };
}

export function renderTemplate(
  root: HTMLElement,
  meta: MetaProgress,
  save: () => void,
  premiumAccess = false,
): void {
  root.replaceChildren();
  const balance = document.createElement('p');
  balance.textContent = `${meta.embers} Embers`;
  const note = document.createElement('p');
  const status = templeStatus(meta, premiumAccess);
  note.className = 'temple-status';
  note.setAttribute('role', 'status');
  note.textContent = status.complete
    ? 'All available upgrades fully donated.'
    : status.affordable
      ? `${status.affordable} ${status.affordable === 1 ? 'upgrade' : 'upgrades'} ready to donate.`
      : 'Save more Embers for your next upgrade.';
  root.append(balance, note);
  const selected =
    TEMPLATE_UPGRADES.find((u) => u.id === root.dataset.selectedUpgrade)?.id ?? 'vitality';
  root.dataset.selectedUpgrade = selected;
  const layout = document.createElement('div');
  layout.className = 'template-layout';
  const grid = document.createElement('div');
  grid.className = 'template-grid';
  grid.setAttribute('aria-label', 'Temple upgrades');
  const details = document.createElement('div');
  details.className = 'template-details';
  layout.append(grid, details);
  root.append(layout);
  for (const upgrade of TEMPLATE_UPGRADES) {
    const rank = meta.upgrades[upgrade.id];
    const cost = upgrade.costs[rank];
    const premiumLocked = !!upgrade.premium && !premiumAccess;
    const blocked = premiumLocked || (!!upgrade.requires && meta.upgrades[upgrade.requires] < 1);
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'upgrade-tile';
    tile.dataset.upgrade = upgrade.id;
    tile.setAttribute('aria-pressed', String(selected === upgrade.id));
    const name = document.createElement('strong');
    name.textContent = upgrade.name;
    const owned = document.createElement('span');
    owned.textContent = `Rank ${rank}/${upgrade.maxRank}`;
    const state = document.createElement('span');
    state.textContent = premiumLocked
      ? 'Requires Premium'
      : cost === undefined
        ? 'Fully donated ✓'
        : blocked
          ? 'Requires Throwing Knife'
          : meta.embers >= cost
            ? `Ready · ${cost} Embers`
            : `${cost} Embers`;
    tile.dataset.state = blocked
      ? 'locked'
      : cost === undefined
        ? 'max'
        : meta.embers >= cost
          ? 'affordable'
          : 'unaffordable';
    tile.append(createSymbolArt(root.ownerDocument, 'temple', upgrade.id), name, owned, state);
    tile.onclick = () => {
      root.dataset.selectedUpgrade = upgrade.id;
      renderTemplate(root, meta, save, premiumAccess);
      root.querySelector<HTMLElement>('.template-detail')?.focus();
    };
    grid.append(tile);
    if (selected !== upgrade.id) continue;
    const card = document.createElement('article');
    card.className = 'upgrade-card template-detail';
    card.tabIndex = -1;
    const title = document.createElement('h3');
    title.textContent = `${upgrade.name} · ${rank}/${upgrade.maxRank}`;
    const description = document.createElement('p');
    description.textContent = upgrade.description;
    const current = document.createElement('p');
    const next = document.createElement('p');
    const value = (n: number) => effectText(upgrade.id, n);
    current.textContent = `Current: ${value(rank)}`;
    if (rank < upgrade.maxRank) next.textContent = `Next: ${value(rank + 1)}`;
    const buy = document.createElement('button');
    buy.className = 'btn';
    buy.textContent = premiumLocked
      ? 'Requires Premium'
      : blocked
        ? 'Requires Throwing Knife'
        : cost === undefined
          ? 'Fully donated'
          : `Donate ${cost} Embers`;
    buy.disabled = blocked || cost === undefined || meta.embers < cost;
    buy.onclick = () => {
      if (purchaseUpgrade(meta, upgrade.id, premiumAccess)) {
        save();
        renderTemplate(root, meta, save, premiumAccess);
        root.querySelector<HTMLElement>('.template-detail')?.focus();
      }
    };
    card.append(createSymbolArt(root.ownerDocument, 'temple', upgrade.id), title, description);
    if (rank > 0) card.append(current);
    if (rank < upgrade.maxRank) card.append(next);
    card.append(buy);
    details.append(card);
  }
}

function effectText(id: UpgradeId, rank: number): string {
  switch (id) {
    case 'precision':
      return rank ? `Perfect-action windows ${rank * 5}% wider` : 'Standard perfect-action windows';
    case 'discernment':
      return rank ? 'One Shrine reroll per run' : 'No Shrine rerolls';
    case 'vitality':
      return `${2 + rank} starting lives`;
    case 'focus':
      return rank ? `Duel parry window ${rank * 5}% longer` : 'Standard duel parry window';
    case 'offerings':
      return rank >= 3
        ? '+1 Shrine choice, +20 percentage points rare chance and 1 guaranteed rare when available'
        : rank === 2
          ? '+1 Shrine choice and +20 percentage points rare chance'
          : rank === 1
            ? '+1 Shrine choice'
            : 'Standard Shrine choices';
    case 'awakening':
      return rank >= 2
        ? 'Blade and Outfit Awakening challenges'
        : rank === 1
          ? 'Blade Awakening challenges'
          : 'Awakening challenges locked';
    case 'knife':
      return rank
        ? `${rank} throwing ${rank === 1 ? 'knife' : 'knives'} · refill every duel`
        : 'No throwing knives';
    case 'composure':
      return rank
        ? `${rank} combo ${rank === 1 ? 'break' : 'breaks'} forgiven per run`
        : 'No combo protection';
    case 'recovery':
      return rank
        ? `Restore 1 life every ${rank === 1 ? 6 : 3} cleared waves`
        : 'No wave-clear recovery';
  }
}
