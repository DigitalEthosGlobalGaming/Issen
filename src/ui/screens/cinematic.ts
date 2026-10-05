import { activeNow } from '../../platform/activity.ts';
import { controlKey, keyLabel } from '../../platform/settings.ts';
import type { Bindings } from '../../platform/settings.ts';
import type { DriftMode } from '../../rendering/scene/drift-renderer.ts';

interface CinematicActions {
  canOpen(): boolean;
  stage(): number;
  scenes: string[];
  bindings(): Bindings;
  film(): string;
  drift(): DriftMode;
  setDrift(mode: DriftMode): void;
  films(): { id: string; n: string }[];
  enter(stage: number): void;
  scene(stage: number): void;
  leave(): void;
  grade(value: string): void;
}
const SESSION_KEY = 'issen.cinematic';
/** Per-tab scene viewer. Its choices never write player equipment or run checkpoints. */
export function createCinematic(app: HTMLElement, actions: CinematicActions) {
  const doc = app.ownerDocument,
    win = doc.defaultView!;
  const events = new AbortController();
  const root = doc.createElement('section');
  root.id = 'cinematic';
  root.hidden = true;
  root.setAttribute('aria-label', 'Cinematic scene viewer');
  root.innerHTML = `<button type="button" class="cinematic-exit">Exit</button>
    <div class="cinematic-toolbar"><div class="cinematic-scenes"><button type="button" aria-label="Previous scene">←</button><span role="status"></span><button type="button" aria-label="Next scene">→</button></div>
    <div class="cinematic-looks"><label>Film <select aria-label="Preview film"></select></label>
    <label>Debris <select aria-label="Preview debris"><option value="sprites">Sprites</option><option value="shape">Reusable shape</option><option value="original">Original curves</option></select></label></div><small></small></div>`;
  app.append(root);
  const buttons = root.querySelectorAll('button');
  const exit = buttons[0]!,
    previous = buttons[1]!,
    next = buttons[2]!;
  const label = root.querySelector('[role="status"]')!;
  const help = root.querySelector('small')!;
  const film = root.querySelector<HTMLSelectElement>('[aria-label="Preview film"]')!;
  const drift = root.querySelector<HTMLSelectElement>('[aria-label="Preview debris"]')!;
  drift.addEventListener(
    'change',
    () => {
      actions.setDrift(drift.value as DriftMode);
      root.dataset.debris = drift.value;
    },
    { signal: events.signal },
  );
  function refreshFilms() {
    film.replaceChildren();
    for (const item of actions.films()) {
      const option = doc.createElement('option');
      option.value = item.id;
      option.textContent = item.n;
      film.append(option);
    }
  }

  let active = false,
    scene = 0,
    clicks = 0,
    lastClick = 0;
  let stored: { active: true; scene: number; film?: string } | null = null;
  try {
    const value = JSON.parse(win.sessionStorage.getItem(SESSION_KEY) ?? 'null');
    if (
      value?.active === true &&
      Number.isInteger(value.scene) &&
      value.scene >= 0 &&
      value.scene < actions.scenes.length
    )
      stored = value;
  } catch {
    /* Storage is optional in embedded/private browsers. */
  }
  function save() {
    try {
      if (active)
        win.sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ active: true, scene, film: film.value }),
        );
      else win.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* Preview remains usable without session storage. */
    }
  }
  function refresh() {
    label.textContent = `${scene + 1} / ${actions.scenes.length} · ${actions.scenes[scene]}`;
    const bindings = actions.bindings();
    help.textContent = `Swipe or ${bindings.left.map(keyLabel).join('/')} · ${bindings.right.map(keyLabel).join('/')} to change scene. Escape to exit. Rebind Cut left/right in Options → Controls.`;
    root.dataset.scene = String(scene);
  }
  function open(target = actions.stage()) {
    if (active || !actions.canOpen()) return;
    active = true;
    scene = target;
    clicks = 0;
    refreshFilms();
    film.value = actions.film();
    drift.value = actions.drift();
    root.dataset.debris = drift.value;
    actions.enter(scene);
    root.hidden = false;
    app.classList.add('cinematic-active');
    refresh();
    save();
    exit.focus({ preventScroll: true });
  }
  function close() {
    if (!active) return;
    active = false;
    actions.leave();
    root.hidden = true;
    app.classList.remove('cinematic-active');
    save();
    doc.querySelector<HTMLElement>('#title .t-k')?.focus({ preventScroll: true });
  }
  function move(delta: number) {
    if (!active) return;
    scene = (scene + delta + actions.scenes.length) % actions.scenes.length;
    actions.scene(scene);
    refresh();
    save();
  }
  exit.addEventListener('click', close, { signal: events.signal });
  previous.addEventListener('click', () => move(-1), { signal: events.signal });
  next.addEventListener('click', () => move(1), { signal: events.signal });
  film.addEventListener(
    'change',
    () => {
      actions.grade(film.value);
      save();
    },
    { signal: events.signal },
  );
  win.addEventListener(
    'keydown',
    (event) => {
      if (!active) return;
      event.stopImmediatePropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab') {
        const controls = Array.from(root.querySelectorAll<HTMLElement>('button, select'));
        const index = controls.indexOf(doc.activeElement as HTMLElement);
        event.preventDefault();
        controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length]?.focus();
        return;
      }
      if (
        ['SELECT', 'INPUT', 'TEXTAREA'].includes(doc.activeElement?.tagName ?? '') ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.repeat
      )
        return;
      const key = controlKey(event.key),
        bindings = actions.bindings();
      if (key && bindings.left.includes(key)) {
        event.preventDefault();
        move(-1);
      } else if (key && bindings.right.includes(key)) {
        event.preventDefault();
        move(1);
      } else if (key && bindings.pause.includes(key)) {
        event.preventDefault();
        close();
      }
    },
    { capture: true, signal: events.signal },
  );
  win.addEventListener(
    'issen:back',
    (event) => {
      if (active) {
        event.stopImmediatePropagation();
        close();
      }
    },
    { capture: true, signal: events.signal },
  );
  return {
    get active() {
      return active;
    },
    get restores() {
      return !!stored;
    },
    restore() {
      if (stored) {
        const value = stored;
        open(value.scene);
        if (value.film && actions.films().some((item) => item.id === value.film)) {
          film.value = value.film;
          actions.grade(value.film);
        }
        save();
        stored = null;
      }
    },
    open,
    logoTap() {
      const now = activeNow();
      clicks = now - lastClick < 600 ? clicks + 1 : 1;
      lastClick = now;
      if (clicks >= 3) open();
    },
    swipe(direction: string) {
      if (direction === 'left') move(1);
      else if (direction === 'right') move(-1);
    },
    dispose() {
      events.abort();
      root.remove();
      app.classList.remove('cinematic-active');
    },
  };
}
