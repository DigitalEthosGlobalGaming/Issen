export interface AdminActions {
  testing: boolean;
  modeMilestone: number;
  trialsUnlocked: boolean;
  upgradesEnabled: boolean;
  tutorialStatus: 'new' | 'completed' | 'skipped';
  embers: number;
  currentLives: number;
  currentKnives: number;
  currentStage: number;
  currentWave: number;
  switchProfile(enabled: boolean): void;
  clearProfile?(): boolean;
  unlockAll?(): void;
  unlockRonin(): void;
  setTrialsUnlocked(enabled: boolean): void;
  jump(stage: number, wave: number, boss: boolean): void;
  restart(): void;
  item(id: string, action: 'grant' | 'remove' | 'equip'): void;
  lives(value: number): void;
  currency(value: number): void;
  resetUpgrades(): void;
  upgrades?: readonly { id: string; name: string; maxRank: number; rank: number }[];
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

/** Test-profile controls only. The runtime owns every game and save mutation. */
export function renderAdmin(
  root: HTMLElement,
  items: readonly { id: string; n: string }[],
  stages: readonly { n: string }[],
  actions: AdminActions,
): void {
  root.replaceChildren();
  const doc = root.ownerDocument;
  const heading = doc.createElement('h2');
  heading.textContent = 'Testing tools';
  root.append(heading);

  const sections = doc.createElement('div');
  sections.className = 'admin-grid';
  root.append(sections);
  const section = (title: string) => {
    const panel = doc.createElement('section');
    panel.className = 'admin-group';
    const heading = doc.createElement('h3');
    heading.textContent = title;
    panel.append(heading);
    sections.append(panel);
    return panel;
  };
  const row = (parent: HTMLElement) => {
    const controls = doc.createElement('div');
    controls.className = 'admin-actions';
    parent.append(controls);
    return controls;
  };
  let status: HTMLElement;
  const updateStatus = () => {
    status.textContent = actions.inspect();
  };
  const button = (parent: HTMLElement, label: string, action: () => void) => {
    const control = doc.createElement('button');
    control.type = 'button';
    control.className = 'btn';
    control.textContent = label;
    control.onclick = () => {
      action();
      updateStatus();
    };
    parent.append(control);
    return control;
  };
  const select = (
    parent: HTMLElement,
    label: string,
    entries: readonly { value: string; label: string }[],
    value: string,
  ) => {
    const wrap = doc.createElement('label');
    wrap.className = 'admin-field';
    wrap.textContent = label;
    const control = doc.createElement('select');
    control.setAttribute('aria-label', label);
    for (const entry of entries) {
      const option = doc.createElement('option');
      option.value = entry.value;
      option.textContent = entry.label;
      control.append(option);
    }
    control.value = value;
    wrap.append(control);
    parent.append(wrap);
    return control;
  };
  const number = (parent: HTMLElement, label: string, value: number, max: number) => {
    const wrap = doc.createElement('label');
    wrap.className = 'admin-field';
    wrap.textContent = label;
    const control = doc.createElement('input');
    control.type = 'number';
    control.min = '0';
    control.max = String(max);
    control.value = String(value);
    control.setAttribute('aria-label', label);
    wrap.append(control);
    parent.append(wrap);
    return control;
  };
  const checkbox = (
    parent: HTMLElement,
    label: string,
    checked: boolean,
    change: (value: boolean) => void,
  ) => {
    const wrap = doc.createElement('label');
    wrap.className = 'admin-check';
    const control = doc.createElement('input');
    control.type = 'checkbox';
    control.checked = checked;
    control.setAttribute('aria-label', label);
    const caption = doc.createElement('span');
    caption.textContent = label;
    wrap.append(control, caption);
    control.onchange = () => {
      change(control.checked);
      updateStatus();
    };
    parent.append(wrap);
    return control;
  };

  const profile = section('Profile');
  const note = doc.createElement('p');
  note.textContent = actions.testing
    ? 'TEST PROFILE · Player saves are separate.'
    : 'Enter the test profile to use these controls.';
  profile.append(note);
  button(profile, actions.testing ? 'Return to player profile' : 'Enter test profile', () =>
    actions.switchProfile(!actions.testing),
  );
  const details = doc.createElement('details');
  details.className = 'admin-debug';
  const summary = doc.createElement('summary');
  summary.textContent = 'Current state';
  status = doc.createElement('pre');
  status.className = 'admin-status';
  status.setAttribute('aria-live', 'polite');
  updateStatus();
  details.append(summary, status);
  profile.append(details);
  if (!actions.testing) return;

  const clear = button(profile, 'Clear test profile', () => {
    confirmClear.hidden = false;
  });
  clear.classList.add('danger');
  const confirmClear = doc.createElement('div');
  confirmClear.className = 'admin-confirm';
  confirmClear.hidden = true;
  const warning = doc.createElement('p');
  warning.textContent = 'Delete all test progress? Player saves stay intact.';
  confirmClear.append(warning);
  button(confirmClear, 'Confirm clear test profile', () => {
    if (!actions.clearProfile?.()) status.textContent = 'Could not clear the test profile.';
  });
  button(confirmClear, 'Cancel', () => {
    confirmClear.hidden = true;
  });
  profile.append(confirmClear);

  const access = section('Modes & Trials');
  const milestone = select(
    access,
    'Mode access',
    [
      { value: '0', label: 'Waves only' },
      { value: '1', label: 'Boss Rush' },
      { value: '2', label: 'Ronin' },
      { value: '3', label: 'Blade Only' },
    ],
    String(actions.modeMilestone),
  );
  milestone.onchange = () => {
    actions.milestone(Number(milestone.value));
    updateStatus();
  };
  const accessActions = row(access);
  button(accessActions, 'Unlock Ronin mode', () => {
    actions.unlockRonin();
    milestone.value = String(Math.max(2, Number(milestone.value)));
  });
  checkbox(access, 'Trials unlocked', actions.trialsUnlocked, (enabled) => {
    actions.setTrialsUnlocked(enabled);
    if (enabled) milestone.value = String(Math.max(2, Number(milestone.value)));
  });
  button(accessActions, 'Replay unlock reveals', actions.replayReveals);

  const encounter = section('Encounter');
  const stage = select(
    encounter,
    'Stage',
    stages.map((entry, index) => ({ value: String(index), label: entry.n })),
    String(actions.currentStage),
  );
  const wave = select(
    encounter,
    'Wave within stage',
    [1, 2, 3].map((value) => ({ value: String(value), label: String(value) })),
    String(((Math.max(1, actions.currentWave) - 1) % 3) + 1),
  );
  const encounterActions = row(encounter);
  button(encounterActions, 'Jump to wave', () =>
    actions.jump(Number(stage.value), Number(wave.value), false),
  );
  button(encounterActions, 'Jump to boss', () => actions.jump(Number(stage.value), 3, true));
  button(encounterActions, 'Restart encounter', actions.restart);
  const lives = number(encounter, 'Lives', actions.currentLives, 99);
  button(encounter, 'Set lives', () => actions.lives(Number(lives.value)));
  const knives = number(encounter, 'Knife charges', actions.currentKnives, 3);
  button(encounter, 'Set knife charges', () => actions.setKnives?.(Number(knives.value)));

  const equipment = section('Armoury & Awakenings');
  const item = select(
    equipment,
    'Item or awakening',
    items.map((entry) => ({ value: entry.id, label: entry.n })),
    items[0]?.id ?? '',
  );
  const equipmentActions = row(equipment);
  for (const action of ['grant', 'remove', 'equip'] as const)
    button(equipmentActions, `${action[0]!.toUpperCase()}${action.slice(1)} item`, () =>
      actions.item(item.value, action),
    );
  button(equipmentActions, 'Complete selected awakening challenge', () =>
    actions.completeChallenge?.(item.value),
  );
  button(equipmentActions, 'Unlock all', () => actions.unlockAll?.());

  const temple = section('Temple');
  const currency = number(temple, 'Ember balance', actions.embers, 1000000);
  button(temple, 'Set Embers', () => actions.currency(Number(currency.value)));
  const upgrades = (actions.upgrades ?? []).map((entry) => ({ ...entry }));
  const upgrade = select(
    temple,
    'Permanent upgrade',
    upgrades.map((entry) => ({ value: entry.id, label: entry.name })),
    upgrades[0]?.id ?? '',
  );
  const rank = number(temple, 'Upgrade rank', upgrades[0]?.rank ?? 0, 3);
  upgrade.onchange = () => {
    rank.value = String(upgrades.find((entry) => entry.id === upgrade.value)?.rank ?? 0);
    rank.max = String(upgrades.find((entry) => entry.id === upgrade.value)?.maxRank ?? 3);
  };
  button(temple, 'Set upgrade rank', () => {
    actions.setUpgrade?.(upgrade.value, Number(rank.value));
    const selected = upgrades.find((entry) => entry.id === upgrade.value);
    if (selected) selected.rank = Math.max(0, Math.min(selected.maxRank, Number(rank.value)));
  });
  button(temple, 'Reset test Temple upgrades', () => {
    actions.resetUpgrades();
    for (const entry of upgrades) entry.rank = 0;
    rank.value = '0';
  });
  checkbox(temple, 'Permanent upgrades next run', actions.upgradesEnabled, (enabled) =>
    actions.setUpgradesEnabled?.(enabled),
  );

  const onboarding = section('Onboarding');
  const tutorial = select(
    onboarding,
    'Tutorial status',
    ['new', 'completed', 'skipped'].map((value) => ({ value, label: value })),
    actions.tutorialStatus,
  );
  tutorial.onchange = () => {
    actions.tutorial(tutorial.value as 'new' | 'completed' | 'skipped');
    updateStatus();
  };
  button(row(onboarding), 'Replay tutorial', actions.replayTutorial);
}
