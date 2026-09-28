import {
  TEMPLATE_UPGRADES,
  purchaseUpgrade,
  type MetaProgress,
  type UpgradeId,
} from '../../game/progression/meta.ts';

export function renderTemplate(root: HTMLElement, meta: MetaProgress, save: () => void): void {
  root.replaceChildren();
  const balance = document.createElement('p');
  balance.textContent = `${meta.embers} Embers`;
  const note = document.createElement('p');
  note.textContent = 'Offer Embers for lasting strength.';
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
    const blocked = !!upgrade.requires && meta.upgrades[upgrade.requires] < 1;
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
    state.textContent = cost === undefined ? 'Max' : String(cost);
    tile.dataset.state = blocked
      ? 'locked'
      : cost === undefined
        ? 'max'
        : meta.embers >= cost
          ? 'affordable'
          : 'unaffordable';
    tile.append(illustration(upgrade.id), name, owned, state);
    tile.onclick = () => {
      root.dataset.selectedUpgrade = upgrade.id;
      renderTemplate(root, meta, save);
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
    buy.textContent = blocked
      ? 'Requires Throwing Knife'
      : cost === undefined
        ? 'Fully donated'
        : `Donate ${cost} Embers`;
    buy.disabled = blocked || cost === undefined || meta.embers < cost;
    buy.onclick = () => {
      if (purchaseUpgrade(meta, upgrade.id)) {
        save();
        renderTemplate(root, meta, save);
        root.querySelector<HTMLElement>('.template-detail')?.focus();
      }
    };
    card.append(illustration(upgrade.id), title, description);
    if (rank > 0) card.append(current);
    if (rank < upgrade.maxRank) card.append(next);
    card.append(buy);
    details.append(card);
  }
}

function effectText(id: UpgradeId, rank: number): string {
  switch (id) {
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
        ? `${rank} starting throwing ${rank === 1 ? 'knife' : 'knives'}`
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
const illustrations: Record<UpgradeId, string> = {
  vitality: '<path d="M48 77C8 52 14 20 34 24L48 35L62 24C83 20 88 52 48 77Z"/>',
  focus:
    '<circle cx="48" cy="48" r="29"/><circle cx="48" cy="48" r="10"/><path d="M48 9V25M48 71V87M9 48H25M71 48H87"/>',
  offerings: '<path d="M15 38H81M22 26H74M29 38V79M67 38V79M21 79H75M35 61H61M40 61V50H56V61"/>',
  awakening: '<path d="M48 11L57 36L84 48L57 59L48 85L37 59L12 48L37 36Z"/>',
  knife: '<path d="M19 78L35 59L41 65L25 84ZM35 59L70 16L77 11L78 21L41 65M29 52L49 71"/>',
  composure: '<path d="M48 13L77 25V49Q73 72 48 84Q23 72 19 49V25ZM31 49L43 61L66 36"/>',
  recovery: '<path d="M74 39A29 29 0 1 0 73 65M74 20V39H55M48 34V64M33 49H63"/>',
};
function illustration(id: UpgradeId): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 96 96');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = illustrations[id];
  return svg;
}
