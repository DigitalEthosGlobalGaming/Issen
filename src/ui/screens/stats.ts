import type { Statistics } from '../../game/progression/statistics.ts';
import { recordLabel } from '../../game/progression/modes.ts';
import { STAGES } from '../../game/content/stages.ts';

const DEATH_NAMES: Record<string, string> = {
  quit: 'Left the field',
  late: 'Too slow',
  wrong: 'Wrong cut',
  feint: 'Feinted',
  early: 'Flinched',
  lateBoss: 'Missed the glint',
};
type StatRow = readonly [value: string | number, label: string];

/** Keep destructive confirmation separate from statistics rendering. */
export function bindProfileReset(
  root: HTMLElement,
  reset: () => boolean,
  testing: boolean,
): () => void {
  const dialog = root.querySelector<HTMLDialogElement>('#resetProfileDialog')!;
  const open = root.querySelector<HTMLButtonElement>('#bResetProfile')!;
  const cancel = root.querySelector<HTMLButtonElement>('#bCancelResetProfile')!;
  const confirm = root.querySelector<HTMLButtonElement>('#bConfirmResetProfile')!;
  const error = root.querySelector<HTMLElement>('#resetProfileError')!;
  root.querySelector<HTMLElement>('#resetProfileScope')!.textContent = testing
    ? 'You are resetting the test profile. Your player profile is untouched.'
    : 'You are resetting your player profile. Your separate test profile is untouched.';
  const events = new AbortController();
  // Let the modal handle Escape/Tab, without triggering the game's shortcuts.
  dialog.addEventListener('keydown', (event) => event.stopPropagation(), { signal: events.signal });
  open.addEventListener(
    'click',
    () => {
      error.hidden = true;
      confirm.disabled = false;
      dialog.showModal();
      cancel.focus();
    },
    { signal: events.signal },
  );
  cancel.addEventListener('click', () => dialog.close(), { signal: events.signal });
  confirm.addEventListener(
    'click',
    () => {
      confirm.disabled = true;
      if (!reset()) {
        error.textContent = 'Unable to reset this profile. Please try again.';
        error.hidden = false;
        confirm.disabled = false;
      }
    },
    { signal: events.signal },
  );
  return () => {
    events.abort();
    dialog.close();
  };
}

export function formatPlayTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : `${minutes}m ${Math.floor(seconds % 60)}s`;
}

export function statisticsRows(
  stats: Statistics,
  unlocked: number,
  total: number,
): {
  summary: StatRow[];
  records: StatRow[];
} {
  const top = Object.entries(stats.deaths).sort((a, b) => b[1] - a[1])[0];
  const stage = STAGES[Math.max(0, Math.min(Math.floor(stats.furthestStage), STAGES.length - 1))];
  return {
    summary: [
      [stats.bestScore.toLocaleString(), 'Best score'],
      [stats.bestRonin.toLocaleString(), 'Best Ronin score'],
      [stats.bestWave, 'Furthest wave'],
      [stats.bestCombo, 'Longest combo'],
      [stats.bestZen, 'Longest endless combo'],
      [stats.kills.toLocaleString(), 'Foes cut down'],
      [stats.perfects.toLocaleString(), 'Perfect cuts'],
      [stats.parries, 'Parries'],
      [stats.duels, 'Duels won'],
      [stats.runs, 'Runs'],
      [formatPlayTime(stats.time), 'Time on the field'],
      [stage?.n ?? 'Unknown', 'Furthest stage'],
      [top ? (DEATH_NAMES[top[0]] ?? top[0]) : 'None yet', 'Most common end'],
      [stats.rushBest || 0, 'Most duels in a boss rush'],
      [stats.standoffs, 'Standoffs won'],
      [stats.shrines, 'Blessings taken'],
      [stats.bestPStreak, 'Longest perfect streak'],
      [`${unlocked} of ${total}`, 'Armory unlocked'],
    ],
    records: Object.entries(stats.rec).map(([key, record]) => [
      key.split('-').includes('zen') ? `${record.combo} 連` : (record.score || 0).toLocaleString(),
      recordLabel(key),
    ]),
  };
}

export function renderStatistics(
  grid: HTMLElement,
  stats: Statistics,
  unlocked: number,
  total: number,
  embersEarned?: number,
): void {
  const { summary, records } = statisticsRows(stats, unlocked, total);
  if (embersEarned !== undefined) summary.push([embersEarned.toLocaleString(), 'Embers earned']);
  const doc = grid.ownerDocument;
  const fragment = doc.createDocumentFragment();
  const append = ([value, label]: StatRow) => {
    const cell = doc.createElement('div');
    cell.className = 'stat';
    const number = doc.createElement('b');
    number.textContent = String(value);
    const caption = doc.createElement('span');
    caption.textContent = label;
    cell.append(number, caption);
    fragment.append(cell);
  };
  summary.forEach(append);
  if (records.length) {
    const heading = doc.createElement('div');
    heading.className = 'sec full';
    heading.textContent = 'Records by mode';
    fragment.append(heading);
    records.forEach(append);
  }
  grid.replaceChildren(fragment);
}
