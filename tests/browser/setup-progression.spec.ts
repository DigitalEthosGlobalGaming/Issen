import { expect, test } from '@playwright/test';

test('setup toggles permanent power, retains Normal save identifier and refreshes the resolved loadout', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  const result = await page.evaluate(async () => {
    const path = '/src/ui/screens/setup.ts';
    const { createSetupScreen } = await import(path);
    const root = document.querySelector('#setup')!.cloneNode(true) as HTMLElement;
    const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: true };
    let saves = 0;
    const controller = createSetupScreen(root, setup, () => saves++, {
      getMilestone: () => 3,
      getReveals: () => [],
      onRevealed() {},
      getLoadoutSummary: () =>
        setup.upgrades ? 'Starting lives: 5 · Knives: 3' : 'Starting lives: 2 · Knives: 0',
    });
    controller.render();
    const text = (id: string) => root.querySelector(id)!.textContent;
    const normalLabel = text('[data-k="lives"] [data-v="3"]');
    const before = text('#setupLoadout');
    root.querySelector<HTMLButtonElement>('[data-k="upgrades"] [data-v="0"]')!.click();
    const after = text('#setupLoadout');
    const off = root
      .querySelector('[data-k="upgrades"] [data-v="0"]')!
      .getAttribute('aria-pressed');
    root.querySelector<HTMLButtonElement>('[data-k="mode"] [data-v="rush"]')!.click();
    root.querySelector<HTMLButtonElement>('[data-k="upgrades"] [data-v="1"]')!.click();
    const excluded = text('#dsUpgrades');
    controller.dispose();
    return { normalLabel, before, after, off, excluded, saves, lives: setup.lives };
  });
  expect(result).toEqual({
    normalLabel: 'Normal lives',
    before: 'Starting lives: 5 · Knives: 3',
    after: 'Starting lives: 2 · Knives: 0',
    off: 'true',
    excluded: 'This mode disables Temple upgrades.',
    saves: 3,
    lives: '3',
  });
});

test('setup hides locked options, sanitizes stale selections, and reveals each earned mode once', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#app').waitFor();
  const result = await page.evaluate(async () => {
    const path = '/src/ui/screens/setup.ts';
    const { createSetupScreen } = await import(path);
    const root = document.querySelector('#setup')!.cloneNode(true) as HTMLElement;
    const setup = { mode: 'rush', diff: 'ronin', arrows: false, lives: '3' };
    let milestone = 0,
      vitality = false,
      seen = 0,
      saves = 0,
      sounds = 0;
    const catalog = [
      { milestone: 1, id: 'rush', name: 'Boss Rush', description: 'Face a sequence of duels.' },
      { milestone: 2, id: 'ronin', name: 'Ronin', description: 'Faster foes, double score.' },
      {
        milestone: 3,
        id: 'bladeOnly',
        name: 'Blade Only',
        description: 'Read the blade without arrows.',
      },
    ];
    const controller = createSetupScreen(root, setup, () => saves++, {
      getMilestone: () => milestone,
      hasVitality: () => vitality,
      getReveals: () =>
        catalog.filter((entry) => entry.milestone > seen && entry.milestone <= milestone),
      onRevealed: () => {
        seen = milestone;
      },
      onRevealSound: () => sounds++,
    });
    const option = (key: string, value: string) =>
      root.querySelector<HTMLButtonElement>(`[data-k="${key}"] [data-v="${value}"]`)!;
    controller.render();
    const initial = { ...setup };
    if (!root.querySelector('#difficultyOption')!.hasAttribute('hidden'))
      throw new Error('Difficulty shown before Ronin unlock');
    if (!root.querySelector('#livesOption')!.hasAttribute('hidden'))
      throw new Error('Lives shown before Vitality unlock');
    const locked = [option('mode', 'rush'), option('diff', 'ronin'), option('arrows', '0')];
    if (locked.some((button) => !button.hidden || !button.disabled))
      throw new Error('Locked option visible or enabled');
    // Even synthetic dispatch must not bypass the gameplay lock.
    option('mode', 'rush').dispatchEvent(new Event('click'));
    if (setup.mode !== 'waves') throw new Error('Locked mode selected');
    milestone = 1;
    controller.render();
    if (option('mode', 'rush').hidden || !option('diff', 'ronin').hidden)
      throw new Error('First milestone gates incorrect');
    if (root.querySelectorAll('.setup-reveal').length !== 1)
      throw new Error('Missing first reveal');
    option('mode', 'rush').click();
    if (setup.mode !== 'rush' || root.querySelectorAll('.setup-reveal').length !== 1)
      throw new Error('Selection loses reveal');
    controller.render();
    if (root.querySelectorAll('.setup-reveal').length) throw new Error('Reveal repeated');
    milestone = 3;
    vitality = true;
    controller.render();
    if (root.querySelector('#difficultyOption')!.hasAttribute('hidden'))
      throw new Error('Difficulty hidden after Ronin unlock');
    if (root.querySelector('#livesOption')!.hasAttribute('hidden'))
      throw new Error('Lives hidden after Vitality unlock');
    const pending = [...root.querySelectorAll('.setup-reveal strong')].map(
      (entry) => entry.textContent,
    );
    if (locked.some((button) => button.hidden || button.disabled))
      throw new Error('Earned option still locked');
    controller.render();
    if (root.querySelectorAll('.setup-reveal').length) throw new Error('Multiple reveals repeated');
    controller.dispose();
    option('mode', 'waves').click();
    return { initial, pending, sounds, saves, seen, finalMode: setup.mode };
  });
  expect(result).toEqual({
    initial: { mode: 'waves', diff: 'normal', arrows: true, lives: '3' },
    pending: ['Unlocked · Ronin', 'Unlocked · Blade Only'],
    sounds: 2,
    saves: 2,
    seen: 3,
    finalMode: 'rush',
  });
});

test('setup reveals respect reduced motion and legacy controller callers retain all modes', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#app').waitFor();
  const result = await page.evaluate(async () => {
    const path = '/src/ui/screens/setup.ts';
    const { createSetupScreen } = await import(path);
    const root = document.querySelector('#setup')!.cloneNode(true) as HTMLElement;
    document.body.append(root);
    const setup = { mode: 'rush', diff: 'ronin', arrows: false, lives: '3' };
    const legacy = createSetupScreen(root, setup, () => {});
    legacy.render();
    const hidden = root.querySelectorAll('.seg button[hidden]').length;
    legacy.dispose();
    const controller = createSetupScreen(root, setup, () => {}, {
      getMilestone: () => 3,
      getReveals: () => [{ id: 'rush', milestone: 1, name: 'Boss Rush', description: 'Duels' }],
      onRevealed() {},
    });
    controller.render();
    const card = root.querySelector('.setup-reveal')!;
    const animation = getComputedStyle(card).animationName;
    const glint = getComputedStyle(card, '::after').display;
    controller.dispose();
    root.remove();
    return { hidden, animation, glint, mode: setup.mode };
  });
  expect(result).toEqual({ hidden: 0, animation: 'none', glint: 'none', mode: 'rush' });
});
