import type { Enemy } from './combat/enemy.ts';
import type { Boss } from './encounters/boss.ts';
import type { Standoff } from './encounters/standoff.ts';
import type { PendingSpawn } from './encounters/waves.ts';
import type { waveConfig } from './encounters/configuration.ts';
import type { UnlockNotice } from './progression/unlocks.ts';
import type { Equipment, Setup } from '../platform/saves.ts';
import type { Random } from '../shared/random.ts';
import { computeModifiers } from './equipment/modifiers.ts';
import type { Modifiers } from './equipment/modifiers.ts';
import { FORTUNES } from './content/fortunes.ts';

export type RunPhase =
  'title' | 'playing' | 'boss' | 'between' | 'standoff' | 'shrine' | 'dead' | 'over' | 'paused';
export type Screen =
  | 'title'
  | 'setup'
  | 'armory'
  | 'stats'
  | 'share'
  | 'shrine'
  | 'over'
  | 'paused'
  | 'template'
  | 'admin'
  | 'trials';

export interface RunState {
  state: RunPhase;
  mode: 'normal' | 'ronin';
  blade: boolean;
  zen: boolean;
  hard: boolean;
  rush: boolean;
  upgradesEnabled: boolean;
  knives: number;
  maxKnives: number;
  composure: number;
  recoveryEvery: number;
  wavesCleared: number;
  runRobe: string;
  petT: number;
  kikuUsed: number;
  freezeT: number;
  slowT: number;
  zanKey: number;
  maxLives: number;
  lives: number;
  hits: number;
  bless: Set<string>;
  event: 'blood' | 'fog' | null;
  wardUsed: boolean;
  runWards: number;
  m: Modifiers;
  so: Standoff | null;
  lastEv: number;
  stage: number;
  lap: number;
  score: number;
  wave: number;
  combo: number;
  maxCombo: number;
  kills: number;
  perfects: number;
  pStreak: number;
  parries: number;
  runTime: number;
  enemies: Enemy[];
  boss: Boss | null;
  bossCount: number;
  bossesSlain: number;
  cfg: ReturnType<typeof waveConfig> | null;
  toSpawn: number;
  nextOrder: number;
  attacker: Enemy | null;
  gapT: number;
  nextT: number;
  deathT: number;
  reason: string;
  hints: Record<string, number>;
  pendingSpawns: PendingSpawn[];
  afterBoss: boolean;
  overReady: boolean;
  pausedFrom: RunPhase | null;
  newUnlocks: UnlockNotice[];
  panel: Screen | null;
  panelFrom: Screen;
  card: HTMLCanvasElement | null;
  cardScore: number;
  runBlade: string;
  runBladeThird: boolean;
  seed: number;
  fortune: (typeof FORTUNES)[number] | null;
  darumaUsed: boolean;
  phoenixUsed: boolean;
  foxUsed: boolean;
  kagamiUsed: boolean;
  tempN: number;
  manekiN: number;
  scars: number;
  clean: number;
  lostLife: boolean;
  diedInBoss: boolean;
  pauseN: number;
  claps: number;
}

export function createRunState(savedHints: unknown = {}): RunState {
  const hints: Record<string, number> = {};
  if (savedHints && typeof savedHints === 'object' && !Array.isArray(savedHints)) {
    for (const [key, value] of Object.entries(savedHints)) {
      if (value === 1) hints[key] = 1;
    }
  }
  return {
    state: 'title',
    mode: 'normal',
    blade: false,
    zen: false,
    hard: false,
    rush: false,
    upgradesEnabled: true,
    knives: 0,
    maxKnives: 0,
    composure: 0,
    recoveryEvery: 0,
    wavesCleared: 0,
    runRobe: '',
    petT: 0,
    kikuUsed: 0,
    freezeT: 0,
    slowT: 0,
    zanKey: -1,
    maxLives: 2,
    lives: 0,
    hits: 0,
    bless: new Set(),
    event: null,
    wardUsed: false,
    runWards: 0,
    m: computeModifiers([], new Set()),
    so: null,
    lastEv: -9,
    stage: 0,
    lap: 0,
    score: 0,
    wave: 0,
    combo: 0,
    maxCombo: 0,
    kills: 0,
    perfects: 0,
    pStreak: 0,
    parries: 0,
    runTime: 0,
    enemies: [],
    boss: null,
    bossCount: 0,
    bossesSlain: 0,
    cfg: null,
    toSpawn: 0,
    nextOrder: 1,
    attacker: null,
    gapT: 0,
    nextT: 0,
    deathT: 0,
    reason: '',
    hints,
    pendingSpawns: [],
    afterBoss: false,
    overReady: false,
    pausedFrom: null,
    newUnlocks: [],
    panel: null,
    panelFrom: 'title',
    card: null,
    cardScore: 0,
    runBlade: '',
    runBladeThird: false,
    seed: 0,
    fortune: null,
    darumaUsed: false,
    phoenixUsed: false,
    foxUsed: false,
    kagamiUsed: false,
    tempN: 0,
    manekiN: 0,
    scars: 0,
    clean: 0,
    lostLife: false,
    diedInBoss: false,
    pauseN: 0,
    claps: 0,
  };
}

/** Reset run-owned progress, preserving scene transition state and persistent hints. */
export function resetRun(
  run: RunState,
  setup: Setup,
  equipment: Equipment,
  random: Random = Math.random,
): void {
  Object.assign(run, {
    mode: setup.diff,
    rush: setup.mode === 'rush',
    upgradesEnabled: setup.upgrades !== false,
    knives: 0,
    maxKnives: 0,
    composure: 0,
    recoveryEvery: 0,
    wavesCleared: 0,
    runRobe: equipment.robe,
    blade: !setup.arrows,
    zen: setup.lives === 'zen',
    hard: setup.lives === '0',
    maxLives: 2,
    lives: setup.lives === '3' ? 2 : 0,
    hits: 0,
    score: 0,
    wave: 0,
    combo: 0,
    maxCombo: 0,
    kills: 0,
    perfects: 0,
    pStreak: 0,
    parries: 0,
    runTime: 0,
    enemies: [],
    boss: null,
    bossCount: 0,
    bossesSlain: 0,
    attacker: null,
    pendingSpawns: [],
    afterBoss: false,
    overReady: false,
    nextOrder: 1,
    newUnlocks: [],
    panel: null,
    lap: 0,
    runBlade: equipment.blade,
    runBladeThird: equipment.blade === 'steel' && equipment.bladeThird === true,
    fortune:
      equipment.charm === 'omikuji'
        ? (FORTUNES[Math.floor(random() * FORTUNES.length)] ?? null)
        : null,
    darumaUsed: false,
    phoenixUsed: false,
    tempN: 0,
    foxUsed: false,
    kagamiUsed: false,
    manekiN: 0,
    scars: 0,
    bless: new Set<string>(),
    lostLife: false,
    zanKey: -1,
    slowT: 0,
    event: null,
    so: null,
    lastEv: -9,
  } satisfies Partial<RunState>);
}
