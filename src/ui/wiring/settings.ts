import { createScrollMenus } from '../scroll-menus.ts';
import { createLightingDebug } from '../lighting-debug.ts';
import { createOptions } from '../screens/options.ts';
import { store } from '../../platform/storage.ts';
import { PREMIUM_FILM } from '../../platform/premium.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { parseSettings } from '../../platform/settings.ts';
import type { createAudio } from '../../audio/audio.ts';
import type { createCombatHaptics } from '../../platform/haptics.ts';
import type { createLightingRig } from '../../rendering/lighting-rig.ts';
import type { createScreenAnimation } from '../screen-animation.ts';
import type { createEnvironmentPresentation } from '../../presentation/environment.ts';
import type { EnvironmentState } from '../../presentation/environment-state.ts';
import type { PresentationState } from '../../presentation/state.ts';
import type { RunState } from '../../game/run-state.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { PreviewFrame } from '../../rendering/armory-preview.ts';

export interface SettingsViews {
 readonly $: { (id: 'prevC' | 'supportPreview'): HTMLCanvasElement; (id: string): HTMLElement };
 readonly G: RunState;
 readonly cvs: HTMLCanvasElement;
 readonly screenAnimation: ReturnType<typeof createScreenAnimation>;
 readonly lifecycle: ReturnType<typeof createLifecycle>;
 readonly settings: ReturnType<typeof parseSettings>;
 readonly reducedMotion: () => boolean;
 readonly reducedFlashes: () => boolean;
 readonly prepareScene: () => void;
 readonly artworkReady: boolean;
 readonly combatHaptics: ReturnType<typeof createCombatHaptics>;
 readonly audio: ReturnType<typeof createAudio>;
 readonly setMuteIcon: () => void;
 readonly presentationState: PresentationState;
 readonly environmentState: EnvironmentState;
 readonly ambient: ReturnType<typeof createEnvironmentPresentation>['ambient'];
 readonly rebalanceWeather: () => void;
 readonly lightingRig: ReturnType<typeof createLightingRig>;
 readonly supportPreview: { draw: (frame: PreviewFrame) => void };
 readonly previewFrame: (film: string, effects: boolean, target: HTMLCanvasElement) => PreviewFrame;
 readonly audioInit: () => void;
 readonly closePanel: () => void;
 readonly savedRun: RunCheckpoint | null;
 readonly launchTutorial: () => void;
 readonly systemMotion: MediaQueryList;
}

/** Applies UI preferences through owned presentation/services and explicit actions. */
export function createSettingsWiring(views: SettingsViews) {
 const { $, G, cvs, screenAnimation, lifecycle, settings, reducedMotion, reducedFlashes, prepareScene, combatHaptics, audio, setMuteIcon, presentationState, environmentState, ambient, rebalanceWeather, lightingRig, previewFrame, audioInit, closePanel, launchTutorial, systemMotion } = views;
  const scrollMenus = createScrollMenus($('app'));
  lifecycle.add(scrollMenus.dispose);
  function applySettings() {
    cvs.dataset.debris = 'sprites';
    screenAnimation.invalidate();
    if (views.artworkReady) prepareScene();
    scrollMenus.update(settings.menuStyle, reducedMotion());
    if (!settings.vibration) combatHaptics.stop();
    audio.setMuted(settings.muted);
    audio.setVolumes(settings.effectsVolume, settings.ambienceVolume);
    setMuteIcon();
    $('app').classList.toggle('large-text', settings.textSize === 'large');
    $('app').classList.toggle('reduced-motion', reducedMotion());
    document.documentElement.dataset.motion = settings.reducedMotion;
    $('app').dataset.reducedFlashes = String(reducedFlashes());
    if (reducedMotion()) {
      presentationState.shake = 0;
      presentationState.zoom = 1;
    }
    if (reducedFlashes()) presentationState.flashA = Math.min(presentationState.flashA, 0.035);
    if (environmentState.bg) {
      ambient().balanceLeaves(environmentState.leaves);
      rebalanceWeather();
    }
  }
  function saveSettings() {
    store.set('issen.settings', settings);
    store.set('issen.muted', settings.muted);
    applySettings();
  }
  const lightingDebug = createLightingDebug(
    $('app'),
    lightingRig,
    () => (G.panel === 'armory' ? $('prevC') : G.panel === 'support' ? $('supportPreview') : cvs),
    () => {
      screenAnimation.invalidate();
      if (G.panel === 'support')
        views.supportPreview.draw(previewFrame(PREMIUM_FILM, false, $('supportPreview')));
    },
  );
  lifecycle.add(lightingDebug.dispose);
  const options = createOptions(
    $('options'),
    settings,
    () => {
      audioInit();
      saveSettings();
    },
    closePanel,
    () => {
      if (G.state === 'title' && views.savedRun?.status !== 'active') launchTutorial();
    },
  );
  lifecycle.add(options.dispose);
  lifecycle.listen(systemMotion, 'change', applySettings);
  applySettings();

 return { scrollMenus, applySettings, saveSettings, lightingDebug, options };
}
