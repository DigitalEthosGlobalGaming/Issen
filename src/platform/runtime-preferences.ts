import { parseSettings, preferenceEnabled } from './settings.ts';
import { createHaptics, createCombatHaptics } from './haptics.ts';
import { graphicsDevice, particleDensity } from './graphics-settings.ts';
import { createGraphicsQuality } from './graphics-quality.ts';
import { createRefreshRateMonitor } from './refresh-rate.ts';
import { editionAccess, itemAccessible, type GameEdition } from './editions.ts';
import { premium } from './purchases.ts';
import { parseTesterPremium, testerPremiumActive } from './tester-premium.ts';
import type { createLifecycle } from './lifecycle.ts';
export interface RuntimePreferencePorts {
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly storage: { get(key: string, fallback: unknown): unknown };
  readonly edition: GameEdition;
}
/** Owns browser preference/access state and haptic capabilities for one runtime. */
export function createRuntimePreferences({ lifecycle, storage, edition }: RuntimePreferencePorts) {
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
  const device = graphicsDevice(window);
  const refreshRate = createRefreshRateMonitor(document);
  lifecycle.add(refreshRate.dispose);
  const graphics = createGraphicsQuality(
    () => settings.graphics,
    device,
    () => refreshRate.supports120,
  );
  const frameRate = () => graphics.effective.frameRate;
  // Combat cues remain independent of optional ambient particles.
  const density = () => (reducedMotion() ? 0.3 : 1);
  const ambientDensity = () => {
    const selected = particleDensity(graphics.effective.particles);
    return reducedMotion() ? Math.min(0.3, selected) : selected;
  };
  const grassDensity = () => particleDensity(graphics.effective.grass);
  const weatherDensity = () =>
    graphics.effective.weather === 'reduced' || reducedMotion() ? 0.3 : 1;
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
    ambientDensity,
    grassDensity,
    weatherDensity,
    graphics,
    frameRate,
    refreshRate,
    initialPurchaseCheck: true,
    get testerPremium() {
      return testerPremium;
    },
    set testerPremium(value) {
      testerPremium = value;
    },
  };
}
