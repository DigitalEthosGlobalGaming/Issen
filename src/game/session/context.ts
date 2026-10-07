import type { RunState } from '../run-state.ts';
import type { RestorableRandom } from '../../shared/random.ts';
import type { Equipment, Setup } from '../../platform/saves.ts';
import type { Settings } from '../../platform/settings.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { DailyRun } from '../progression/daily.ts';
import type { createAudio } from '../../audio/audio.ts';
import type { EventBus, GameEvents } from '../events.ts';

/** Gameplay owns plain checkpoint-compatible records and one gameplay RNG. */
export interface RunContext {
  state: RunState;
  random: RestorableRandom;
  equipment: Equipment;
  setup: Setup;
  trial: TrialDefinition | null;
  daily: DailyRun | null;
}

/** Browser capabilities are ports; rules receive only the narrower ports they use. */
export interface ServicesContext {
  readonly audio: ReturnType<typeof createAudio>;
  readonly storage: {
    get(key: string, fallback: unknown): unknown;
    set(key: string, value: unknown): boolean;
  };
  readonly settings: Settings;
  readonly notify: (message: { k: string; msg: string }) => void;
}

/** The composition owner supplies presentation. Gameplay never imports its types. */
export interface GameContext<Presentation = unknown> {
  readonly run: RunContext;
  readonly services: ServicesContext;
  readonly presentation: Presentation;
  readonly events: EventBus<GameEvents>;
}
