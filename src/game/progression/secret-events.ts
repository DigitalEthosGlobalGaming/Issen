import type { Statistics } from './statistics.ts';

export type SecretEvent =
  | { kind: 'cinematic' }
  | { kind: 'midnight'; hour: number }
  | { kind: 'titleTaps'; count: number }
  | { kind: 'konami' }
  | { kind: 'shrineKnocks'; count: number }
  | { kind: 'scoreClaps'; count: number }
  | { kind: 'pauses'; count: number }
  | { kind: 'feintMistake' }
  | { kind: 'mirrorVictory'; clean: boolean };

/** Record the actual secret trigger once; eligibility and presentation are
 * resolved at the next completed run (except applause, already post-run). */
export function recordSecretEvent(stats: Statistics, event: SecretEvent): boolean {
  switch (event.kind) {
    case 'cinematic':
      if (stats.cinematicVisits) return false;
      stats.cinematicVisits = 1;
      return true;
    case 'midnight':
      if ((event.hour !== 23 && event.hour !== 0) || stats.midnight) return false;
      stats.midnight = 1;
      return true;
    case 'titleTaps':
      if (event.count < 20 || stats.scarecrow) return false;
      stats.scarecrow = 1;
      return true;
    case 'konami':
      if (stats.konami) return false;
      stats.konami = 1;
      return true;
    case 'shrineKnocks':
      if (event.count < 3 || stats.omikuji) return false;
      stats.omikuji = 1;
      return true;
    case 'scoreClaps':
      if (event.count < 5 || stats.applause) return false;
      stats.applause = 1;
      return true;
    case 'pauses':
      if (event.count < 10 || stats.fidget) return false;
      stats.fidget = 1;
      return true;
    case 'feintMistake':
      stats.feinted = (stats.feinted || 0) + 1;
      return stats.feinted === 3;
    case 'mirrorVictory':
      stats.mirrorWins++;
      if (!event.clean || stats.mirrorClean) return false;
      stats.mirrorClean = 1;
      return true;
  }
}

/** Checkpoints rewind encounters, but cannot un-discover a profile secret. */
export function preserveSecretDiscoveries(restored: Statistics, current: Statistics): Statistics {
  for (const key of [
    'midnight',
    'scarecrow',
    'konami',
    'omikuji',
    'applause',
    'fidget',
    'feinted',
    'mirrorClean',
    'cinematicVisits',
  ] as const)
    restored[key] = Math.max(restored[key], current[key]);
  restored.deaths.early = Math.max(restored.deaths.early || 0, current.deaths.early || 0);
  return restored;
}

/** The cinematic souvenir is awarded immediately, including after interrupted writes. */
export function reconcileCinematicCompanion(stats: Statistics, unlocked: Set<string>): boolean {
  if (!stats.cinematicVisits || unlocked.has('mystic-rock')) return false;
  unlocked.add('mystic-rock');
  return true;
}
