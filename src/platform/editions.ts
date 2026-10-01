export type GameEdition = 'free' | 'premium' | 'web';
export const PREMIUM_ITEMS = new Set([
  'supporter-print',
  'falling-leaves',
  'ember-ash',
  'ink-wash',
  'pilgrims-bead',
  'first-strike',
  'quiet-seal',
]);
export const PREMIUM_TRIALS = new Set(['quiet-blade', 'duel-master']);
export function editionAccess(edition: GameEdition, purchased: boolean): boolean {
  return edition !== 'free' || purchased;
}
export function itemAccessible(id: string, access: boolean): boolean {
  return access || !PREMIUM_ITEMS.has(id);
}
export function trialAccessible(id: string, access: boolean): boolean {
  return access || !PREMIUM_TRIALS.has(id);
}
