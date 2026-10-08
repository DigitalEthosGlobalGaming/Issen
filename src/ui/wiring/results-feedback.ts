import type { EventBus, GameEvents } from '../../game/events.ts';
import { renderGameOver } from '../screens/game-over.ts';
import type { RunResults } from '../screens/run-results.ts';
import type { RewardSettlement } from '../../game/progression/run-rewards.ts';
export interface ResultsFeedbackViews {
  readonly $: { (id: 'bAgain'): HTMLButtonElement; (id: string): HTMLElement };
  readonly presentationState: { lbT: number };
  readonly clearHints: () => void;
  readonly showScreen: (screen: 'over') => void;
  readonly hud: (on: boolean) => void;
  readonly setBestLine: () => void;
  readonly toast: (value: { k: string; msg: string }) => void;
  readonly renderGameOver: typeof renderGameOver;
  readonly runResults: RunResults;
  readonly completeResultSequence: (id: number) => void;
  readonly claimResultSequenceBonus: (id: number) => Promise<RewardSettlement | null>;
}
/** Draw immutable result values; user completion/bonus actions return to rules. */
export function bindResultsFeedback(
  events: EventBus<GameEvents>,
  read: () => ResultsFeedbackViews,
) {
  const offRender = events.on('resultRendered', (e) => {
    const v = read();
    v.renderGameOver(
      v.$('over'),
      e.run,
      e.record,
      e.newBest,
      e.stageName,
      e.reward,
      e.upgradesEnabled,
    );
  });
  const offCue = events.on('resultCue', (e) => {
    const v = read();
    switch (e.kind) {
      case 'reset':
        v.presentationState.lbT = 0;
        v.clearHints();
        v.$('bossbar').classList.remove('on');
        break;
      case 'normal':
        delete v.$('over').dataset.daily;
        break;
      case 'daily':
        v.$('overSeed').textContent = `Daily · ${e.day}`;
        v.$('oModifier').hidden = true;
        v.$('runResultSequence').hidden = true;
        v.$('overSummary').hidden = false;
        v.$('over').dataset.daily = 'true';
        break;
      case 'seed':
        v.$('overSeed').textContent = `Seed ${e.seed}`;
        break;
      case 'screen':
        v.showScreen('over');
        v.hud(false);
        break;
      case 'best':
        v.setBestLine();
        break;
      case 'saveFailed':
        v.toast({ k: '!', msg: 'Reward could not be saved. Please try again.' });
        break;
    }
  });
  const offReady = events.on('resultReady', (e) => {
    read().$('bAgain').disabled = !e.ready;
  });
  const offSequence = events.on('resultSequence', (e) => {
    const v = read();
    v.runResults.start(
      e.reward,
      e.reveals,
      () => v.completeResultSequence(e.id),
      e.bonus ? () => v.claimResultSequenceBonus(e.id) : undefined,
      e.extraEmbers,
    );
  });
  return () => {
    offSequence();
    offReady();
    offCue();
    offRender();
  };
}
