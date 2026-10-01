import type { Direction } from '../shared/directions.ts';
import { defaultSettings, controlKey } from '../platform/settings.ts';
import type { Bindings } from '../platform/settings.ts';

export interface KeyboardActions {
  state(): { phase: string; panelOpen: boolean; overReady: boolean };
  closePanel(): void;
  titleDirection(direction: Direction): void;
  start(): void;
  resume(): void;
  pause(): void;
  swipe(direction: Direction): void;
  tapDown(): boolean;
  tap(): void;
  bindings?(): Bindings;
  toggleRenderer?(): void;
}
const arrows: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
export function bindKeyboard(actions: KeyboardActions): () => void {
  const listener = (event: KeyboardEvent) => {
    const { phase, panelOpen, overReady } = actions.state();
    const bindings = actions.bindings?.() ?? defaultSettings().bindings;
    const key = controlKey(event.key);
    const pauseKey = event.key === 'Escape' || (!!key && bindings.pause.includes(key));
    if (panelOpen) {
      if (event.key === 'Escape') actions.closePanel();
      return;
    }
    const editable =
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '') ||
      (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable);
    // Keep custom combat bindings authoritative; ignore held keys and typing.
    if (
      event.code === 'Backquote' &&
      !event.repeat &&
      !event.isComposing &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !editable &&
      !(key && Object.values(bindings).some((keys) => keys.includes(key))) &&
      actions.toggleRenderer
    ) {
      event.preventDefault();
      actions.toggleRenderer();
      return;
    }
    const onButton = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
      document.activeElement?.tagName ?? '',
    );
    const startKey = event.key === 'Enter' || event.key === ' ';
    if (phase === 'title') {
      const direction = arrows[event.key];
      if (direction) {
        actions.titleDirection(direction);
        return;
      }
      if (!onButton && startKey) {
        event.preventDefault();
        actions.start();
      }
      return;
    }
    if (phase === 'over') {
      if (!onButton && overReady && startKey) {
        event.preventDefault();
        actions.start();
      }
      return;
    }
    if (phase === 'paused') {
      if (pauseKey) actions.resume();
      return;
    }
    if (
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '')
    )
      return;
    if (pauseKey) {
      event.preventDefault();
      actions.pause();
      return;
    }
    const direction = key
      ? (['up', 'down', 'left', 'right'] as Direction[]).find((dir) => bindings[dir].includes(key))
      : undefined;
    if (direction) {
      event.preventDefault();
      actions.swipe(direction);
    } else if (key && bindings.tap.includes(key)) {
      event.preventDefault();
      if (!actions.tapDown()) actions.tap();
    }
  };
  window.addEventListener('keydown', listener);
  return () => window.removeEventListener('keydown', listener);
}
