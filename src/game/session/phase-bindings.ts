import { createWaveLifecycle, type WaveLifecycleViews } from '../phases/waves.ts';
import { createWavesPhase, type WavesViews } from '../phases/waves.ts';
import { createBossPhase, type BossViews } from '../phases/boss.ts';
import { createStandoffPhase, type StandoffViews } from '../phases/standoff.ts';
import { createShrinePhase, type ShrineViews } from '../phases/shrine.ts';
import { createDeathPhase, type DeathViews } from '../phases/death.ts';
import { createBetweenPhase, type BetweenViews } from '../phases/between.ts';
export type PhaseBindingViews = WaveLifecycleViews &
  WavesViews &
  BossViews &
  StandoffViews &
  ShrineViews &
  DeathViews &
  BetweenViews;
/** Explicit shared phase wiring; each controller retains its narrow view contract. */
export function createPhaseBindings<Context>(readViews: () => PhaseBindingViews, context: Context) {
  const waveLifecycle = createWaveLifecycle(readViews);
  const wavesPhase = createWavesPhase<Context>(readViews, waveLifecycle);
  const bossPhase = createBossPhase<Context>(readViews, context);
  const standoffPhase = createStandoffPhase<Context>(readViews, context);
  const shrinePhase = createShrinePhase<Context>(readViews);
  const deathPhase = createDeathPhase<Context>(readViews);
  const betweenPhase = createBetweenPhase<Context>(readViews);
  return {
    waveLifecycle,
    wavesPhase,
    bossPhase,
    standoffPhase,
    shrinePhase,
    deathPhase,
    betweenPhase,
  };
}
