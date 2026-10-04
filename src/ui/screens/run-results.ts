import {
  activeNow,
  pageActive,
  requestActiveFrame,
  cancelActiveFrame,
  activeTimeout,
  clearActiveTimeout,
} from '../../platform/activity.ts';
import type { RewardSettlement } from '../../game/progression/run-rewards.ts';

export interface ResultReveal {
  key: string;
  name: string;
  kind: string;
  description: string;
  benefit?: string;
  tradeoff?: string;
  item?: boolean;
}

export interface RunResults {
  start(
    reward: RewardSettlement,
    reveals: readonly ResultReveal[],
    done: () => void,
    doubleEmbers?: () => Promise<RewardSettlement | null>,
    extraEmbers?: number,
  ): void;
  startUnlocks(reveals: readonly ResultReveal[], done: () => void): void;
  dispose(): void;
}

/** A presentation-only sequence. Rewards and unlocks must already be settled. */
export function createRunResults(
  root: HTMLElement,
  onUnlock?: () => void,
  reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches,
): RunResults {
  const sequence = root.querySelector<HTMLElement>('#runResultSequence');
  const summary = root.querySelector<HTMLElement>('#overSummary');
  const number = root.querySelector<HTMLElement>('#resultEmbers');
  const gain = root.querySelector<HTMLElement>('#resultGain');
  const label = root.querySelector<HTMLElement>('#resultLabel');
  const kind = root.querySelector<HTMLElement>('#resultKind');
  const description = root.querySelector<HTMLElement>('#resultDescription');
  const glyph = root.querySelector<HTMLElement>('.result-flame');
  const benefit = root.querySelector<HTMLElement>('#resultBenefit');
  const tradeoff = root.querySelector<HTMLElement>('#resultTradeoff');
  const accessible = root.querySelector<HTMLElement>('#resultAccessible');
  if (
    !sequence ||
    !summary ||
    !number ||
    !gain ||
    !label ||
    !kind ||
    !description ||
    !accessible ||
    !glyph ||
    !benefit ||
    !tradeoff
  )
    throw new Error('Missing run result sequence element');

  let reward: RewardSettlement = { before: 0, gained: 0, after: 0 };
  let reveals: readonly ResultReveal[] = [];
  let step = 0;
  let animating = false;
  let frame = 0;
  let timeout = 0;
  let onDone: (() => void) | null = null;
  let doubleEmbers: (() => Promise<RewardSettlement | null>) | undefined;
  let bonusBusy = false;
  const rewardActions = root.ownerDocument.createElement('div');
  rewardActions.className = 'result-reward-actions';
  rewardActions.hidden = true;
  const doubleButton = root.ownerDocument.createElement('button');
  doubleButton.type = 'button';
  doubleButton.className = 'btn primary';
  const continueButton = root.ownerDocument.createElement('button');
  continueButton.type = 'button';
  continueButton.className = 'btn';
  continueButton.textContent = 'Continue';
  rewardActions.append(doubleButton, continueButton);
  sequence.append(rewardActions);
  const updateActions = () => {
    rewardActions.hidden = step !== 0 || animating || !doubleEmbers;
    sequence.querySelector<HTMLElement>('.result-next')!.hidden = !rewardActions.hidden;
    sequence.setAttribute('role', rewardActions.hidden ? 'button' : 'group');
  };
  const clearMotion = () => {
    cancelActiveFrame(frame);
    clearActiveTimeout(timeout);
  };
  const finishAnimation = () => {
    clearMotion();
    animating = false;
    sequence.classList.remove('animating');
    if (step === 0) {
      glyph.textContent = '火';
      benefit.hidden = tradeoff.hidden = true;
      number.textContent = reward.after.toLocaleString();
      gain.hidden = true;
      accessible.textContent = `${reward.gained} Embers earned. ${reward.after} available.`;
    }
    updateActions();
  };
  const showStep = () => {
    clearMotion();
    if (step > reveals.length) {
      sequence.hidden = true;
      summary.hidden = false;
      onDone?.();
      onDone = null;
      return;
    }
    sequence.classList.toggle('show-unlock', step > 0);
    sequence.classList.remove('animating');
    void sequence.offsetWidth;
    animating = !reduceMotion() && (step > 0 || reward.gained > 0);
    sequence.classList.toggle('animating', animating);
    updateActions();
    if (step === 0) {
      glyph.textContent = '火';
      benefit.hidden = tradeoff.hidden = true;
      sequence.classList.toggle('has-gain', reward.gained > 0);
      label.textContent = 'Embers gathered';
      kind.textContent = '';
      description.textContent = reward.gained
        ? 'Your journey feeds the Temple flame.'
        : 'No Embers gathered this run.';
      gain.textContent = reward.gained ? `+${reward.gained.toLocaleString()}` : '+0';
      gain.hidden = reward.gained === 0;
      number.textContent = reward.before.toLocaleString();
      accessible.textContent = `${reward.before} Embers before this run.`;
      if (animating) {
        const start = activeNow();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / 1450);
          const fuel = Math.min(1, Math.max(0, (progress - 0.46) / 0.46));
          number.textContent = Math.floor(
            reward.before + reward.gained * (1 - (1 - fuel) ** 3),
          ).toLocaleString();
          if (progress < 1) frame = requestActiveFrame(tick);
          else finishAnimation();
        };
        frame = requestActiveFrame(tick);
      } else finishAnimation();
    } else {
      const reveal = reveals[step - 1]!;
      glyph.textContent = reveal.key;
      label.textContent = reveal.name;
      kind.textContent = reveal.kind;
      description.textContent = reveal.description;
      benefit.textContent = reveal.benefit ? `+ ${reveal.benefit}` : '';
      tradeoff.textContent = reveal.tradeoff ? `− ${reveal.tradeoff}` : '';
      benefit.hidden = !reveal.benefit;
      tradeoff.hidden = !reveal.tradeoff;
      accessible.textContent = `${reveal.kind} unlocked: ${reveal.name}. ${reveal.description} ${benefit.textContent} ${tradeoff.textContent}`;
      if (reveal.item) onUnlock?.();
      if (animating) timeout = activeTimeout(finishAnimation, 650);
      else finishAnimation();
    }
  };
  const advance = () => {
    if (sequence.hidden || !pageActive() || bonusBusy) return;
    if (animating) finishAnimation();
    else {
      if (step === 0 && doubleEmbers) return;
      step++;
      showStep();
    }
  };
  continueButton.onclick = (e) => {
    e.stopPropagation();
    if (bonusBusy) return;
    doubleEmbers = undefined;
    step++;
    showStep();
  };
  doubleButton.onclick = async (e) => {
    e.stopPropagation();
    if (!doubleEmbers || bonusBusy) return;
    bonusBusy = true;
    doubleButton.disabled = continueButton.disabled = true;
    const next = await doubleEmbers();
    bonusBusy = false;
    doubleButton.disabled = continueButton.disabled = false;
    if (next) {
      reward = next;
      doubleEmbers = undefined;
      finishAnimation();
    }
  };
  const onClick = () => advance();
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.target as HTMLElement).closest('button')) {
      event.stopPropagation();
      return;
    }
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    advance();
  };
  sequence.addEventListener('click', onClick);
  sequence.addEventListener('keydown', onKeyDown);
  return {
    start(nextReward, nextReveals, done, nextDouble, extraEmbers = 0) {
      doubleEmbers = extraEmbers > 0 ? nextDouble : undefined;
      doubleButton.textContent = `Watch Ad | 2x embers (+${extraEmbers.toLocaleString()})`;
      reward = nextReward;
      reveals = nextReveals;
      onDone = done;
      step = 0;
      summary.hidden = true;
      sequence.hidden = false;
      showStep();
      sequence.focus();
    },
    startUnlocks(nextReveals, done) {
      doubleEmbers = undefined;
      reveals = nextReveals;
      onDone = done;
      step = 1;
      summary.hidden = true;
      sequence.hidden = false;
      showStep();
      sequence.focus();
    },
    dispose() {
      clearMotion();
      sequence.removeEventListener('click', onClick);
      sequence.removeEventListener('keydown', onKeyDown);
    },
  };
}
