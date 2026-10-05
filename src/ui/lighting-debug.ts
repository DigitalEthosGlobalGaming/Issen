import type { createLightingRig } from '../rendering/lighting-rig.ts';

/** Non-modal, session-only lighting controls; does not mutate profile or gameplay state. */
export function createLightingDebug(
  app: HTMLElement,
  rig: ReturnType<typeof createLightingRig>,
  canvas: () => HTMLCanvasElement,
  invalidate: () => void,
) {
  const doc = app.ownerDocument,
    win = doc.defaultView!;
  const events = new AbortController();
  const root = doc.createElement('aside');
  root.id = 'lighting-debug';
  root.hidden = true;
  root.setAttribute('aria-label', 'Lighting debug');
  root.innerHTML = `<header><strong>Lighting</strong><button type="button" aria-label="Close lighting debug">×</button></header>
    <label><input type="checkbox" data-setting="enabled" checked> Lighting enabled</label>
    <p>Drag the light marker or adjust its position.</p>
    <div class="lighting-controls"></div>
    <label>Light colour <input aria-label="Light colour" type="color" value="${rig.state.color}"></label>
    <button type="button" class="lighting-reset">Reset light</button><small>~ to toggle · Escape to close</small>`;
  const marker = doc.createElement('button');
  marker.type = 'button';
  marker.id = 'lighting-marker';
  marker.hidden = true;
  marker.textContent = '☀';
  marker.setAttribute('aria-label', 'Drag light position');
  app.append(root, marker);
  const controls = root.querySelector('.lighting-controls')!;
  type Numeric = 'x' | 'y' | 'height' | 'radius' | 'intensity' | 'ambient';
  const fields: [Numeric, string, number, number][] = [
    ['x', 'Light X', 0, 1],
    ['y', 'Light Y', 0, 1],
    ['height', 'Light height', 0.01, 1],
    ['radius', 'Light radius', 0.1, 3],
    ['intensity', 'Light intensity', 0, 8],
    ['ambient', 'Ambient light', 0, 1.5],
  ];
  for (const [key, label, min, max] of fields) {
    const row = doc.createElement('label');
    row.innerHTML = `${label}<output></output><input type="range" aria-label="${label}" data-setting="${key}" min="${min}" max="${max}" step="0.01">`;
    controls.append(row);
  }
  const inputs = [...root.querySelectorAll<HTMLInputElement>('input')];
  const position = () => {
    if (root.hidden) return;
    const bounds = canvas().getBoundingClientRect();
    marker.style.left = `${bounds.left + rig.state.x * bounds.width}px`;
    marker.style.top = `${bounds.top + rig.state.y * bounds.height}px`;
    marker.style.color = rig.state.color;
    root.querySelector('p')!.textContent =
      canvas().dataset.graphicsBackend === 'pixi'
        ? 'Drag the light marker or adjust its position.'
        : 'Lighting requires WebGL. This view uses Canvas.';
  };
  function sync() {
    for (const input of inputs) {
      const key = input.dataset.setting as Numeric | 'enabled' | undefined;
      if (!key) {
        input.value = rig.state.color;
        continue;
      }
      if (key === 'enabled') input.checked = rig.state.enabled;
      else {
        input.value = String(rig.state[key]);
        input.parentElement!.querySelector('output')!.textContent = rig.state[key].toFixed(2);
      }
    }
    position();
  }
  let previous: HTMLElement | null = null;
  function close() {
    root.hidden = marker.hidden = true;
    if (previous?.isConnected) previous.focus({ preventScroll: true });
  }
  root.querySelector('header button')!.addEventListener('click', close, { signal: events.signal });
  root.querySelector('.lighting-reset')!.addEventListener(
    'click',
    () => {
      rig.reset();
      sync();
      invalidate();
    },
    { signal: events.signal },
  );
  for (const input of inputs)
    input.addEventListener(
      'input',
      () => {
        const key = input.dataset.setting as Numeric | 'enabled' | undefined;
        if (!key) rig.state.color = input.value;
        else if (key === 'enabled') rig.state.enabled = input.checked;
        else rig.state[key] = Number(input.value);
        sync();
        invalidate();
      },
      { signal: events.signal },
    );
  let dragging = false;
  marker.addEventListener(
    'pointerdown',
    (event) => {
      dragging = true;
      marker.setPointerCapture(event.pointerId);
      event.stopPropagation();
      event.preventDefault();
    },
    { signal: events.signal },
  );
  marker.addEventListener(
    'pointermove',
    (event) => {
      if (!dragging) return;
      const bounds = canvas().getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      rig.state.x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      rig.state.y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      event.stopPropagation();
      sync();
      invalidate();
    },
    { signal: events.signal },
  );
  marker.addEventListener(
    'lostpointercapture',
    () => {
      dragging = false;
    },
    { signal: events.signal },
  );
  marker.addEventListener(
    'pointerup',
    (event) => {
      dragging = false;
      event.stopPropagation();
    },
    { signal: events.signal },
  );
  marker.addEventListener('click', (event) => event.stopPropagation(), { signal: events.signal });
  win.addEventListener('resize', position, { signal: events.signal });
  win.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && !root.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        close();
        return;
      }
      if (event.code !== 'Backquote' && event.key !== '`' && event.key !== '~') return;
      if (event.ctrlKey || event.altKey || event.metaKey || event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]') &&
        !root.contains(target)
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!root.hidden) close();
      else {
        previous = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
        root.hidden = marker.hidden = false;
        sync();
        root.querySelector<HTMLButtonElement>('header button')!.focus({ preventScroll: true });
      }
    },
    { capture: true, signal: events.signal },
  );
  sync();
  return {
    refresh: position,
    dispose() {
      events.abort();
      root.remove();
      marker.remove();
    },
  };
}
