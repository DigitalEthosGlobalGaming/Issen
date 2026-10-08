import { parseSettings, preferenceEnabled } from './settings.ts';
import { createHaptics, createCombatHaptics } from './haptics.ts';
import { preferredDensity } from '../rendering/effects/quality.ts';
import { editionAccess, itemAccessible, type GameEdition } from './editions.ts';
import { premium } from './purchases.ts';
import { parseTesterPremium, testerPremiumActive } from './tester-premium.ts';
import type { createLifecycle } from './lifecycle.ts';
export interface RuntimePreferencePorts {
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly storage: { get(key: string, fallback: unknown): unknown };
  readonly effectDensity: () => number;
  readonly edition: GameEdition;
}
/** Owns browser preference/access state and haptic capabilities for one runtime. */
export function createRuntimePreferences({
  lifecycle,
  storage,
  effectDensity,
  edition,
}: RuntimePreferencePorts) {
  const settings = parseSettings(
    storage.get('issen.settings', null),
    storage.get('issen.muted', false) === true,
  );
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => preferenceEnabled(settings.reducedMotion, systemMotion.matches);
  const reducedFlashes = () => preferenceEnabled(settings.reducedFlashes, systemMotion.matches);
  const buzz = createHaptics(() => settings.vibration);
  const combatHaptics = createCombatHaptics(
    () => settings.vibration,
    () => settings.vibrationStrength,
  );
  lifecycle.add(combatHaptics.stop);
  let testerPremium = parseTesterPremium(storage.get('issen.testerPremium', null));
  const premiumAccess = () =>
    editionAccess(edition, premium.state.owned || testerPremiumActive(testerPremium));
  const accessible = (id: string) => itemAccessible(id, premiumAccess());
  const density = () => preferredDensity(settings.quality, effectDensity(), reducedMotion());
  return {
    settings,
    systemMotion,
    reducedMotion,
    reducedFlashes,
    buzz,
    combatHaptics,
    edition,
    premiumAccess,
    accessible,
    density,
    initialPurchaseCheck: true,
    get testerPremium() {
      return testerPremium;
    },
    set testerPremium(value) {
      testerPremium = value;
    },
  };
}
