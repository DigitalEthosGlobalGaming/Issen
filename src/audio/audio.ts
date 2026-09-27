import { clamp } from '../shared/math.ts';
interface Envelope {
  f0: number;
  f1?: number;
  dur: number;
  g: number;
  delay?: number;
  a?: number;
}
export interface ToneOptions extends Envelope {
  type?: OscillatorType;
}
interface NoiseOptions extends Envelope {
  type?: BiquadFilterType;
  q?: number;
}
interface AudioState {
  ctx: AudioContext | null;
  master: GainNode | null;
  noise: AudioBuffer | null;
  wg: GainNode | null;
  wbp: BiquadFilterNode | null;
  muted: boolean;
  wt: number;
  at: number;
}
export function createAudio(initialMuted: boolean) {
  const R = Math.random;
  const A: AudioState = {
    ctx: null,
    master: null,
    noise: null,
    wg: null,
    wbp: null,
    muted: initialMuted,
    wt: 0,
    at: 0,
  };
  function audioInit() {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return;
    }
    const Ctor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      const c = new Ctor();
      A.ctx = c;
      A.master = c.createGain();
      A.master.gain.value = A.muted ? 0 : 0.9;
      const comp = c.createDynamicsCompressor();
      A.master.connect(comp);
      comp.connect(c.destination);
      const len = c.sampleRate * 2,
        buf = c.createBuffer(1, len, c.sampleRate),
        d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      A.noise = buf;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 420;
      bp.Q.value = 0.6;
      const wg = c.createGain();
      wg.gain.value = 0;
      src.connect(bp);
      bp.connect(wg);
      wg.connect(A.master);
      src.start();
      A.wg = wg;
      A.wbp = bp;
    } catch (e) {
      A.ctx = null;
    }
  }
  function nz(o: NoiseOptions) {
    const c = A.ctx;
    if (!c || !A.noise || !A.master) return;
    const t = c.currentTime + (o.delay || 0);
    const s = c.createBufferSource();
    s.buffer = A.noise;
    const f = c.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q == null ? 1 : o.q;
    f.frequency.setValueAtTime(o.f0, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(o.g, t + (o.a || 0.005));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(f);
    f.connect(gn);
    gn.connect(A.master);
    s.start(t, Math.random() * 1.5);
    s.stop(t + o.dur + 0.05);
  }
  function tn(o: ToneOptions) {
    const c = A.ctx;
    if (!c || !A.master) return;
    const t = c.currentTime + (o.delay || 0);
    const os = c.createOscillator();
    os.type = o.type || 'sine';
    os.frequency.setValueAtTime(o.f0, t);
    if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(o.g, t + (o.a || 0.004));
    gn.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    os.connect(gn);
    gn.connect(A.master);
    os.start(t);
    os.stop(t + o.dur + 0.05);
  }
  const sfx = {
    slice() {
      nz({ f0: 900, f1: 4200, dur: 0.16, g: 0.5, q: 0.8 });
      nz({ type: 'highpass', f0: 4500, dur: 0.07, g: 0.35, delay: 0.05 });
      tn({ f0: 150, f1: 50, dur: 0.2, g: 0.5, delay: 0.05 });
    },
    perfect() {
      this.slice();
      [1760, 2637, 3520].forEach((f, i) =>
        tn({ f0: f, dur: 1.1 - i * 0.25, g: 0.13 / (i + 1), a: 0.003 }),
      );
      tn({ f0: 90, f1: 40, dur: 0.5, g: 0.6 });
    },
    whoosh() {
      nz({ f0: 500, f1: 2200, dur: 0.22, g: 0.3, q: 0.7 });
    },
    clang() {
      [523, 1331, 2217, 3163, 4410].forEach((f, i) =>
        tn({ f0: f, dur: 0.95 - i * 0.13, g: 0.24 / (i * 0.6 + 1), a: 0.002 }),
      );
      nz({ type: 'highpass', f0: 3000, dur: 0.08, g: 0.5 });
    },
    glint() {
      tn({ f0: 2400, f1: 3600, dur: 0.3, g: 0.13 });
      tn({ f0: 4800, f1: 5300, dur: 0.22, g: 0.05 });
      nz({ type: 'highpass', f0: 6000, dur: 0.25, g: 0.14 });
    },
    death() {
      tn({ f0: 90, f1: 32, dur: 1.3, g: 0.85 });
      nz({ type: 'lowpass', f0: 1400, f1: 120, dur: 1.3, g: 0.6, q: 0.5 });
      nz({ f0: 1500, f1: 5200, dur: 0.18, g: 0.5 });
    },
    drum() {
      for (const d of [0, 0.26]) {
        tn({ f0: 115, f1: 46, dur: 0.55, g: 0.9, delay: d });
        nz({ type: 'lowpass', f0: 600, dur: 0.12, g: 0.35, delay: d });
      }
    },
    feint() {
      tn({ f0: 900, f1: 560, dur: 0.09, g: 0.1, type: 'triangle' });
      nz({ f0: 2200, dur: 0.06, g: 0.18 });
    },
    step() {
      nz({ type: 'lowpass', f0: 420, dur: 0.14, g: 0.3 });
    },
    deflect() {
      tn({ f0: 780, f1: 620, dur: 0.25, g: 0.12, type: 'triangle' });
      nz({ type: 'highpass', f0: 2500, dur: 0.06, g: 0.25 });
    },
    bossDie() {
      tn({ f0: 70, f1: 28, dur: 1.8, g: 0.9 });
      nz({ type: 'lowpass', f0: 900, f1: 90, dur: 1.8, g: 0.5, q: 0.5 });
    },
    thunder() {
      const d = 0.15 + R() * 0.4;
      nz({ type: 'lowpass', f0: 1400, f1: 200, dur: 0.5, g: 0.45, delay: d });
      nz({ type: 'lowpass', f0: 320, f1: 50, dur: 2.4, g: 0.8, q: 0.3, delay: d + 0.1, a: 0.1 });
    },
    gust() {
      nz({ f0: 280, f1: 1100, dur: 1.5, g: 0.3, q: 0.4, a: 0.45 });
    },
    block() {
      [740, 1860, 2950].forEach((f, i) =>
        tn({ f0: f, dur: 0.5 - i * 0.1, g: 0.17 / (i + 1), a: 0.002 }),
      );
      nz({ type: 'highpass', f0: 3500, dur: 0.05, g: 0.35 });
    },
    hurt() {
      tn({ f0: 130, f1: 48, dur: 0.55, g: 0.6 });
      nz({ type: 'lowpass', f0: 1300, f1: 200, dur: 0.45, g: 0.45 });
    },
    zap() {
      nz({ type: 'highpass', f0: 2500, dur: 0.25, g: 0.4 });
      tn({ f0: 80, f1: 40, dur: 0.3, g: 0.4 });
    },
    bark() {
      for (const d of [0, 0.15]) {
        tn({ f0: 560, f1: 380, dur: 0.09, g: 0.22, type: 'square', delay: d });
        nz({ f0: 900, dur: 0.07, g: 0.2, delay: d });
      }
    },
    caw() {
      tn({ f0: 880, f1: 560, dur: 0.28, g: 0.1, type: 'sawtooth' });
      nz({ f0: 1400, f1: 900, dur: 0.25, g: 0.18, q: 3 });
    },
    clink() {
      // A fallen blade bites into earth: a dry impact with a brief steel tick.
      // Avoid the old descending triangle tone, which sounded like a squeak.
      nz({ type: 'lowpass', f0: 850, f1: 280, dur: 0.105, g: 0.22, q: 0.5, a: 0.002 });
      tn({ f0: 125, f1: 75, dur: 0.085, g: 0.12, a: 0.002 });
      tn({ f0: 2150, dur: 0.065, g: 0.035, a: 0.002 });
      nz({ f0: 3200, dur: 0.035, g: 0.045, q: 0.7, a: 0.002 });
    },
    heart() {
      tn({ f0: 72, f1: 44, dur: 0.18, g: 0.55 });
      tn({ f0: 66, f1: 40, dur: 0.16, g: 0.4, delay: 0.17 });
    },
    shatter() {
      for (let i = 0; i < 4; i++)
        nz({
          type: 'highpass',
          f0: 3500 + R() * 2500,
          dur: 0.05 + R() * 0.08,
          g: 0.2,
          delay: i * 0.03,
        });
      tn({ f0: 2900, f1: 2400, dur: 0.3, g: 0.06 });
    },
    hum() {
      tn({ f0: 110, f1: 190, dur: 0.28, g: 0.12, type: 'sawtooth' });
      tn({ f0: 220, f1: 340, dur: 0.24, g: 0.05, type: 'square' });
    },
    bonk() {
      tn({ f0: 520, f1: 300, dur: 0.35, g: 0.3, type: 'triangle' });
      tn({ f0: 1300, f1: 900, dur: 0.25, g: 0.1 });
      nz({ type: 'lowpass', f0: 900, dur: 0.08, g: 0.3 });
    },
    bell() {
      tn({ f0: 2600, dur: 0.6, g: 0.09 });
      tn({ f0: 3900, dur: 0.4, g: 0.04, delay: 0.01 });
    },
    chime() {
      [1568, 2093, 2637].forEach((f, i) => tn({ f0: f, dur: 0.8, g: 0.05, delay: i * 0.08 }));
    },
    coin() {
      tn({ f0: 1800, f1: 2400, dur: 0.15, g: 0.08 });
      tn({ f0: 2700, dur: 0.2, g: 0.05, delay: 0.08 });
    },
    knock() {
      tn({ f0: 180, f1: 120, dur: 0.12, g: 0.4, type: 'triangle' });
      nz({ type: 'lowpass', f0: 700, dur: 0.06, g: 0.3 });
    },
    poof() {
      nz({ type: 'lowpass', f0: 900, f1: 200, dur: 0.4, g: 0.4, q: 0.5 });
    },
    crackle() {
      for (let i = 0; i < 10; i++)
        nz({
          type: 'highpass',
          f0: 2500 + R() * 3000,
          dur: 0.03,
          g: 0.1 + R() * 0.1,
          delay: 0.15 + R() * 0.5,
        });
      tn({ f0: 120, f1: 60, dur: 0.4, g: 0.3, delay: 0.1 });
    },
    popper() {
      nz({ f0: 1500, f1: 4000, dur: 0.12, g: 0.4 });
      tn({ f0: 900, f1: 1400, dur: 0.12, g: 0.08 });
    },
    squeak() {
      for (const d of [0, 0.12])
        tn({ f0: 1300, f1: 1900, dur: 0.1, g: 0.1, type: 'square', delay: d });
    },
    unlock() {
      tn({ f0: 1318, dur: 0.6, g: 0.1 });
      tn({ f0: 1976, dur: 0.8, g: 0.08, delay: 0.12 });
    },
  };
  function ambient(raw: number, w: string | null) {
    if (!A.ctx || A.muted) return;
    A.at = (A.at || 0) - raw;
    if (w === 'smoke' && R() < raw * 10)
      nz({ type: 'highpass', f0: 1800 + R() * 2000, dur: 0.02 + R() * 0.03, g: 0.03 + R() * 0.06 });
    if (A.at > 0) return;
    if (w === 'storm') {
      A.at = 4.5 + R() * 3;
      nz({ type: 'lowpass', f0: 250, f1: 900, dur: 3.2, g: 0.22, a: 1.3, q: 0.3 });
    } else if (w === 'night') {
      A.at = 0.7 + R() * 1.2;
      for (let i = 0; i < 3; i++)
        tn({ f0: 4200 + R() * 300, dur: 0.04, g: 0.025, delay: i * 0.075 });
    } else if (w === 'sakura') {
      A.at = 3 + R() * 4;
      tn({ f0: 2600, f1: 3500, dur: 0.12, g: 0.035 });
      tn({ f0: 3300, f1: 2500, dur: 0.1, g: 0.03, delay: 0.16 });
    } else if (w === 'bamboo') {
      A.at = 8 + R() * 5;
      tn({ f0: 430, f1: 300, dur: 0.3, g: 0.18, type: 'triangle' });
      nz({ f0: 1100, dur: 0.06, g: 0.18 });
    } else if (w === 'gust') {
      A.at = 6 + R() * 5;
      tn({ f0: 700, f1: 480, dur: 0.3, g: 0.04, type: 'sawtooth' });
    } else A.at = 2;
  }

  function update(raw: number, w: string | null, wind: number, whiteout: number) {
    if (A.ctx && A.wg && A.wbp) {
      A.wt += raw;
      if (A.wt > 0.25) {
        A.wt = 0;
        const n = A.ctx.currentTime;
        A.wg.gain.setTargetAtTime(
          (w === 'rain' || w === 'storm' ? 0.07 : 0.025) +
            0.035 * clamp(wind / 2) +
            whiteout * 0.08,
          n,
          0.4,
        );
        A.wbp.frequency.setTargetAtTime(
          (w === 'rain' || w === 'storm' ? 1400 : w === 'snow' ? 180 : 300) + wind * 180,
          n,
          0.5,
        );
      }
    }
    ambient(raw, w);
  }
  return {
    init: audioInit,
    tone: tn,
    cues: sfx,
    update,
    get muted() {
      return A.muted;
    },
    setMuted(muted: boolean) {
      A.muted = muted;
      if (A.master) A.master.gain.value = muted ? 0 : 0.9;
    },
    dispose() {
      const context = A.ctx;
      A.ctx = null;
      A.master = null;
      A.noise = null;
      A.wg = null;
      A.wbp = null;
      return context?.close();
    },
  };
}
