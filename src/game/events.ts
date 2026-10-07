import type { Direction } from '../shared/directions.ts';
import type { RunPhase } from './run-state.ts';

/** Rule events carry values, never mutable run records or random generators. */
export interface GameEvents {
  kill: Readonly<{
    order: number;
    direction: Direction;
    perfect: boolean;
    automatic: boolean;
    score: number;
    combo: number;
    x: number;
    y: number;
    height: number;
    fog: number;
    alpha: number;
    disarmed: boolean;
    bonk: boolean;
    feint: boolean;
    trial: boolean;
    pStreak: number;
    runPerfects: number;
    coin: boolean;
    restored: boolean;
    knife: boolean;
    precisionWard: boolean;
    stormCharged: boolean;
    rekindled: number;
    frozen: boolean;
    furin: boolean;
    comboMilestone: boolean;
  }>;
  cutChain: Readonly<{
    kind: 'serpent' | 'tempest' | 'swallow';
    x: number;
    y: number;
    height: number;
  }>;
  struck: Readonly<{ reason: string; lives: number; fatal: boolean }>;
  parry: Readonly<{
    boss: string;
    perfect: boolean;
    second: boolean;
    x: number;
    y: number;
    height: number;
  }>;
  block: Readonly<{ boss: string; perfect: boolean; x: number; y: number; height: number }>;
  waveStarted: Readonly<{ wave: number; stage: number }>;
  waveCleared: Readonly<{ wave: number; stage: number; score: number }>;
  bossStarted: Readonly<{ boss: string; count: number }>;
  bossDefeated: Readonly<{ boss: string; count: number }>;
  standoffResolved: Readonly<{ won: boolean; perfect: boolean }>;
  comboChanged: Readonly<{ combo: number; maximum: number; zen?: boolean }>;
  comboBroken: Readonly<{ previous: number }>;
  scoreAdded: Readonly<{
    amount: number;
    total: number;
    x: number;
    y: number;
    label?: string;
    size?: number;
    zen: boolean;
  }>;
  comboProtected: Readonly<{ combo: number }>;
  runStarted: Readonly<{ seed: number; mode: string }>;
  runEnded: Readonly<{ seed: number; score: number; reason: string }>;
  phaseChanged: Readonly<{ from: RunPhase; to: RunPhase }>;
}
export interface EventBus<Events extends object> {
  on<K extends keyof Events>(event: K, listener: (value: Events[K]) => void): () => void;
  emit<K extends keyof Events>(event: K, value: Events[K]): void;
  clear(): void;
}

/** Synchronous registration order; each delivery snapshots subscriptions.
 * Subscribe/unsubscribe during delivery affects the next emission. Nested emits
 * finish before the outer delivery continues. Listener exceptions propagate.
 */
export function createEventBus<Events extends object>(): EventBus<Events> {
  type Subscription = { listener: (value: never) => void };
  const subscriptions = new Map<keyof Events, Subscription[]>();
  return {
    on(event, listener) {
      const listeners = subscriptions.get(event) ?? [];
      const callback: Subscription = { listener: listener as Subscription['listener'] };
      listeners.push(callback);
      subscriptions.set(event, listeners);
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        const index = listeners.indexOf(callback);
        if (index >= 0) listeners.splice(index, 1);
      };
    },
    emit(event, value) {
      if (value && typeof value === 'object') Object.freeze(value);
      for (const { listener } of [...(subscriptions.get(event) ?? [])]) listener(value as never);
    },
    clear() {
      subscriptions.clear();
    },
  };
}

/** Rule owners receive emission only, without listener management capabilities. */
export type RuleEvents = Pick<EventBus<GameEvents>, 'emit'>;
