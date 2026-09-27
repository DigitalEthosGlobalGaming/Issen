export interface AdminActions {
  testing: boolean;
  switchProfile(enabled: boolean): void;
  clearProfile?(): boolean;
  unlockAll?(): void;
  jump(stage: number, wave: number, boss: boolean): void;
  restart(): void;
  item(id: string, action: 'grant' | 'remove' | 'equip'): void;
  lives(value: number): void;
  currency(value: number): void;
  resetUpgrades(): void;
  upgrades?: readonly { id: string; name: string; maxRank: number }[];
  setUpgrade?(id: string, rank: number): void;
  setKnives?(value: number): void;
  setUpgradesEnabled?(enabled: boolean): void;
  completeChallenge?(id: string): void;
  milestone(value: number): void;
  tutorial(value: 'new' | 'completed' | 'skipped'): void;
  replayTutorial(): void;
  replayReveals(): void;
  inspect(): string;
}

export function renderAdmin(
  root: HTMLElement,
  items: readonly { id: string; n: string }[],
  stages: readonly { n: string }[],
  actions: AdminActions,
): void {
  root.replaceChildren();
  const text = (tag: string, value: string) => {
    const el = document.createElement(tag);
    el.textContent = value;
    root.append(el);
    return el;
  };
  const button = (label: string, action: () => void) => {
    const el = document.createElement('button');
    el.className = 'btn';
    el.textContent = label;
    el.onclick = () => {
      action();
      status.textContent = actions.inspect();
    };
    root.append(el);
    return el;
  };
  text('h2', 'Testing tools');
  text(
    'p',
    actions.testing
      ? 'TEST PROFILE — all saves and records are isolated from your player profile.'
      : 'Enter an isolated test profile to use these controls. Your player saves stay in place. Switching profiles reloads the game.',
  );
  const status = text('pre', actions.inspect());
  status.className = 'admin-status';
  status.setAttribute('aria-live', 'polite');
  button(actions.testing ? 'Return to player profile' : 'Enter test profile', () =>
    actions.switchProfile(!actions.testing),
  );
  if (!actions.testing) return;
  const reset = document.createElement('div');
  const prompt = document.createElement('p');
  prompt.textContent =
    'Delete all test progress, equipment and settings? Your player profile will not change.';
  const confirm = document.createElement('button');
  confirm.className = 'btn';
  confirm.textContent = 'Confirm clear test profile';
  confirm.onclick = () => {
    if (!actions.clearProfile?.())
      status.textContent = 'Could not clear the test profile. Please try again.';
  };
  const cancel = document.createElement('button');
  cancel.className = 'btn';
  cancel.textContent = 'Cancel';
  cancel.onclick = () => {
    reset.hidden = true;
  };
  reset.append(prompt, confirm, cancel);
  reset.hidden = true;
  button('Clear test profile', () => {
    reset.hidden = false;
  });
  root.append(reset);
  button('Unlock all', () => actions.unlockAll?.());
  text(
    'p',
    'Unlock every Armoury item and awakened form. Temple upgrades and equipped items stay unchanged. Awakening access is still required.',
  );
  const select = (label: string, entries: readonly { value: string; label: string }[]) => {
    const wrap = document.createElement('label');
    wrap.textContent = label;
    const el = document.createElement('select');
    el.setAttribute('aria-label', label);
    for (const entry of entries) {
      const o = document.createElement('option');
      o.value = entry.value;
      o.textContent = entry.label;
      el.append(o);
    }
    wrap.append(el);
    root.append(wrap);
    return el;
  };
  const number = (label: string, value: number, max: number) => {
    const wrap = document.createElement('label');
    wrap.textContent = label;
    const el = document.createElement('input');
    el.type = 'number';
    el.min = '0';
    el.max = String(max);
    el.value = String(value);
    el.setAttribute('aria-label', label);
    wrap.append(el);
    root.append(wrap);
    return el;
  };
  const stage = select(
    'Stage',
    stages.map((s, i) => ({ value: String(i), label: s.n })),
  );
  const wave = select(
    'Wave within stage',
    [1, 2, 3].map((n) => ({ value: String(n), label: String(n) })),
  );
  button('Jump to wave', () => actions.jump(Number(stage.value), Number(wave.value), false));
  button('Jump to boss', () => actions.jump(Number(stage.value), 3, true));
  button('Restart encounter', actions.restart);
  const item = select(
    'Item or awakening',
    items.map((i) => ({ value: i.id, label: i.n })),
  );
  for (const action of ['grant', 'remove', 'equip'] as const)
    button(`${action[0]!.toUpperCase()}${action.slice(1)} item`, () =>
      actions.item(item.value, action),
    );
  button('Complete selected awakening challenge', () => actions.completeChallenge?.(item.value));
  const lives = number('Lives', 2, 5);
  button('Set lives', () => actions.lives(Number(lives.value)));
  const currency = number('Ember balance', 1000, 1000000);
  button('Set Embers', () => actions.currency(Number(currency.value)));
  button('Reset test Temple upgrades', actions.resetUpgrades);
  const upgrade = select(
    'Permanent upgrade',
    (actions.upgrades ?? []).map((u) => ({ value: u.id, label: u.name })),
  );
  const rank = number('Upgrade rank', 1, 3);
  button('Set upgrade rank', () => actions.setUpgrade?.(upgrade.value, Number(rank.value)));
  const knives = number('Knife charges', 1, 3);
  button('Set knife charges', () => actions.setKnives?.(Number(knives.value)));
  const enabled = select('Next run permanent upgrades', [
    { value: '1', label: 'On' },
    { value: '0', label: 'Off' },
  ]);
  button('Set upgrades for next run', () => actions.setUpgradesEnabled?.(enabled.value === '1'));
  const milestone = select(
    'Boss milestone',
    [0, 1, 2, 3].map((n) => ({ value: String(n), label: String(n) })),
  );
  button('Set mode unlocks', () => actions.milestone(Number(milestone.value)));
  const tutorial = select(
    'Tutorial status',
    ['new', 'completed', 'skipped'].map((value) => ({ value, label: value })),
  );
  button('Set tutorial status', () =>
    actions.tutorial(tutorial.value as 'new' | 'completed' | 'skipped'),
  );
  button('Replay tutorial', actions.replayTutorial);
  button('Replay unlock reveals', actions.replayReveals);
}
