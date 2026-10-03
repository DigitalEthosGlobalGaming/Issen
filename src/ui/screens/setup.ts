import type { Setup } from '../../platform/saves.ts';

export interface SetupProgression {
  getMilestone(): number;
  hasVitality?(): boolean;
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
    '3': '',
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
  function hasVitality() {
    return progression?.hasVitality?.() ?? true;
  }
  function renderControls(): void {
    const arrows = root.querySelector<HTMLInputElement>('#setupArrows')!;
    const upgrades = root.querySelector<HTMLInputElement>('#setupUpgrades')!;
    arrows.checked = setup.arrows;
    upgrades.checked = setup.upgrades !== false;
    const earned = milestone();
    let changed = false;
    if (!hasVitality() && setup.lives !== '3') {
      setup.lives = '3';
      changed = true;
    }
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
    arrows.checked = setup.arrows;
    upgrades.checked = setup.upgrades !== false;
    if (changed) onChange(setup);
    const difficultyOption = root.querySelector<HTMLElement>('#difficultyOption');
    if (difficultyOption) difficultyOption.hidden = earned < 2;
    const livesOption = root.querySelector<HTMLElement>('#livesOption');
    if (livesOption) livesOption.hidden = !hasVitality();
    const arrowsOption = root.querySelector<HTMLElement>('#arrowsOption');
    if (arrowsOption) arrowsOption.hidden = earned < 3;
    arrows.disabled = earned < 3;
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
        const locked =
          requiredMilestone(key, button.dataset.v) > earned ||
          (key === 'lives' && button.dataset.v !== '3' && !hasVitality());
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
      dsUpgrades: '',
      setupLoadout: progression?.getLoadoutSummary?.() ?? '',
    })) {
      const element = root.querySelector(`#${id}`);
      if (!element) throw new Error(`Missing setup description: ${id}`);
      element.textContent = text;
      if (id === 'dsDeath' || id === 'setupLoadout') (element as HTMLElement).hidden = !text;
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
          if (key === 'lives' && value !== '3' && !hasVitality()) return;
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
  for (const [id, key] of [
    ['setupArrows', 'arrows'],
    ['setupUpgrades', 'upgrades'],
  ] as const) {
    root.querySelector<HTMLInputElement>('#' + id)!.addEventListener(
      'change',
      (event) => {
        if (key === 'arrows' && milestone() < 3) {
          renderControls();
          return;
        }
        setup[key] = (event.target as HTMLInputElement).checked;
        onChange(setup);
        renderControls();
      },
      { signal: listeners.signal },
    );
  }
  return { render, dispose: () => listeners.abort() };
}
