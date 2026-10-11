import { autoplayAction } from '../../input/autoplay.ts';
import type { RunState } from '../../game/run-state.ts';
import type { Direction } from '../../shared/directions.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import { pageActive } from '../../platform/activity.ts';

interface AutoplayPorts {
  lifecycle: ReturnType<typeof createLifecycle>;
  G: RunState;
  blocked: () => boolean;
  ordered: () => boolean;
  mirrored: () => boolean;
  onSwipe: (direction: Direction) => void;
  onTapDown: () => boolean;
}

/** Mounted only by the development runtime; never advances pause or run menus. */
export function mountLocalAutoplay(doc: Document, ports: AutoplayPorts): void {
  const begin = doc.getElementById('bBegin');
  if (!begin) return;
  const option = doc.createElement('div');
  option.className = 'opt';
  option.innerHTML =
    '<label class="setup-toggle"><input id="setupAutoplay" type="checkbox"><span>Autoplay</span></label><div class="ds">Automatic cuts, parries and random blessings.</div>';
  begin.before(option);
  const checkbox = option.querySelector<HTMLInputElement>('input')!;
  const key = 'issen.dev.autoplay';
  try {
    checkbox.checked = doc.defaultView?.sessionStorage.getItem(key) === 'true';
  } catch {
    /* Storage is optional. */
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  const remember = () => {
    try {
      doc.defaultView?.sessionStorage.setItem(key, String(checkbox.checked));
    } catch {
      /* Storage is optional. */
    }
  };
  const tick = () => {
    timer = undefined;
    if (!checkbox.checked) return;
    try {
      if (!doc.hidden && pageActive() && !ports.G.panel && !ports.blocked()) {
        if (ports.G.state === 'shrine') {
          const buttons = Array.from(
            doc.querySelectorAll<HTMLButtonElement>('#shrine.on #blessList button'),
          ).filter((button) => !button.disabled && !button.hidden);
          buttons[Math.floor(Math.random() * buttons.length)]?.click();
        } else {
          const action = autoplayAction(
            ports.G,
            ports.G.state === 'playing' && ports.ordered(),
            ports.mirrored(),
          );
          if (action?.kind === 'swipe') ports.onSwipe(action.direction);
          else if (action?.kind === 'parry') ports.onTapDown();
        }
      }
    } catch (error) {
      checkbox.checked = false;
      remember();
      console.error('[Issen] Autoplay stopped after an input failure.', error);
    }
    if (checkbox.checked) timer = ports.lifecycle.timeout(tick, 16);
  };
  ports.lifecycle.listen(checkbox, 'change', () => {
    remember();
    if (timer !== undefined) ports.lifecycle.clearTimeout(timer);
    tick();
  });
  ports.lifecycle.add(() => option.remove());
  tick();
}
