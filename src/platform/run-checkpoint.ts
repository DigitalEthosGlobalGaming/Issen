import { dailyRun } from '../game/progression/daily.ts';
import type { RunState } from '../game/run-state.ts';
import type { Equipment, Setup } from './saves.ts';
import type { Statistics } from '../game/progression/statistics.ts';
import type { AwakeningProgress } from '../game/progression/awakening-progress.ts';
import type { MetaProgress } from '../game/progression/meta.ts';
import type { RunRewardLedger } from '../game/progression/run-rewards.ts';
import type { WeatherState } from '../rendering/scene/weather-state.ts';
import { store } from './storage.ts';
import { STAGES } from '../game/content/stages.ts';
import { createBlessingTriggers } from '../game/shrine/triggered.ts';
import type { CollectionProgress } from '../game/progression/collection-progress.ts';

const KEY = 'issen.runCheckpoint';
export interface RunCheckpoint {
  version: 1;
  status: 'active' | 'lost' | 'ended';
  seed: number;
  randomState: number;
  dailyDay?: string;
  run: Omit<RunState, 'bless'> & { bless: string[] };
  stats: Statistics;
  awakening: AwakeningProgress;
  collections?: CollectionProgress;
  meta: MetaProgress;
  unlocks: string[];
  equipment: Equipment;
  setup: Setup;
  ledger: RunRewardLedger;
  weather: WeatherState;
  bossMilestone: number;
  offers: string[] | null;
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const uint = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const figureSeed = (value: unknown): boolean =>
  record(value) &&
  finite(value.seed) &&
  Array.isArray(value.hem) &&
  Array.isArray(value.sl) &&
  Array.isArray(value.spots) &&
  Array.isArray(value.grass) &&
  Array.isArray(value.hair);
const enemyRecord = (value: unknown): boolean =>
  record(value) &&
  ['enter', 'idle', 'attack', 'dying', 'strike', 'fade'].includes(String(value.state)) &&
  ['up', 'down', 'left', 'right'].includes(String(value.dir)) &&
  Number.isInteger(value.slot) &&
  (record(value.fixed) || ((value.slot as number) >= 0 && (value.slot as number) < 5)) &&
  figureSeed(value.d) &&
  record(value.pose) &&
  record(value.pos) &&
  finite(value.life) &&
  finite(value.t);

export function parseRunCheckpoint(raw: unknown): RunCheckpoint | null {
  if (
    !record(raw) ||
    raw.version !== 1 ||
    (raw.status !== 'active' && raw.status !== 'lost' && raw.status !== 'ended') ||
    !uint(raw.seed) ||
    !uint(raw.randomState) ||
    !record(raw.run) ||
    !record(raw.stats) ||
    !record(raw.awakening) ||
    !record(raw.meta) ||
    !record(raw.equipment) ||
    !record(raw.setup) ||
    !record(raw.ledger) ||
    !record(raw.weather) ||
    !Array.isArray(raw.unlocks) ||
    !raw.unlocks.every((id) => typeof id === 'string') ||
    !(
      raw.offers === null ||
      (Array.isArray(raw.offers) && raw.offers.every((id) => typeof id === 'string'))
    )
  )
    return null;
  const run = raw.run;
  if (
    !['playing', 'boss', 'standoff', 'between', 'shrine', 'dead', 'over'].includes(
      String(run.state),
    ) ||
    !['normal', 'ronin'].includes(String(run.mode)) ||
    !Array.isArray(run.bless) ||
    !run.bless.every((id) => typeof id === 'string') ||
    !Array.isArray(run.enemies) ||
    !run.enemies.every(enemyRecord) ||
    !Array.isArray(run.pendingSpawns) ||
    !run.pendingSpawns.every(
      (spawn) => record(spawn) && Number.isInteger(spawn.slot) && finite(spawn.t),
    ) ||
    !record(run.cfg) ||
    !finite(run.cfg.total) ||
    !finite(run.cfg.pack) ||
    !finite(run.cfg.atk) ||
    !finite(run.cfg.gap) ||
    !Number.isSafeInteger(run.wave) ||
    (run.wave as number) < 1 ||
    !Number.isFinite(run.score) ||
    (run.score as number) < 0 ||
    !Number.isFinite(run.lives) ||
    (run.lives as number) < 0 ||
    !finite(run.maxLives) ||
    !finite(run.combo) ||
    !finite(run.kills) ||
    !finite(run.runTime) ||
    !Number.isInteger(run.stage) ||
    (run.stage as number) < 0 ||
    (run.stage as number) >= STAGES.length ||
    !record(run.m) ||
    (run.state === 'boss' &&
      (!record(run.boss) ||
        !record(run.boss.def) ||
        !figureSeed(run.boss.d) ||
        !record(run.boss.bp) ||
        !record(run.boss.pos) ||
        !record(run.boss.pose) ||
        !finite(run.boss.hp) ||
        !finite(run.boss.t))) ||
    (run.state === 'standoff' && (!record(run.so) || !enemyRecord(run.so.e))) ||
    (run.state === 'shrine' && (!Array.isArray(raw.offers) || !raw.offers.length)) ||
    !Number.isFinite(raw.ledger.pending) ||
    !finite(raw.weather.surgeT) ||
    !finite(raw.weather.surge) ||
    !finite(raw.weather.woT) ||
    !finite(raw.weather.wo) ||
    !Array.isArray(raw.weather.banks) ||
    !Number.isSafeInteger(raw.bossMilestone)
  )
    return null;
  if (raw.dailyDay !== undefined) {
    try {
      if (typeof raw.dailyDay !== 'string' || dailyRun(raw.dailyDay).seed !== raw.seed) return null;
    } catch {
      return null;
    }
  }
  if (
    run.tanto !== undefined &&
    (!Number.isInteger(run.tanto) || (run.tanto as number) < 0 || (run.tanto as number) > 3)
  )
    return null;
  run.tanto = run.tanto ?? 0;
  run.reviveOfferResolved = run.reviveOfferResolved === true;
  run.secondWindUsed = run.secondWindUsed === true;
  if (
    raw.ledger.supportMultiplier !== undefined &&
    ![1, 2].includes(Number(raw.ledger.supportMultiplier))
  )
    return null;
  run.shrineRerolls = run.shrineRerolls === 1 ? 1 : 0;
  const triggers = run.blessingTriggers;
  if (triggers !== undefined) {
    if (!record(triggers)) return null;
    const defaults = createBlessingTriggers();
    for (const [key, fallback] of Object.entries(defaults)) {
      const value = triggers[key];
      if (
        value !== undefined &&
        (typeof value !== typeof fallback ||
          (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)))
      )
        return null;
    }
    run.blessingTriggers = { ...defaults, ...triggers };
  } else run.blessingTriggers = createBlessingTriggers();
  return raw as unknown as RunCheckpoint;
}
export function readRunCheckpoint(): RunCheckpoint | null {
  return parseRunCheckpoint(store.get(KEY, null));
}
export function writeRunCheckpoint(checkpoint: RunCheckpoint): boolean {
  return store.set(KEY, checkpoint);
}
export function clearRunCheckpoint(): void {
  store.remove(KEY);
}
