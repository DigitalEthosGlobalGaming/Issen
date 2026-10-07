import { bindPointer } from '../../input/pointer.ts';
import { bindKeyboard } from '../../input/keyboard.ts';
import { pageActive } from '../../platform/activity.ts';
import { sensitivityScale } from '../../platform/settings.ts';
import { isTestProfile } from '../../platform/storage.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { parseSettings } from '../../platform/settings.ts';
import type { RunState, Screen } from '../../game/run-state.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { Direction } from '../../shared/directions.ts';

export interface InputViews {
 readonly $: (id: string) => HTMLElement;
 readonly G: RunState;
 readonly settings: ReturnType<typeof parseSettings>;
 readonly cinematic: { readonly active: boolean; swipe: (dir: Direction) => void };
 readonly lifecycle: ReturnType<typeof createLifecycle>;
 readonly options: { open: () => void; back: () => void };
 readonly rewardScreen: { readonly open: boolean };
 readonly W: number;
 readonly H: number;
 readonly savedRun: RunCheckpoint | null;
 readonly activeTrial: unknown;
 readonly audioInit: () => void;
 readonly onSwipe: (dir: Direction) => void;
 readonly onTapDown: () => boolean;
 readonly onTap: () => void;
 readonly abandonSavedRun: () => void;
 readonly continueSavedRun: () => void;
 readonly openPanel: (id: Screen) => void;
 readonly startDaily: () => void;
 readonly startRun: () => void;
 readonly closePanel: () => void;
 readonly pause: () => void;
 readonly resume: () => void;
 readonly endRun: () => void;
 readonly toTitle: () => void;
 readonly konamiInput: (dir: Direction) => void;
}

/** Native input and DOM navigation invoke explicit runtime actions. */
export function createInputWiring(cvs: HTMLCanvasElement, views: InputViews) {
 const { $, G, settings, cinematic, audioInit, onSwipe, onTapDown, onTap, lifecycle, abandonSavedRun, continueSavedRun, openPanel, startDaily, startRun, options, closePanel, pause, resume, endRun, toTitle, rewardScreen, konamiInput } = views;
  const pointerActions: Parameters<typeof bindPointer>[1] = {
    active: pageActive,
    activate: audioInit,
    threshold: () => {
      const k = G.m ? G.m.swipe : 1;
      return Math.max(22 * k, Math.min(views.W, views.H) * 0.055 * k) * sensitivityScale(settings.sensitivity);
    },
    swipe: (direction) => (cinematic.active ? cinematic.swipe(direction) : onSwipe(direction)),
    tapDown: () => (cinematic.active ? false : onTapDown()),
    tap: () => {
      if (!cinematic.active) onTap();
    },
  };
  let disposePointer = bindPointer(cvs, pointerActions);
  lifecycle.listen($('bPlay'), 'click', () => {
    audioInit();
    if (views.savedRun?.status === 'active') abandonSavedRun();
    openPanel('setup');
  });
  lifecycle.listen($('bContinue'), 'click', () => {
    audioInit();
    continueSavedRun();
  });
  lifecycle.listen($('bAbandon'), 'click', () => {
    audioInit();
    abandonSavedRun();
  });
  lifecycle.listen($('bDaily'), 'click', startDaily);
  lifecycle.listen($('bBegin'), 'click', () => {
    audioInit();
    G.panel = null;
    startRun();
  });

 function bindNavigation() {
  lifecycle.listen($('bArmory'), 'click', () => openPanel('armory'));
  lifecycle.listen($('bStats'), 'click', () => openPanel('stats'));
  lifecycle.listen($('bTemplate'), 'click', () => openPanel('template'));
  lifecycle.listen($('bTrials'), 'click', () => openPanel('trials'));
  const openOptions = () => {
    if (G.panel === 'options') return;
    openPanel('options');
    options.open();
  };
  lifecycle.listen($('bOptions'), 'click', openOptions);
  lifecycle.listen($('bPauseOptions'), 'click', openOptions);
  $('testBadge').hidden = !isTestProfile();
  lifecycle.listen(window, 'keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
      event.preventDefault();
      if (views.activeTrial) return;
      if (G.panel === 'admin') {
        closePanel();
        return;
      }
      pause();
      openPanel('admin');
    }
  });
  lifecycle.listen($('bAgain'), 'click', () => {
    if (G.overReady) {
      audioInit();
      startRun();
    }
  });
  lifecycle.listen($('bResume'), 'click', resume);
  lifecycle.listen($('bEnd'), 'click', endRun);
  lifecycle.listen($('pauseBtn'), 'pointerup', (e) => {
    e.stopPropagation();
    pause();
  });
  lifecycle.listen($('pauseBtn'), 'pointerdown', (e) => e.stopPropagation());
  lifecycle.listen($('bMenu'), 'click', toTitle);
  document.querySelectorAll('[data-back]').forEach((b) => lifecycle.listen(b, 'click', closePanel));
  const disposeKeyboard = bindKeyboard({
    active: () => pageActive() && !rewardScreen.open,
    bindings: () => settings.bindings,
    state: () => ({ phase: G.state, panelOpen: !!G.panel, overReady: G.overReady }),
    closePanel: () => (G.panel === 'options' ? options.back() : closePanel()),
    titleDirection: konamiInput,
    start: () => {
      audioInit();
      startRun();
    },
    resume,
    pause,
    swipe: onSwipe,
    tapDown: onTapDown,
    tap: onTap,
  });

 return disposeKeyboard;
 }
 return { disposePointer, bindNavigation };
}
