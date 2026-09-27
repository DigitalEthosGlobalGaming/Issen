import type { Setup } from '../../platform/saves.ts';

const descriptions = {
  mode: {
    waves: 'Packs, stages and duels, the full journey.',
    rush: 'Only duels, one boss after another, with a shrine after every victory.',
  },
  diff: { normal: 'The standard path.', ronin: 'Faster blades, harder duels, double score.' },
  arrows: {
    1: 'An arrow in each ring shows which way to cut.',
    0: 'No arrows. Read the sword itself. Score ×1.5.',
  },
  lives: {
    '3': 'Three mistakes end the run.',
    '0': 'One mistake ends the run. Score ×1.5.',
    zen: 'You cannot die. A mistake breaks your combo. Chase the longest chain, and end the run from pause.',
  },
};

export function createSetupScreen(
  root: HTMLElement,
  setup: Setup,
  onChange: (setup: Setup) => void,
) {
  const listeners = new AbortController();
  const groups = root.querySelectorAll<HTMLElement>('.seg');
  function render(): void {
    for (const group of groups) {
      const key = group.dataset.k;
      if (key !== 'mode' && key !== 'diff' && key !== 'lives' && key !== 'arrows') continue;
      const current = key === 'arrows' ? (setup.arrows ? '1' : '0') : setup[key];
      for (const button of group.querySelectorAll('button')) {
        button.setAttribute('aria-pressed', String(button.dataset.v === current));
      }
    }
    for (const [id, text] of Object.entries({
      dsDiff: descriptions.diff[setup.diff],
      dsArrows: descriptions.arrows[setup.arrows ? 1 : 0],
      dsDeath: descriptions.lives[setup.lives],
      dsMode: descriptions.mode[setup.mode],
    })) {
      const element = root.querySelector(`#${id}`);
      if (!element) throw new Error(`Missing setup description: ${id}`);
      element.textContent = text;
    }
  }
  for (const group of groups) {
    for (const button of group.querySelectorAll('button')) {
      button.addEventListener(
        'click',
        () => {
          const key = group.dataset.k;
          const value = button.dataset.v;
          if (key === 'mode' && (value === 'waves' || value === 'rush')) setup.mode = value;
          else if (key === 'diff' && (value === 'normal' || value === 'ronin')) setup.diff = value;
          else if (key === 'lives' && (value === '3' || value === '0' || value === 'zen'))
            setup.lives = value;
          else if (key === 'arrows' && (value === '1' || value === '0'))
            setup.arrows = value === '1';
          else return;
          onChange(setup);
          render();
        },
        { signal: listeners.signal },
      );
    }
  }
  return { render, dispose: () => listeners.abort() };
}
