import type { Statistics } from './statistics.ts';

export type SecretEvent =
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
