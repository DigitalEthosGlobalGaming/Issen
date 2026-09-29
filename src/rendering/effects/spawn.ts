import { TAU } from '../../shared/math.ts';
import type { Random } from '../../shared/random.ts';
import type { Effects } from './state.ts';
import { scaledCount } from './quality.ts';
export interface EffectSpawning {
  scale: number;
  density?: number;
  random: Random;
  flash: (amount: number, color: string) => void;
  sounds: Record<'zap' | 'shatter' | 'poof' | 'crackle' | 'popper' | 'squeak', () => void>;
}
export function createEffectSpawner(fx: Effects, env: EffectSpawning) {
  const { scale: S, random: R, flash, sounds } = env;
  const count = (n: number) => scaledCount(n, env.density);
  function addSlash(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    w: number,
    life = 0.3,
    dark = false,
  ) {
    fx.slashes.push({ x1, y1, x2, y2, w, t: 0, life: life || 0.3, dark: !!dark });
  }
  function inkBurst(x: number, y: number, ang: number, n: number, sc: number) {
    for (let i = 0; i < count(n); i++) {
      const a = ang + (R() - 0.5) * 1.5 + (R() < 0.35 ? Math.PI : 0),
        sp = (160 + R() * 480) * sc;
      fx.drops.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 140 * sc,
        r: (0.8 + Math.pow(R(), 2) * 3.2) * sc,
        t: 0,
        life: 0.5 + R() * 0.5,
      });
    }
  }
  function scraps(x: number, y: number, n: number, sc: number) {
    for (let i = 0; i < count(n); i++)
      fx.scraps.push({
        x: x + (R() - 0.5) * 20 * sc,
        y: y + (R() - 0.5) * 30 * sc,
        vx: (R() - 0.35) * 260 * sc,
        vy: -(80 + R() * 260) * sc,
        rot: R() * TAU,
        vr: (R() - 0.5) * 14,
        s: (3 + R() * 6) * sc,
        t: 0,
        life: 1.1 + R() * 0.9,
      });
  }
  function ring(x: number, y: number, r0: number, r1: number, life: number, w: number) {
    fx.rings.push({ x, y, r0, r1, t: 0, life, w });
  }
  function sparks(x: number, y: number, n: number) {
    for (let i = 0; i < count(n); i++) {
      const a = R() * TAU,
        sp = (280 + R() * 520) * S;
      fx.sparks.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        t: 0,
        life: 0.2 + R() * 0.25,
      });
    }
  }
  function dust(x: number, y: number, s: number) {
    for (let i = 0; i < count(4); i++)
      fx.dust.push({
        x: x + (R() - 0.5) * s,
        y,
        r: s * (0.3 + R() * 0.3),
        t: 0,
        life: 0.7 + R() * 0.4,
        vx: (R() - 0.3) * 40 * S,
      });
  }
  function killFx(t: string, cx: number, cy: number, ang: number, sc: number) {
    if (t === 'trial-ripple') {
      inkBurst(cx, cy, ang, 5, sc);
      for (let i = 0; i < 3; i++)
        ring(cx, cy, (4 + i * 12) * sc, (65 + i * 28) * sc, 0.5 + i * 0.14, Math.max(1, 2 * sc));
    } else if (t === 'trial-comet') {
      inkBurst(cx, cy, ang, 5, sc);
      for (let i = 0; i < count(22); i++) {
        const a = ang + (R() - 0.5) * 0.65;
        const speed = (160 + R() * 400) * sc;
        fx.px.push({
          k: 'star',
          x: cx,
          y: cy,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          s: (2 + R() * 4) * sc,
          t: 0,
          life: 0.5 + R() * 0.5,
          drag: 2,
        });
      }
    } else if (t === 'petals') {
      inkBurst(cx, cy, ang, 6, sc);
      for (let i = 0; i < count(26); i++) {
        const a = R() * TAU,
          sp = (80 + R() * 320) * sc;
        fx.petals.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 120 * sc,
          rot: R() * TAU,
          vr: (R() - 0.5) * 10,
          s: (2.5 + R() * 3) * sc,
          t: 0,
          life: 1.4 + R() * 0.8,
        });
      }
    } else if (t === 'bolt') {
      inkBurst(cx, cy, ang, 8, sc);
      const pts: [number, number][] = [];
      let x = cx + (R() - 0.5) * 60 * sc,
        y = -10;
      while (y < cy) {
        pts.push([x, y]);
        y += (20 + R() * 40) * S;
        x += (R() - 0.5) * 40 * S;
      }
      pts.push([cx, cy]);
      fx.bolts.push({ pts, t: 0, life: 0.22 });
      flash(0.18, '235,238,255');
      sounds.zap();
    } else if (t === 'embers') {
      inkBurst(cx, cy, ang, 8, sc);
      for (let i = 0; i < count(24); i++)
        fx.embers.push({
          x: cx + (R() - 0.5) * 30 * sc,
          y: cy + (R() - 0.5) * 40 * sc,
          vx: (R() - 0.5) * 120 * sc,
          vy: -(60 + R() * 220) * sc,
          t: 0,
          life: 0.8 + R() * 0.9,
          ph: R() * TAU,
        });
    } else if (t === 'brush') {
      inkBurst(cx, cy, ang, 10, sc);
      fx.kanji.push({
        x: cx,
        y: cy,
        t: 0,
        life: 0.9,
        rot: (R() - 0.5) * 0.4,
        s: sc * 80,
        ch: R() < 0.5 ? '斬' : '断',
      });
    } else if (t === 'flies') {
      inkBurst(cx, cy, ang, 6, sc);
      for (let i = 0; i < count(18); i++)
        fx.flies.push({
          x: cx + (R() - 0.5) * 50 * sc,
          y: cy + (R() - 0.3) * 60 * sc,
          vx: (R() - 0.5) * 30 * sc,
          vy: -(25 + R() * 50) * sc,
          t: 0,
          life: 1.6 + R() * 1,
          ph: R() * TAU,
        });
    } else if (t === 'shatter') {
      inkBurst(cx, cy, ang, 6, sc);
      for (let i = 0; i < count(18); i++) {
        const a = R() * TAU,
          sp = (120 + R() * 380) * sc;
        fx.shards.push({
          x: cx + (R() - 0.5) * 30 * sc,
          y: cy + (R() - 0.5) * 60 * sc,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 120 * sc,
          rot: R() * TAU,
          vr: (R() - 0.5) * 16,
          s: (4 + R() * 8) * sc,
          t: 0,
          life: 0.8 + R() * 0.4,
        });
      }
      flash(0.1, '225,235,245');
      sounds.shatter();
    } else if (t === 'crescent') {
      inkBurst(cx, cy, ang, 6, sc);
      fx.px.push({ k: 'moon', x: cx, y: cy, rot: ang, s: 60 * sc, t: 0, life: 0.55 });
      for (let i = 0; i < count(10); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 200) * sc;
        fx.px.push({
          k: 'star',
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          s: (2 + R() * 3) * sc,
          t: 0,
          life: 0.6 + R() * 0.4,
          drag: 2,
        });
      }
    } else if (t === 'lanterns') {
      inkBurst(cx, cy, ang, 6, sc);
      for (let i = 0; i < count(5); i++)
        fx.px.push({
          k: 'lantern',
          x: cx + (R() - 0.5) * 50 * sc,
          y: cy + (R() - 0.3) * 40 * sc,
          vx: (R() - 0.5) * 20 * sc,
          vy: -(50 + R() * 60) * sc,
          s: (7 + R() * 4) * sc,
          ph: R() * TAU,
          t: 0,
          life: 2.2 + R() * 0.8,
        });
    } else if (t === 'cranes') {
      inkBurst(cx, cy, ang, 6, sc);
      for (let i = 0; i < count(4); i++) {
        const sd = i % 2 ? 1 : -1;
        fx.px.push({
          k: 'crane',
          x: cx,
          y: cy,
          vx: sd * (35 + R() * 60) * sc,
          vy: -(50 + R() * 60) * sc,
          s: (9 + R() * 5) * sc,
          ph: R() * TAU,
          t: 0,
          life: 2,
        });
      }
    } else if (t === 'koi') {
      inkBurst(cx, cy, ang, 6, sc);
      for (let i = 0; i < count(2); i++) {
        const sd = i ? 1 : -1;
        fx.px.push({
          k: 'koi',
          x: cx,
          y: cy,
          vx: sd * 80 * sc,
          vy: -170 * sc,
          vr: -sd * 2.6,
          s: 14 * sc,
          t: 0,
          life: 1.5,
          c: i ? '#ece6da' : '#d8642a',
        });
      }
    } else if (t === 'poof') {
      for (let i = 0; i < count(10); i++) {
        const a = R() * TAU,
          sp = (30 + R() * 120) * sc;
        fx.px.push({
          k: 'puff',
          x: cx + (R() - 0.5) * 30 * sc,
          y: cy + (R() - 0.5) * 50 * sc,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 20 * sc,
          s: (14 + R() * 16) * sc,
          t: 0,
          life: 0.8 + R() * 0.4,
          drag: 3,
        });
      }
      sounds.poof();
    } else if (t === 'wave') {
      inkBurst(cx, cy, ang, 6, sc);
      fx.px.push({ k: 'wave', x: cx, y: cy + 30 * sc, s: 70 * sc, t: 0, life: 0.9 });
      for (let i = 0; i < count(16); i++) {
        const a = -Math.PI * R(),
          sp = (120 + R() * 260) * sc;
        fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          t: 0,
          life: 0.6 + R() * 0.3,
          c: '220,235,245',
        });
      }
    } else if (t === 'kintsugi') {
      const da = ang - Math.PI / 2,
        pts: [number, number][] = [];
      for (let i = 0; i <= 8; i++) {
        const u = (i / 8) * 2 - 1;
        pts.push([u, (i % 2 ? 1 : -1) * 0.08 * R()]);
      }
      fx.px.push({ k: 'crack', x: cx, y: cy, rot: da, s: 70 * sc, pts, t: 0, life: 1.1 });
      for (let i = 0; i < count(14); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 220) * sc;
        fx.px.push({
          k: 'flake',
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60 * sc,
          g: 300,
          drag: 1.5,
          rot: R() * TAU,
          vr: (R() - 0.5) * 12,
          s: (2 + R() * 3) * sc,
          t: 0,
          life: 1 + R() * 0.6,
        });
      }
    } else if (t === 'spirit') {
      inkBurst(cx, cy, ang, 6, sc);
      fx.px.push({
        k: 'soul',
        x: cx,
        y: cy,
        vx: (R() - 0.5) * 30 * sc,
        vy: -55 * sc,
        s: 10 * sc,
        ph: R() * TAU,
        t: 0,
        life: 1.8,
      });
    } else if (t === 'maple') {
      inkBurst(cx, cy, ang, 5, sc);
      for (let i = 0; i < count(16); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 260) * sc;
        fx.px.push({
          k: 'maple',
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 80 * sc,
          g: 120,
          drag: 1.2,
          rot: R() * TAU,
          vr: (R() - 0.5) * 8,
          s: (4 + R() * 4) * sc,
          t: 0,
          life: 1.6 + R() * 0.8,
        });
      }
    } else if (t === 'fireworks') {
      for (let b = 0; b < count(3); b++) {
        const bx = cx + (R() - 0.5) * 120 * sc,
          by = cy - (80 + R() * 90) * sc,
          h = (R() * 360) | 0;
        for (let i = 0; i < count(22); i++) {
          const a = (i / count(22)) * TAU,
            sp = (90 + R() * 60) * sc;
          fx.px.push({
            k: 'fw',
            x: bx,
            y: by,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: 60,
            drag: 1.5,
            s: Math.max(1.5, 2 * sc),
            c: `hsl(${h},90%,70%)`,
            t: -b * 0.15,
            life: 1.1,
          });
        }
      }
      sounds.crackle();
    } else if (t === 'confetti') {
      for (let i = 0; i < count(40); i++)
        fx.px.push({
          k: 'conf',
          x: cx,
          y: cy,
          vx: (R() - 0.5) * 420 * sc,
          vy: -(150 + R() * 350) * sc,
          g: 500,
          drag: 1.6,
          rot: R() * TAU,
          vr: (R() - 0.5) * 14,
          s: (3 + R() * 3) * sc,
          c: `hsl(${(R() * 360) | 0},85%,62%)`,
          t: 0,
          life: 1.6 + R() * 0.6,
        });
      sounds.popper();
    } else if (t === 'duck') {
      inkBurst(cx, cy, ang, 4, sc);
      fx.px.push({
        k: 'duck',
        x: cx,
        y: cy,
        vx: (R() < 0.5 ? -1 : 1) * 70 * sc,
        vy: -250 * sc,
        g: 520,
        rot: 0,
        vr: (R() - 0.5) * 5,
        s: 13 * sc,
        t: 0,
        life: 1.6,
      });
      sounds.squeak();
    } else if (t === 'crows') {
      inkBurst(cx, cy, ang, 10, sc);
      for (let i = 0; i < count(5); i++)
        fx.crows.push({
          x: cx + (R() - 0.5) * 40 * sc,
          y: cy + (R() - 0.5) * 40 * sc,
          vx: (R() < 0.5 ? -1 : 1) * (80 + R() * 160) * S,
          vy: -(90 + R() * 140) * S,
          s: (7 + R() * 5) * sc,
          ph: R() * TAU,
          t: 0,
          life: 1.8,
        });
    } else inkBurst(cx, cy, ang, 18, sc);
  }
  return { addSlash, inkBurst, scraps, ring, sparks, dust, killFx };
}
