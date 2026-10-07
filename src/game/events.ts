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
  swipeCue: Readonly<{ kind: 'mirror' | 'miss' }>;
  knifeHit: Readonly<{ x0: number; y0: number; x: number; y: number; height: number }>;
  struck: Readonly<{
    reason: string; lives: number; fatal: boolean; lifeLost: boolean;
    x: number; y: number; height: number; label: string;
  }>;
  companionSaved: Readonly<{ kind: 'tanto' | 'foxfire'; x: number; y: number }>;
  revived: Readonly<{ kind: 'support' | 'phoenix' | 'daruma'; lives: number }>;
  parry: Readonly<{
    boss: string;
    perfect: boolean;
    second: boolean;
    x: number;
    y: number;
    height: number;
  }>;
  block: Readonly<{ boss: string; perfect: boolean; x: number; y: number; height: number }>;
  wavePrepared: Readonly<{ wave: number; zen: boolean; lostLife: boolean }>;
  waveReached: Readonly<{ wave: number; mode: string; zen: boolean; blade: boolean; lostLife: boolean }>;
  waveStarted: Readonly<{
    wave: number; stage: number; lap: number; changed: boolean;
    event: 'blood' | 'fog' | null; ronin: boolean; refill: boolean; feint: boolean;
  }>;
  stageHint: Readonly<{ stage: number }>;
  waveAttack: Readonly<{ kind: 'lightning' | 'lightningCut' | 'hesitate' | 'step'; x: number; y: number; height: number }>;
  livesChanged: Readonly<
    | { cause: 'refresh'; lives: number }
    | { cause: 'regen' | 'recovery' | 'breath'; lives: number; x: number; y: number }
  >;
  waveCleared: Readonly<{ wave: number; stage: number; score: number }>;
  bossCut: Readonly<{ boss: string; direction: Direction; automatic: boolean; x: number; y: number; height: number }>;
  bossEntered: Readonly<{ glyph: string; name: string; lap: number; wave: number; rush: boolean }>;
  bossReady: Readonly<{ count: number }>;
  bossTraits: Readonly<{ twin: boolean; spear: boolean; mirror: boolean }>;
  bossHealth: Readonly<{ hp: number; maximum: number }>;
  bossCue: Readonly<
    | { kind: 'draw' }
    | { kind: 'recovered' | 'return' | 'afterimage' | 'deflected'; x: number; y: number; height: number }
  >;
  bossOpening: Readonly<{ kind: 'parry' | 'chain' | 'cut'; mirror: boolean }>;
  bossStarted: Readonly<{ boss: string; count: number }>;
  bossDefeated: Readonly<{
    boss: string;
    count: number;
    clean: boolean;
    mirror: boolean;
    mode: string;
    rush: boolean;
    blade: boolean;
    bossesSlain: number;
    direction: Direction;
    x: number;
    y: number;
    groundY: number;
    height: number;
    fog: number;
    alpha: number;
    crow: boolean;
  }>;
  standoffStarted: Readonly<{ stage: number; changed: boolean }> ;
  standoffCue: Readonly<{ kind: 'step' | 'draw' | 'exit' }> ;
  standoffResolved: Readonly<
    | { won: false; perfect: false }
    | { won: true; perfect: true; direction: Direction; x: number; y: number; height: number }
  >;
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
