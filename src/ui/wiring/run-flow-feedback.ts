import type { EventBus, GameEvents } from '../../game/events.ts';
export interface RunFlowFeedbackViews {
  readonly $: (id: string) => HTMLElement;
  readonly applySeal: () => void;
  readonly clearHints: () => void;
  readonly refreshArmoryNew: () => void;
  readonly showScreen: (screen: 'title') => void;
  readonly hud: (on: boolean) => void;
  readonly presentationState: { lbT: number };
  readonly setBestLine: () => void;
  readonly showPauseScreen: () => void;
  readonly renderTrialObjective: () => void;
}
/** Display reactions retain original synchronous transition boundaries. */
export function bindRunFlowFeedback(
  events: EventBus<GameEvents>,
  read: () => RunFlowFeedbackViews,
) {
  return events.on('runFlowCue', (event) => {
    const v = read();
    switch (event.kind) {
      case 'seal':
        v.applySeal();
        break;
      case 'title':
        v.clearHints();
        v.refreshArmoryNew();
        v.showScreen('title');
        v.hud(false);
        v.$('bossbar').classList.remove('on');
        break;
      case 'letterboxReset':
        v.presentationState.lbT = 0;
        break;
      case 'best':
        v.setBestLine();
        break;
      case 'pause':
        v.showPauseScreen();
        break;
      case 'trialObjective':
        v.renderTrialObjective();
        break;
    }
  });
}
