import type { EventBus, GameEvents } from '../game/events.ts';
import { STAGES } from '../game/content/stages.ts';
import { kanji, roman } from '../shared/format.ts';

export interface WaveFeedbackViews {
  readonly S: number;
  readonly renderLives: () => void;
  readonly pop: (x: number, y: number, text: string, size?: number) => void;
  readonly banner: (title: string, subtitle: string) => void;
  readonly setWaveLabel: (label: string) => void;
  readonly sfx: { drum(): void; step(): void };
  readonly hint: (key: string, text: string, duration?: number) => void;
  readonly lightningFx: (event: GameEvents['waveAttack']) => void;
  readonly dust: (x: number, y: number, height: number) => void;
}
/** Wave labels, tutorial cues, entry sounds and attacker effects react to values. */
export function bindWaveFeedback(events: EventBus<GameEvents>, readViews: () => WaveFeedbackViews) {
  const showStageHint = (stage: number) => {
    const text = STAGES[stage]?.hint;
    if (text) readViews().hint('stage' + stage, text, 5000);
  };
  const offStage = events.on('stageHint', event => showStageHint(event.stage));
  const offLife = events.on('livesChanged', event => {
    const { renderLives, pop, S } = readViews();
    renderLives();
    if (event.cause === 'regen') pop(event.x, event.y, '延命 +1 life', Math.max(20, 24 * S));
    else if (event.cause === 'recovery') pop(event.x, event.y, 'Recovery +1 life');
    else if (event.cause === 'breath') pop(event.x, event.y, '息 +1 life', Math.max(20, 24 * S));
  });
  const offStart = events.on('waveStarted', event => {
    const { banner, setWaveLabel, sfx, hint } = readViews(), st = STAGES[event.stage]!;
    const n = event.wave;
    if (event.changed && n > 1) banner(st.k, `${st.n}${event.lap ? ' ' + roman(event.lap + 1) : ''}, wave ${n}`);
    else if (event.event === 'blood') banner('赤月', 'Blood moon. Faster blades, double score.');
    else if (event.event === 'fog') banner('霧', 'Fog. Only the attacker shows himself.');
    else banner(`第${kanji(n)}陣`, `Wave ${n}`);
    setWaveLabel(event.event === 'blood' ? '赤月' : event.event === 'fog' ? '霧' : `第${kanji(n)}陣`);
    sfx.drum();
    if (n === 1) hint('swipe', 'Swipe the way his blade points.', 7000);
    if (n === 2 || event.ronin) hint('perfect', 'Wait until his ring reaches the red arc, then cut, for a perfect cut.', 5000);
    if (event.refill) hint('refill', 'The pack no longer thins. Keep cutting.', 4000);
    if (event.feint) hint('feint', 'A trembling seal may feint. Watch the blade turn.', 5000);
    showStageHint(event.stage);
    if (event.event === 'blood') hint('blood', 'Blood moon. They strike faster, but every cut scores double.', 4500);
    if (event.event === 'fog') hint('fog', 'Fog. The rest of the pack is hidden. Cut whoever steps out.', 4500);
  });
  const offAttack = events.on('waveAttack', event => {
    const { lightningFx, pop, S, sfx, dust } = readViews();
    if (event.kind === 'lightning') lightningFx(event);
    else if (event.kind === 'lightningCut') pop(event.x, event.y - event.height, '雷', Math.max(20, 26 * S));
    else if (event.kind === 'hesitate') pop(event.x, event.y - event.height, '間', Math.max(18, 22 * S));
    else { sfx.step(); dust(event.x, event.y, event.height * 0.4); }
  });
  return () => { offAttack(); offStart(); offLife(); offStage(); };
}
