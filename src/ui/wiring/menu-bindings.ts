import { createPanelWiring, type PanelViews } from './panels.ts';
import { createSetupWiring, type SetupViews } from './setup.ts';
import { createAdminWiring, type AdminViews } from './admin.ts';
import { createSettingsWiring, type SettingsViews } from './settings.ts';
import { createArmoryWiring, type ArmoryViews } from './armory.ts';
import { createCinematicWiring, type CinematicViews } from './cinematic.ts';
type MenuViews = PanelViews & SetupViews & AdminViews & SettingsViews & ArmoryViews & CinematicViews;
export type MenuBindingViews = Omit<MenuViews, 'setBestLine' | 'openPanel' | 'closePanel' | 'renderStats' | 'setupScreen' | 'renderSetup' | 'tutorial' | 'launchTutorial' | 'showAdmin' | 'scrollMenus' | 'applySettings' | 'saveSettings' | 'lightingDebug' | 'options' | 'armoryWiring' | 'cinematicWiring'>;
/** Own menu construction in original order; current mutable ports retain accessors. */
export function createMenuBindings(readExternalViews: () => MenuBindingViews) {
  function read(): MenuViews {
    const views = readExternalViews();
    return Object.defineProperties(views, {
      setBestLine: { get: () => setBestLine, configurable: true },
      openPanel: { get: () => openPanel, configurable: true },
      closePanel: { get: () => closePanel, configurable: true },
      renderStats: { get: () => renderStats, configurable: true },
      setupScreen: { get: () => setupScreen, configurable: true },
      renderSetup: { get: () => renderSetup, configurable: true },
      tutorial: { get: () => tutorial, configurable: true },
      launchTutorial: { get: () => launchTutorial, configurable: true },
      showAdmin: { get: () => showAdmin, configurable: true },
      scrollMenus: { get: () => scrollMenus, configurable: true },
      applySettings: { get: () => applySettings, configurable: true },
      saveSettings: { get: () => saveSettings, configurable: true },
      lightingDebug: { get: () => lightingDebug, configurable: true },
      options: { get: () => options, configurable: true },
      armoryWiring: { get: () => armoryWiring, configurable: true },
      cinematicWiring: { get: () => cinematicWiring, configurable: true }
    }) as MenuViews;
  }
  const $ = (id: string) => readExternalViews().$(id);
  const { setBestLine, openPanel, closePanel, renderStats } = createPanelWiring(read);
  const { setupScreen, renderSetup, tutorial, launchTutorial } = createSetupWiring(read());
  const { showAdmin } = createAdminWiring($('adminContent'), read());
  const { scrollMenus, applySettings, saveSettings, lightingDebug, options } = createSettingsWiring(read());
  const armoryWiring = createArmoryWiring(read());
  const cinematicWiring = createCinematicWiring(read());
  return { setBestLine, openPanel, closePanel, renderStats, setupScreen, renderSetup, tutorial, launchTutorial, showAdmin, scrollMenus, applySettings, saveSettings, lightingDebug, options, armoryWiring, cinematicWiring };
}
