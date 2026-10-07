// Test-build instrumentation only; never imported by the normal application.
export function initProbe({
  reduced = false,
  diagnostic = false,
  seed: initialSeed = 424242,
} = {}) {
  let seed = initialSeed;
  window.__resetProfileRandom = () => {
    seed = initialSeed;
  };
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  // Fresh context only. Fix run seed without changing application code.
  crypto.getRandomValues = (a) => {
    for (let i = 0; i < a.length; i++) a[i] = initialSeed + i;
    return a;
  };
  localStorage.setItem('issen.stats', JSON.stringify({ runs: 1, roninWave: 10 }));
  localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  localStorage.setItem(
    'issen.settings',
    JSON.stringify({
      version: 1,
      quality: 'high',
      reducedMotion: reduced ? 'on' : 'off',
      reducedFlashes: reduced ? 'on' : 'off',
    }),
  );
  const p = (window.__probe = {
    frames: [],
    updates: [],
    renders: [],
    previews: [],
    previewFrames: [],
    lastPreview: 0,
    last: 0,
    measure: false,
    canvases: [],
    images: [],
    draws: {},
    reads: 0,
    gradients: 0,
    contexts: [],
    diagnostic,
    longTasks: [],
  });
  if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
    new PerformanceObserver((list) => {
      if (p.measure)
        p.longTasks.push(
          ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
        );
    }).observe({ type: 'longtask' });
  }
  p.run = (name, fn) => {
    const t = performance.now();
    if (name === 'previews' && p.measure) {
      if (p.lastPreview) p.previewFrames.push(t - p.lastPreview);
      p.lastPreview = t;
    }
    const result = fn();
    if (p.measure) p[name].push(performance.now() - t);
    return result;
  };
  p.frame = () => {
    const t = performance.now();
    if (p.measure && p.last) p.frames.push(t - p.last);
    p.last = t;
  };
  p.reset = () => {
    for (const k of ['frames', 'updates', 'renders', 'previews', 'previewFrames']) p[k] = [];
    p.lastPreview = 0;
    p.longTasks = [];
    p.draws = {};
    p.reads = 0;
    p.gradients = 0;
    p.last = 0;
    p.measure = true;
  };
  const create = document.createElement.bind(document);
  document.createElement = function (...a) {
    const e = create(...a);
    if (a[0] === 'canvas') p.canvases.push(new WeakRef(e));
    return e;
  };
  const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    ...src,
    set(v) {
      p.images.push(new WeakRef(this));
      src.set.call(this, v);
    },
  });
  const Audio = window.AudioContext;
  window.AudioContext = class extends Audio {
    constructor(...a) {
      super(...a);
      p.contexts.push(this);
    }
  };
  p.installCounters = () => {
    for (const method of [
      'drawImage',
      'getImageData',
      'createLinearGradient',
      'createRadialGradient',
    ]) {
      const original = CanvasRenderingContext2D.prototype[method];
      CanvasRenderingContext2D.prototype[method] = function (...a) {
        if (p.measure) {
          if (method === 'drawImage') {
            const key = this.canvas.id || 'offscreen';
            p.draws[key] = (p.draws[key] || 0) + 1;
          } else if (method === 'getImageData') p.reads++;
          else p.gradients++;
        }
        return original.apply(this, a);
      };
    }
  };
  if (diagnostic) p.installCounters();
  p.memory = () => {
    const canvases = new Set([
      ...document.querySelectorAll('canvas'),
      ...p.canvases.map((r) => r.deref()).filter(Boolean),
    ]);
    const images = new Set(p.images.map((r) => r.deref()).filter(Boolean));
    const sources = new Map([...images].map((i) => [i.src, i.naturalWidth * i.naturalHeight * 4]));
    return {
      canvasCount: canvases.size,
      canvasBytes: [...canvases].reduce((n, c) => n + c.width * c.height * 4, 0),
      imageObjects: images.size,
      uniqueDecodedSources: sources.size,
      uniqueImageBytes: [...sources.values()].reduce((a, b) => a + b, 0),
      imageObjectBytes: [...images].reduce((n, i) => n + i.naturalWidth * i.naturalHeight * 4, 0),
    };
  };
}
