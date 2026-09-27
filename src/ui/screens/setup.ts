import type { Setup } from '../../platform/saves.ts';

export interface SetupProgression {
  getMilestone(): number;
  getReveals(): readonly { milestone: number; id: string; name: string; description: string }[];
  onRevealed(): void;
  onRevealSound?(): void;
  getLoadoutSummary?(): string;
}

const descriptions = {
  mode: {
    waves: 'Packs, stages and duels, the full journey.',
    rush: 'Consecutive duels, with a shrine after each victory.',
  },
  diff: { normal: 'The standard path.', ronin: 'Faster blades, harder duels, double score.' },
  arrows: {
    1: 'An arrow in each ring shows which way to cut.',
    0: 'No arrows. Read the sword itself. Score ×1.5.',
  },
  lives: {
    '3': 'Two starting lives. Upgrade Vitality for up to five.',
    '0': 'One mistake ends the run. Score ×1.5.',
    zen: 'No death. Mistakes break your combo. End your run from pause.',
  },
};

export function createSetupScreen(
  root: HTMLElement,
  setup: Setup & { upgrades?: boolean },
  onChange: (setup: Setup) => void,
  progression?: SetupProgression,
) {
  const listeners = new AbortController();
  const groups = root.querySelectorAll<HTMLElement>('.seg');
  function requiredMilestone(key: string | undefined, value: string | undefined) {
    if (key === 'mode' && value === 'rush') return 1;
    if (key === 'diff' && value === 'ronin') return 2;
    if (key === 'arrows' && value === '0') return 3;
    return 0;
  }
  function milestone() {
    return progression ? Math.max(0, progression.getMilestone() || 0) : 3;
  }
  function renderControls(): void {
    const earned = milestone();
    let changed = false;
    if (earned < 1 && setup.mode === 'rush') {
      setup.mode = 'waves';
      changed = true;
    }
    if (earned < 2 && setup.diff === 'ronin') {
      setup.diff = 'normal';
      changed = true;
    }
    if (earned < 3 && !setup.arrows) {
      setup.arrows = true;
      changed = true;
    }
    if (changed) onChange(setup);
    for (const group of groups) {
      const key = group.dataset.k;
      if (
        key !== 'mode' &&
        key !== 'diff' &&
        key !== 'lives' &&
        key !== 'arrows' &&
        key !== 'upgrades'
      )
        continue;
      const current =
        key === 'arrows'
          ? setup.arrows
            ? '1'
            : '0'
          : key === 'upgrades'
            ? setup.upgrades !== false
              ? '1'
              : '0'
            : setup[key];
      for (const button of group.querySelectorAll('button')) {
        const locked = requiredMilestone(key, button.dataset.v) > earned;
        button.hidden = locked;
        button.disabled = locked;
        button.setAttribute('aria-pressed', String(button.dataset.v === current));
      }
    }
    for (const [id, text] of Object.entries({
      dsDiff: descriptions.diff[setup.diff],
      dsArrows: descriptions.arrows[setup.arrows ? 1 : 0],
      dsDeath: descriptions.lives[setup.lives],
      dsMode: descriptions.mode[setup.mode],
      dsUpgrades:
        setup.upgrades === false
          ? 'Temple and awakened powers off. Purchases stay saved.'
          : setup.mode !== 'waves' ||
              setup.diff !== 'normal' ||
              setup.lives !== '3' ||
              !setup.arrows
            ? 'This mode disables permanent gameplay upgrades.'
            : 'Purchased permanent upgrades apply to this run.',
      setupLoadout: progression?.getLoadoutSummary?.() ?? '',
    })) {
      const element = root.querySelector(`#${id}`);
      if (!element) throw new Error(`Missing setup description: ${id}`);
      element.textContent = text;
    }
  }
  function render(): void {
    renderControls();
    const list = root.querySelector<HTMLElement>('#setupReveals');
    if (!list) return;
    list.replaceChildren();
    const reveals =
      progression?.getReveals().filter((reveal) => reveal.milestone <= milestone()) ?? [];
    list.hidden = !reveals.length;
    for (const [index, reveal] of reveals.entries()) {
      const card = document.createElement('div');
      card.className = 'setup-reveal';
      card.dataset.unlock = reveal.id;
      card.style.animationDelay = `${index * 0.22}s`;
      const heading = document.createElement('strong');
      heading.textContent = `Unlocked · ${reveal.name}`;
      const description = document.createElement('p');
      description.textContent = reveal.description;
      card.append(heading, description);
      list.append(card);
    }
    if (reveals.length) {
      progression?.onRevealSound?.();
      progression?.onRevealed();
    }
  }
  for (const group of groups) {
    for (const button of group.querySelectorAll('button')) {
      button.addEventListener(
        'click',
        () => {
          const key = group.dataset.k;
          const value = button.dataset.v;
          if (requiredMilestone(key, value) > milestone()) return;
          if (key === 'mode' && (value === 'waves' || value === 'rush')) setup.mode = value;
          else if (key === 'diff' && (value === 'normal' || value === 'ronin')) setup.diff = value;
          else if (key === 'lives' && (value === '3' || value === '0' || value === 'zen'))
            setup.lives = value;
          else if (key === 'arrows' && (value === '1' || value === '0'))
            setup.arrows = value === '1';
          else if (key === 'upgrades' && (value === '1' || value === '0'))
            setup.upgrades = value === '1';
          else return;
          onChange(setup);
          renderControls();
        },
        { signal: listeners.signal },
      );
    }
  }
  return { render, dispose: () => listeners.abort() };
}
