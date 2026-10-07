import { advanceGrunts, type EnemyUpdateState, type EnemyUpdateEnvironment } from './grunt.ts';
export type { EnemyUpdateState, EnemyUpdateEnvironment } from './grunt.ts';
/** Temporary compatibility adapter; migrate callers before removing it. */
export function updateEnemies(G: EnemyUpdateState, dt: number, env: EnemyUpdateEnvironment) {
  advanceGrunts(G, dt, env);
}
