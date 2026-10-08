import type { TrialDefinition } from '../game/content/trials.ts';
import type { RunState } from '../game/run-state.ts';

type ObjectiveState = Pick<
  RunState,
  'state' | 'boss' | 'wave' | 'kills' | 'perfects' | 'bossesSlain'
>;

/** Retains the element and last writes; a new/ended trial resets the selection cache. */
export function createTrialObjective(element: Pick<HTMLElement, 'hidden' | 'textContent'>) {
  let previousTrial: TrialDefinition | null | undefined;
  let hidden = element.hidden;
  let text = element.textContent;
  function reset() {
    previousTrial = undefined;
    hidden = element.hidden;
    text = element.textContent;
  }
  return {
    render(trial: TrialDefinition | null, state: ObjectiveState) {
      if (trial !== previousTrial) {
        reset();
        previousTrial = trial;
      }
      const nextHidden = !trial || !['playing', 'boss', 'between'].includes(state.state);
      if (hidden !== nextHidden) element.hidden = hidden = nextHidden;
      if (!trial || nextHidden) return;
      const nextText =
        trial.duelMaster && state.boss
          ? `Duel Master · ${20 - state.boss.hp}/20 exchanges · No mistakes`
          : trial.wave
            ? `${trial.name} · ${trial.waveCount ? `Wave ${state.wave}/${trial.waveCount} · ` : ''}${state.kills}/${trial.wave.total} cuts${trial.wave.perfects ? ` · ${state.perfects}/${trial.wave.perfects} perfect` : ''} · ${trial.mirrored ? 'Cut opposite' : 'No mistakes'}`
            : `${trial.name} · ${state.bossesSlain}/${trial.bosses!.length} duels · ${trial.cleanOpenings ? 'No hits or missed openings' : 'No hits'}`;
      if (text !== nextText) element.textContent = text = nextText;
    },
    hide() {
      if (!hidden) element.hidden = hidden = true;
      reset();
    },
  };
}
