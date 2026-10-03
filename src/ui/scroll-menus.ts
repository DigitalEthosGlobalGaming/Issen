import type { Settings } from '../platform/settings.ts';

/** Menu-only presentation: observers never delay navigation or gameplay callbacks. */
export function createScrollMenus(root: HTMLElement) {
  const win = root.ownerDocument.defaultView!;
  const screens = Array.from(
    root.querySelectorAll<HTMLElement>('.screen:not(#title):not(#cinematic)'),
  );
  const active = new Map<HTMLElement, boolean>();
  const timers = new Map<HTMLElement, number>();
  const inertBeforeExit = new Map<HTMLElement, boolean>();
  const surfaces = screens.flatMap((screen) => {
    const sheet = screen.firstElementChild;
    if (!sheet) return [];
    const surface = root.ownerDocument.createElement('span');
    surface.className = 'scroll-paper';
    surface.dataset.scrollScreen = screen.id;
    surface.setAttribute('aria-hidden', 'true');
    sheet.prepend(surface);
    return [surface];
  });
  let enabled = false;
  let reducedMotion = false;
  function visible(screen: HTMLElement) {
    return !screen.hidden && screen.classList.contains('on');
  }
  function clear(screen: HTMLElement) {
    win.clearTimeout(timers.get(screen));
    timers.delete(screen);
    screen.classList.remove('scroll-entering', 'scroll-leaving');
    if (inertBeforeExit.has(screen)) {
      screen.inert = inertBeforeExit.get(screen)!;
      inertBeforeExit.delete(screen);
    }
  }
  function sync() {
    for (const screen of screens) {
      const sheet = screen.firstElementChild;
      const surface = surfaces.find((node) => node.dataset.scrollScreen === screen.id);
      if (enabled && sheet && surface && surface.parentElement !== sheet) sheet.prepend(surface);
      const next = visible(screen);
      const previous = active.get(screen) ?? false;
      active.set(screen, next);
      if (!enabled || reducedMotion || next === previous) continue;
      clear(screen);
      screen.classList.add(next ? 'scroll-entering' : 'scroll-leaving');
      if (!next) {
        inertBeforeExit.set(screen, screen.inert);
        screen.inert = true;
      }
      // Exiting menus keep only their paint; hidden/on state continues to own input.
      timers.set(
        screen,
        win.setTimeout(() => clear(screen), next ? 420 : 240),
      );
    }
  }
  const observer = new MutationObserver(sync);
  for (const screen of screens) {
    active.set(screen, visible(screen));
    observer.observe(screen, {
      attributes: true,
      attributeFilter: ['class', 'hidden'],
      childList: true,
      subtree: true,
    });
  }
  return {
    update(style: Settings['menuStyle'], motionReduced: boolean) {
      const changed = enabled !== (style === 'scroll') || reducedMotion !== motionReduced;
      enabled = style === 'scroll';
      reducedMotion = motionReduced;
      root.dataset.menuStyle = style;
      if (changed)
        for (const screen of screens) {
          clear(screen);
          active.set(screen, visible(screen));
        }
      sync();
    },
    dispose() {
      observer.disconnect();
      for (const screen of screens) clear(screen);
      for (const surface of surfaces) surface.remove();
      delete root.dataset.menuStyle;
    },
  };
}
