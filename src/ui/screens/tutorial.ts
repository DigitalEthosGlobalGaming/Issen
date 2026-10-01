import './tutorial.css';

/** A practice scene with its own clock, canvas and inputs. It never touches a run or profile. */
export function createTutorial(
  root: HTMLElement,
  onFinish: (status: 'completed' | 'skipped') => void,
  reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches,
) {
  const overlay = document.createElement('section');
  overlay.className = 'tutorial-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Blade practice');
  overlay.innerHTML = `<div class="tutorial-card">
    <div class="tutorial-top"><span>THE FIRST CUT · PRACTICE</span><button type="button" data-action="skip">Skip tutorial</button></div>
    <h2 class="tutorial-title"></h2><p class="tutorial-lesson"></p>
    <canvas class="tutorial-canvas" aria-label="Practice opponent and timing ring"></canvas>
    <p class="tutorial-cue" role="status" aria-live="polite"></p>
    <p class="tutorial-feedback" role="status" aria-live="polite"></p>
    <div class="tutorial-controls" aria-label="Practice controls">
      <button type="button" data-action="left" aria-label="Cut left">←</button>
      <button type="button" data-action="up" aria-label="Cut up">↑</button>
      <button type="button" data-action="down" aria-label="Cut down">↓</button>
      <button type="button" data-action="right" aria-label="Cut right">→</button>
      <button type="button" data-action="tap">Parry</button>
    </div><button type="button" class="tutorial-finish" data-action="finish" hidden>Continue to the journey</button>
    <p class="tutorial-note">Swipe or use arrows / WASD to cut. Tap or Space to parry. Escape skips. Practice earns no rewards.</p>
  </div>`;
  root.append(overlay);
  const canvas = overlay.querySelector<HTMLCanvasElement>('canvas')!;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Tutorial requires a 2D canvas context');
  const g = context;
  const title = overlay.querySelector<HTMLElement>('.tutorial-title')!;
  const lesson = overlay.querySelector<HTMLElement>('.tutorial-lesson')!;
  const cue = overlay.querySelector<HTMLElement>('.tutorial-cue')!;
  const feedback = overlay.querySelector<HTMLElement>('.tutorial-feedback')!;
  const controls = overlay.querySelector<HTMLElement>('.tutorial-controls')!;
  const finishButton = overlay.querySelector<HTMLButtonElement>('.tutorial-finish')!;
  const listeners = new AbortController();
  let active = false;
  let disposed = false;
  let step = 0;
  let started = 0;
  let frame = 0;
  let previousFocus: HTMLElement | null = null;
  let pointer: { x: number; y: number; id: number } | null = null;
  const lessons = [
    [
      '1 / 3 · Read the blade',
      'The arrow shows the direction of your cut. Cut RIGHT to meet this attack.',
    ],
    [
      '2 / 3 · Find the perfect moment',
      'Wait for the ring to reach the bright arc, then cut UP. A perfect cut earns more score.',
    ],
    [
      '3 / 3 · A duel',
      'A boss must be opened with a parry. Tap or press Space when the sword glints.',
    ],
    [
      '3 / 3 · Take the opening',
      'The parry has staggered the boss. Cut LEFT before the opening closes.',
    ],
    [
      'Your journey begins',
      'Read the direction, time your cut, and parry the boss glint. Mistakes cost lives in normal play; you can practise again from the menu.',
    ],
  ];
  function phase(now: number) {
    return ((now - started) % 2800) / 2800;
  }
  function ready(now: number) {
    return step === 0 || step === 3 || (phase(now) >= 0.62 && phase(now) < 0.94);
  }
  function setStep(next: number, message = '') {
    step = next;
    started = performance.now();
    title.textContent = lessons[step]![0]!;
    lesson.textContent = lessons[step]![1]!;
    feedback.textContent = message;
    overlay.dataset.step = String(step);
    overlay.dataset.ready = String(ready(started));
    controls.hidden = step === 4;
    finishButton.hidden = step !== 4;
    if (step === 4) finishButton.focus();
  }
  function finish(status: 'completed' | 'skipped') {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frame);
    overlay.hidden = true;
    pointer = null;
    previousFocus?.focus();
    onFinish(status);
  }
  function act(action: string) {
    if (!active) return;
    if (action === 'skip') return finish('skipped');
    if (action === 'finish' && step === 4) return finish('completed');
    const now = performance.now();
    if (step === 0 && action === 'right') setStep(1, 'Clean cut. Now try the timing.');
    else if (step === 1 && action === 'up' && ready(now)) setStep(2, 'Perfect. Now meet a boss.');
    else if (step === 2 && action === 'tap' && ready(now)) setStep(3, 'Parried! Cut left now.');
    else if (step === 3 && action === 'left' && now - started < 3200)
      setStep(4, 'A clean opening. You are ready.');
    else if (step < 4) {
      feedback.textContent =
        step === 0
          ? 'Follow the arrow: cut right.'
          : step === 1
            ? 'Cut up while the bright arc is lit. Try the next cycle.'
            : step === 2
              ? 'Wait for the gold glint, then tap or press Space.'
              : 'The opening needs a left cut. Try again.';
    }
  }
  function draw(now: number) {
    if (!active) return;
    if (step === 3 && now - started >= 3200)
      setStep(2, 'The opening closed. Parry the next glint and try again.');
    const bounds = canvas.getBoundingClientRect();
    const w = Math.max(1, bounds.width),
      h = Math.max(1, bounds.height);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) {
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    }
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.clearRect(0, 0, w, h);
    const lit = ready(now),
      x = w / 2,
      y = h * 0.5,
      r = Math.min(w * 0.27, h * 0.36);
    overlay.dataset.ready = String(lit);
    const nextCue =
      step === 0
        ? 'CUT RIGHT →'
        : step === 1
          ? lit
            ? 'PERFECT · CUT UP ↑'
            : 'Wait for the bright arc…'
          : step === 2
            ? lit
              ? 'GLINT · PARRY NOW'
              : 'Watch the sword…'
            : step === 3
              ? 'OPENING · CUT LEFT ←'
              : 'PRACTICE COMPLETE';
    if (cue.textContent !== nextCue) cue.textContent = nextCue;
    g.strokeStyle = '#6a6257';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(w * 0.1, h * 0.87);
    g.lineTo(w * 0.9, h * 0.87);
    g.stroke();
    g.fillStyle = '#252422';
    g.beginPath();
    g.arc(x, y - r * 0.6, r * 0.18, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x - r * 0.14, y - r * 0.35);
    g.lineTo(x + r * 0.14, y - r * 0.35);
    g.lineTo(x + r * 0.46, y + r * 0.65);
    g.lineTo(x - r * 0.4, y + r * 0.65);
    g.closePath();
    g.fill();
    g.strokeStyle = step === 2 && lit ? '#ffe1a1' : '#e0d8ca';
    g.lineWidth = step === 2 && lit ? 5 : 2;
    g.beginPath();
    g.moveTo(x - r * 0.05, y);
    g.lineTo(x + r * 0.62, y - r * 0.72);
    g.stroke();
    g.strokeStyle = '#655e52';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = lit ? '#efd098' : '#a59171';
    g.lineWidth = 6;
    g.beginPath();
    g.arc(x, y, r, -Math.PI / 2 + Math.PI * 2 * 0.62, -Math.PI / 2 + Math.PI * 2 * 0.94);
    g.stroke();
    if ((step === 1 || step === 2) && !reducedMotion()) {
      const angle = phase(now) * Math.PI * 2 - Math.PI / 2;
      g.fillStyle = '#fff3d7';
      g.beginPath();
      g.arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#fff3d7';
    g.font = `${Math.round(r * 0.5)}px Georgia`;
    g.textAlign = 'center';
    g.fillText(
      step === 0 ? '→' : step === 1 ? '↑' : step === 3 ? '←' : step === 4 ? '✓' : lit ? '✦' : '·',
      x,
      y + r * 0.25,
    );
    frame = requestAnimationFrame(draw);
  }
  function keyboard(event: KeyboardEvent) {
    if (!active) return;
    event.stopImmediatePropagation();
    if (event.type === 'keyup') return;
    if (event.key === 'Tab') {
      const buttons = [...overlay.querySelectorAll<HTMLButtonElement>('button')].filter(
        (b) => !b.hidden && !b.closest('[hidden]'),
      );
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      event.preventDefault();
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      return;
    }
    event.preventDefault();
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') act('skip');
    else if (key === 'enter') (document.activeElement as HTMLButtonElement)?.click();
    else if (key === ' ') act('tap');
    else
      act(
        (
          {
            arrowleft: 'left',
            a: 'left',
            arrowright: 'right',
            d: 'right',
            arrowup: 'up',
            w: 'up',
            arrowdown: 'down',
            s: 'down',
          } as Record<string, string>
        )[key] || '',
      );
  }
  function pointerInput(event: PointerEvent) {
    if (!active) return;
    event.stopImmediatePropagation();
    if (event.target !== canvas) return;
    event.preventDefault();
    if (event.type === 'pointerdown') {
      pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
      canvas.setPointerCapture(event.pointerId);
    } else if (event.type === 'pointerup' && pointer?.id === event.pointerId) {
      const dx = event.clientX - pointer.x,
        dy = event.clientY - pointer.y;
      pointer = null;
      act(
        Math.hypot(dx, dy) < 24
          ? 'tap'
          : Math.abs(dx) > Math.abs(dy)
            ? dx > 0
              ? 'right'
              : 'left'
            : dy > 0
              ? 'down'
              : 'up',
      );
    } else if (event.type === 'pointercancel') pointer = null;
  }
  for (const type of ['keydown', 'keyup'])
    window.addEventListener(type, keyboard as EventListener, {
      capture: true,
      signal: listeners.signal,
    });
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'])
    window.addEventListener(type, pointerInput as EventListener, {
      capture: true,
      signal: listeners.signal,
    });
  window.addEventListener(
    'click',
    (event) => {
      if (!active) return;
      event.stopImmediatePropagation();
      const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
      if (button && overlay.contains(button)) act(button.dataset.action!);
    },
    { capture: true, signal: listeners.signal },
  );
  return {
    start() {
      if (active || disposed) return;
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      active = true;
      overlay.hidden = false;
      setStep(0);
      overlay.querySelector<HTMLButtonElement>('button')!.focus();
      frame = requestAnimationFrame(draw);
    },
    dispose() {
      disposed = true;
      active = false;
      cancelAnimationFrame(frame);
      listeners.abort();
      overlay.remove();
    },
  };
}
