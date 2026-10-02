import { trialAccessible } from '../../platform/editions.ts';
import { TRIALS } from '../../game/content/trials.ts';
import { trialsUnlocked } from '../../game/progression/trials.ts';
import type { TrialProgress } from '../../game/progression/trials.ts';
import { ITEM_TYPE_LABEL } from './game-over.ts';
import { createSymbolArt } from '../symbol-art.ts';
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
  backToTitle: () => void,
  premiumAccess = false,
): void {
  const doc = root.ownerDocument;
  const unlocked = trialsUnlocked(roninWave);
  root.querySelector('#trialsAccess')!.textContent = unlocked
    ? `Trials · ${progress.completed.length}/${TRIALS.length} complete`
    : `Ronin wave 10 required · ${Math.floor(roninWave)}/10`;
  const outcome = root.querySelector<HTMLElement>('#trialResult')!;
  root.classList.toggle('trial-failed', !!result && !result.passed);
  outcome.replaceChildren();
  outcome.hidden = !result;
  if (result) {
    const trial = TRIALS.find((entry) => entry.id === result.id)!;
    const heading = doc.createElement('h3');
    heading.textContent = `${result.passed ? 'Complete' : 'Failed'} · ${trial.name}`;
    const message = doc.createElement('p');
    message.textContent = result.message;
    const reward = doc.createElement('p');
    reward.textContent = result.passed
      ? `${result.newlyCompleted ? 'Unlocked' : 'Earned'}: ${trial.reward.n} ${ITEM_TYPE_LABEL[trial.reward.type]}`
      : '';
    const retry = doc.createElement('button');
    retry.className = 'btn primary';
    retry.type = 'button';
    retry.textContent = 'Retry';
    retry.disabled = !unlocked || !trialAccessible(trial.id, premiumAccess);
    retry.onclick = () => start(trial.id);
    outcome.append(createSymbolArt(doc, 'trial', trial.id), heading);
    if (!result.passed) {
      const objective = doc.createElement('p');
      objective.textContent = trial.objective;
      objective.className = 'trial-result-objective';
      outcome.append(objective);
    }
    if (result.message) outcome.append(message);
    if (result.passed) outcome.append(reward);
    outcome.append(retry);
    if (!result.passed) {
      const back = doc.createElement('button');
      back.type = 'button';
      back.className = 'btn';
      back.textContent = 'Back to title';
      back.onclick = backToTitle;
      outcome.append(back);
    }
  }
  const list = root.querySelector('#trialList')!;
  list.replaceChildren();
  for (const trial of TRIALS) {
    const card = doc.createElement('section');
    card.className = 'trial-card';
    const heading = doc.createElement('h3');
    heading.textContent = `${progress.completed.includes(trial.id) ? '✓ ' : ''}${trial.name}`;
    const description = doc.createElement('p');
    description.textContent = trial.objective;
    const reward = doc.createElement('p');
    reward.className = 'trial-reward';
    reward.textContent = `Reward: ${trial.reward.n} ${ITEM_TYPE_LABEL[trial.reward.type]}`;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.dataset.trial = trial.id;
    button.textContent = !trialAccessible(trial.id, premiumAccess)
      ? 'Requires Premium'
      : !unlocked
        ? 'Locked'
        : progress.completed.includes(trial.id)
          ? 'Replay'
          : 'Begin';
    button.setAttribute('aria-label', `${button.textContent} ${trial.name}: ${trial.objective}`);
    button.disabled = !unlocked || !trialAccessible(trial.id, premiumAccess);
    button.onclick = () => start(trial.id);
    card.append(createSymbolArt(doc, 'trial', trial.id), heading, description, reward, button);
    list.append(card);
  }
  root.scrollTop = 0;
}
