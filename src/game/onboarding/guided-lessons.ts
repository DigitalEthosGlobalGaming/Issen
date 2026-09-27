import type { Direction } from '../../shared/directions.ts';
import { createGuidedLessonState, parseGuidedLessons } from './guided-state.ts';
import type { GuidedLessonProgress } from './guided-state.ts';
import './guided-lessons.css';

export { parseGuidedLessons };
export type { GuidedLessonProgress };

/** Presentation and input guard only. The runtime owns enemy and boss simulation. */
export function createGuidedLessons(
  host: HTMLElement,
  saved: unknown,
  persist: (value: GuidedLessonProgress) => void,
  freezeChanged: (frozen: boolean) => void = () => {},
) {
  const overlay = host.ownerDocument.createElement('div');
  overlay.className = 'guided-overlay';
  overlay.hidden = true;
  overlay.innerHTML = `<section class="guided-card" aria-labelledby="guided-title" aria-describedby="guided-instruction">
    <span class="guided-eyebrow">A new technique</span>
    <h2 id="guided-title"></h2>
    <p id="guided-instruction"></p>
    <p class="guided-feedback" role="status" aria-live="polite"></p>
    <button type="button" class="guided-continue">I’m ready</button>
  </section>`;
  host.append(overlay);
  const title = overlay.querySelector<HTMLElement>('#guided-title')!;
  const instruction = overlay.querySelector<HTMLElement>('#guided-instruction')!;
  const feedback = overlay.querySelector<HTMLElement>('.guided-feedback')!;
  const continueButton = overlay.querySelector<HTMLButtonElement>('.guided-continue')!;

  let lastFrozen = false;
  const lesson = createGuidedLessonState(saved, persist, (next, frozen) => {
    render(next);
    if (frozen !== lastFrozen) freezeChanged(frozen);
    lastFrozen = frozen;
  });
  function render(next: ReturnType<typeof createGuidedLessonState>['phase']) {
    overlay.hidden = next === 'idle';
    overlay.classList.toggle(
      'guided-passive',
      next === 'order-practice' || next === 'boss-wait' || next === 'boss-ready',
    );
    continueButton.hidden = next !== 'order-read' && next !== 'boss-read';
    feedback.textContent = '';
    if (next === 'order-read') {
      title.textContent = 'The front of the pack';
      instruction.textContent =
        'When enemies bear numbered seals, cut the one marked 一 first. Watch its blade direction.';
    } else if (next === 'order-practice') {
      title.textContent = 'Cut the front enemy';
      instruction.textContent =
        'Swipe in the direction of the front enemy’s blade, or use an arrow / WASD key. Time is stopped while you learn.';
    } else if (next === 'boss-read') {
      title.textContent = 'The boss’s glint';
      instruction.textContent =
        'Wait for the boss’s sword to glint. Then tap the arena or press Space to parry. An early tap is unsafe outside this lesson.';
    } else if (next === 'boss-wait') {
      title.textContent = 'Watch for the glint';
      instruction.textContent =
        'The duel is slowed. Wait until the sword glints before tapping or pressing Space.';
    } else if (next === 'boss-ready') {
      title.textContent = 'Parry now';
      instruction.textContent = 'The glint is held for you. Tap the arena or press Space.';
    }
  }
  function advanceReading(event?: Event) {
    event?.stopPropagation();
    lesson.advanceReading();
  }
  const onKey = (event: KeyboardEvent) => {
    if (lesson.phase !== 'order-read' && lesson.phase !== 'boss-read') return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    advanceReading();
  };
  continueButton.addEventListener('click', advanceReading);
  host.ownerDocument.defaultView?.addEventListener('keydown', onKey, true);

  return {
    get frozen() {
      return lesson.frozen;
    },
    get scale() {
      return lesson.scale;
    },
    get phase() {
      return lesson.phase;
    },
    get progress() {
      return lesson.progress;
    },
    startOrder: lesson.startOrder,
    startBoss: lesson.startBoss,
    bossFlash: lesson.bossFlash,
    /** True consumes the swipe. An incorrect practice cut cannot kill the player. */
    swipe(direction: Direction, expected: Direction | null): boolean {
      const result = lesson.swipe(direction, expected);
      if (result.retry)
        feedback.textContent = expected
          ? 'That is not the front blade’s direction. Try again.'
          : 'Wait for the front enemy.';
      return result.consumed;
    },
    orderSucceeded: lesson.orderSucceeded,
    /** True consumes an early practice tap before combat sees it. */
    tap(): boolean {
      if (lesson.phase === 'boss-wait') {
        feedback.textContent = 'Not yet. Wait for the glint.';
      }
      return lesson.tap();
    },
    bossParried: lesson.bossParried,
    reset: lesson.reset,
    dispose() {
      host.ownerDocument.defaultView?.removeEventListener('keydown', onKey, true);
      overlay.remove();
    },
  };
}
