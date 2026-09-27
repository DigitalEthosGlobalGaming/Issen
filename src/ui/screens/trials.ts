import { TRIALS } from '../../game/content/trials.ts';
import { trialsUnlocked } from '../../game/progression/trials.ts';
import type { TrialProgress } from '../../game/progression/trials.ts';
import { ITEM_TYPE_LABEL } from './game-over.ts';
import './trials.css';

export interface TrialResult {
  id: string;
  passed: boolean;
  message: string;
  newlyCompleted: boolean;
}
export function renderTrials(
  root: HTMLElement,
  progress: TrialProgress,
  roninWave: number,
  result: TrialResult | null,
  start: (id: string) => void,
): void {
  const doc = root.ownerDocument;
  const unlocked = trialsUnlocked(roninWave);
  root.querySelector('#trialsAccess')!.textContent = unlocked
    ? `${progress.completed.length} / ${TRIALS.length} completed · Master the encounter, earn its reward.`
    : `Reach wave 10 in Ronin Waves to unlock Trials. Best: ${Math.floor(roninWave)} / 10. Endless does not count.`;
  const outcome = root.querySelector<HTMLElement>('#trialResult')!;
  outcome.replaceChildren();
  outcome.hidden = !result;
  if (result) {
    const trial = TRIALS.find((entry) => entry.id === result.id)!;
    const heading = doc.createElement('h3');
    heading.textContent = `${result.passed ? 'Trial complete' : 'Try again'} · ${trial.name}`;
    const message = doc.createElement('p');
    message.textContent = result.message;
    const reward = doc.createElement('p');
    reward.textContent = result.passed
      ? `${result.newlyCompleted ? 'Unlocked' : 'Already earned'}: ${trial.reward.n} ${ITEM_TYPE_LABEL[trial.reward.type]}. Equip it in the Armoury.`
      : 'Your best attempt starts with the next cut.';
    const retry = doc.createElement('button');
    retry.className = 'btn primary';
    retry.type = 'button';
    retry.textContent = 'Retry trial';
    retry.disabled = !unlocked;
    retry.onclick = () => start(trial.id);
    outcome.append(heading, message, reward, retry);
  }
  const list = root.querySelector('#trialList')!;
  list.replaceChildren();
  for (const trial of TRIALS) {
    const card = doc.createElement('section');
    card.className = 'trial-card';
    const heading = doc.createElement('h3');
    heading.textContent = `${progress.completed.includes(trial.id) ? '✓ ' : ''}${trial.name}`;
    const description = doc.createElement('p');
    description.textContent = trial.description;
    const reward = doc.createElement('p');
    reward.className = 'trial-reward';
    reward.textContent = `${trial.reward.k} · ${trial.reward.n} · ${ITEM_TYPE_LABEL[trial.reward.type]}`;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.dataset.trial = trial.id;
    button.textContent = !unlocked
      ? 'Locked · Ronin wave 10'
      : progress.completed.includes(trial.id)
        ? 'Replay trial'
        : 'Begin trial';
    button.disabled = !unlocked;
    button.onclick = () => start(trial.id);
    card.append(heading, description, reward, button);
    list.append(card);
  }
  root.scrollTop = 0;
}
