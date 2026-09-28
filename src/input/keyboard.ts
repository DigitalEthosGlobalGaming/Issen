import type { Direction } from '../shared/directions.ts';

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
}
const arrows: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};
const controls: Record<string, Direction> = {
  ...arrows,
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
};

export function bindKeyboard(actions: KeyboardActions): () => void {
  const listener = (event: KeyboardEvent) => {
    const { phase, panelOpen, overReady } = actions.state();
    if (panelOpen) {
      if (event.key === 'Escape') actions.closePanel();
      return;
    }
    const onButton = document.activeElement?.tagName === 'BUTTON';
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
      if (event.key === 'Escape' || event.key === 'p') actions.resume();
      return;
    }
    if (event.key === 'Escape' || event.key === 'p') {
      actions.pause();
      return;
    }
    const direction = controls[event.key];
    if (direction) {
      event.preventDefault();
      actions.swipe(direction);
    } else if (event.key === ' ') {
      event.preventDefault();
      if (!actions.tapDown()) actions.tap();
    }
  };
  window.addEventListener('keydown', listener);
  return () => window.removeEventListener('keydown', listener);
}
