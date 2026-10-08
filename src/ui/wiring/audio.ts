import { createAudio } from '../../audio/audio.ts';
import { createGuidedLessons } from './guided-lessons.ts';
import type { Settings } from '../../platform/settings.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
export interface RuntimeAudioViews {
  readonly settings: Settings;
  readonly lifecycle: ReturnType<typeof createLifecycle>;
  readonly storage: {
    get(key: string, fallback: unknown): unknown;
    set(key: string, value: unknown): boolean;
  };
  readonly $: (id: string) => HTMLElement;
  readonly phase: string;
  readonly saveSettings: () => void;
}
/** Owns audio/guided browser wiring and mute controls; phase/settings ports stay current. */
export function createRuntimeAudio(views: RuntimeAudioViews) {
  const { $, settings, lifecycle, storage } = views;
  const audio = createAudio(settings.muted);
  const audioInit = audio.init,
    tn = audio.tone,
    sfx = audio.cues;
  const guided = createGuidedLessons(
    $('app'),
    storage.get('issen.guidedLessons', null),
    (value) => storage.set('issen.guidedLessons', value),
    (frozen) => audio.setPaused(frozen || views.phase === 'paused'),
  );
  const ICON_ON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function setMuteIcon() {
    $('mute').innerHTML = audio.muted ? ICON_OFF : ICON_ON;
    $('mute').setAttribute('aria-pressed', String(audio.muted));
  }
  lifecycle.listen($('mute'), 'pointerup', (e) => {
    e.stopPropagation();
    audioInit();
    settings.muted = !settings.muted;
    views.saveSettings();
  });
  lifecycle.listen($('mute'), 'pointerdown', (e) => e.stopPropagation());

  return { audio, audioInit, tn, sfx, guided, setMuteIcon };
}
