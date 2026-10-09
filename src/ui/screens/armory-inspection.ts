import { drawingPixelRatio } from '../../presentation/viewport.ts';
/** One canvas moves into a modal; equipment and preview effects keep their owner. */
export function createArmoryInspection(root: HTMLElement, canvas: HTMLCanvasElement) {
  const doc = root.ownerDocument,
    win = doc.defaultView!;
  const home = doc.createComment('Armoury preview');
  canvas.after(home);
  const dialog = doc.createElement('dialog');
  dialog.className = 'arm-inspection';
  dialog.setAttribute('aria-label', 'Equipment inspection');
  dialog.innerHTML =
    '<button type="button" class="btn arm-inspection-close" aria-label="Close inspection">Done</button>';
  root.append(dialog);
  const closeButton = dialog.querySelector<HTMLButtonElement>('button')!;
  let previousFocus: HTMLElement | null = null;
  let pendingBack = false;
  const token = 'armory-' + Math.random().toString(36).slice(2);
  function resize() {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = drawingPixelRatio(doc, bounds.width, bounds.height, win.devicePixelRatio || 1);
    const width = Math.round(bounds.width * dpr),
      height = Math.round(bounds.height * dpr);
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const restore = () => {
    home.parentNode?.insertBefore(canvas, home);
    canvas.setAttribute('aria-expanded', 'false');
    previousFocus?.focus({ preventScroll: true });
    resize();
  };
  function close() {
    if (!dialog.open) return;
    dialog.close();
    restore();
    if (win.history.state?.issenInspection === token) {
      pendingBack = true;
      win.history.back();
    }
  }
  function open() {
    if (dialog.open || pendingBack) return;
    previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    dialog.append(canvas);
    canvas.setAttribute('aria-expanded', 'true');
    win.history.pushState({ ...win.history.state, issenInspection: token }, '');
    dialog.showModal();
    closeButton.focus();
    resize();
  }
  const onBack = () => {
    pendingBack = false;
    if (dialog.open && win.history.state?.issenInspection !== token) {
      dialog.close();
      restore();
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (dialog.open && event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    } else if (
      !dialog.open &&
      event.target === canvas &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    }
  };
  const onCancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('aria-label', 'Inspect equipment');
  canvas.setAttribute('aria-haspopup', 'dialog');
  canvas.setAttribute('aria-expanded', 'false');
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', onCancel);
  win.addEventListener('popstate', onBack);
  win.addEventListener('keydown', onKey, true);
  return {
    open,
    get expanded() {
      return dialog.open;
    },
    dispose() {
      close();
      observer.disconnect();
      win.removeEventListener('popstate', onBack);
      win.removeEventListener('keydown', onKey, true);
      closeButton.removeEventListener('click', close);
      dialog.removeEventListener('cancel', onCancel);
      dialog.remove();
      home.remove();
    },
  };
}
