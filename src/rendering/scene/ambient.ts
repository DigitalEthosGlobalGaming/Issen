import type { SceneDrawing } from '../scene-drawing.ts';
import { TAU } from '../../shared/math.ts';
import type { Random } from '../../shared/random.ts';
import { scaledCount } from '../effects/quality.ts';
import { chooseDriftSprite } from './drift-catalog.ts';
export interface GrassBlade {
  x: number;
  y: number;
  h: number;
  w: number;
  ph: number;
  col: string;
}
export interface Leaf {
  sprite?: string;
  spin?: number;
  rise?: number;
  flutter?: number;
  x: number;
  y: number;
  z: number;
  s: number;
  rot: number;
  vr: number;
  fl: number;
  vf: number;
  vy: number;
  ph: number;
  col: string;
  gust?: number;
}
export interface AmbientEnvironment {
  stage?: number;
  spriteMotion?: boolean;
  drawLeaf?: (g: SceneDrawing, leaf: Leaf) => void;
  width: number;
  height: number;
  scale: number;
  layout: { groundY: number; eH: number };
  random: Random;
  density?: number;
}
export function createAmbient(env: AmbientEnvironment) {
  const { width: W, height: H, scale: S, layout: L, random: R } = env;
  const count = (n: number) => scaledCount(n, env.density);
  function buildGrass(gl: number) {
    const fg: GrassBlade[] = [];
    const n = Math.round(W / 3);
    for (let i = 0; i < n; i++) {
      const lt = R() < 0.16;
      fg.push({
        x: R() * W,
        y: H + 2 - R() * H * 0.07,
        h: H * (0.05 + Math.pow(R(), 2) * 0.17),
        w: (1.2 + R() * 2.8) * S,
        ph: R() * TAU,
        col: lt
          ? 'rgba(150,145,136,.5)'
          : `rgba(${(10 + R() * 8) | 0},${(10 + R() * 7) | 0},${(9 + R() * 6) | 0},.9)`,
      });
    }
    fg.sort((a, b) => a.y - b.y);
    const mid: GrassBlade[] = [];
    const top = L.groundY - L.eH * 0.18;
    const m = Math.round(W / 2);
    for (let i = 0; i < m; i++) {
      const y = top + Math.pow(R(), 0.8) * (H - top),
        d = (y - top) / (H - top),
        lt = R() < 0.15,
        c = Math.max(4, Math.round(62 - d * 46 + gl * (1 - d * 0.6)));
      mid.push({
        x: R() * W,
        y,
        h: (4 + d * 30) * S * (0.6 + R() * 0.8),
        w: (0.5 + d * 1.6) * S,
        ph: R() * TAU,
        col: lt
          ? `rgba(195,190,180,${0.22 + 0.2 * d})`
          : `rgba(${c},${c - 1},${Math.max(0, c - 3)},${0.5 + 0.4 * d})`,
      });
    }
    mid.sort((a, b) => a.y - b.y);
    return { fg, mid };
  }
  function newLeaf(anywhere: boolean): Leaf {
    const z = 0.35 + Math.pow(R(), 1.8) * 1.7,
      c = Math.round(20 + (1 - Math.min(z, 1)) * 95);
    const sprite = chooseDriftSprite(env.stage ?? 0, R);
    return {
      sprite: sprite.id,
      spin: sprite.spin,
      rise: sprite.rise,
      flutter: sprite.flutter,
      x: anywhere ? R() * W : -30 - R() * 120,
      y: anywhere ? R() * H : R() * H * 0.95,
      z,
      s: (3 + R() * 4) * z * S * 1.25,
      rot: R() * TAU,
      vr: (R() - 0.5) * 7,
      fl: R() * TAU,
      vf: 3 + R() * 7,
      vy: (R() - 0.3) * 24,
      ph: R() * TAU,
      col: `rgba(${c},${c - 1},${c - 3},${z > 1.25 ? 0.6 : 0.9})`,
    };
  }
  function buildLeaves() {
    const leaves: Leaf[] = [];
    const n = count(38 + (W * H) / 11000);
    for (let i = 0; i < n; i++) leaves.push(newLeaf(true));
    return leaves;
  }
  function gustLeaves(leaves: Leaf[], n: number) {
    for (let i = 0; i < count(n); i++) {
      const l = newLeaf(false);
      l.z = 1.35 + R() * 1.1;
      l.s = (4 + R() * 6) * l.z * S * 1.3;
      l.x = -20 - R() * W * 0.9;
      l.y = R() * H;
      l.gust = 1;
      l.col = `rgba(14,13,12,${0.7 + R() * 0.25})`;
      leaves.push(l);
    }
  }
  function balanceLeaves(leaves: Leaf[]) {
    const target = count(38 + (W * H) / 11000);
    let ordinary = leaves.filter((leaf) => !leaf.gust).length;
    for (let i = leaves.length - 1; i >= 0 && ordinary > target; i--)
      if (!leaves[i]!.gust) {
        leaves.splice(i, 1);
        ordinary--;
      }
    while (ordinary < target) {
      leaves.push(newLeaf(false));
      ordinary++;
    }
  }
  function blades(g: SceneDrawing, list: readonly GrassBlade[], t: number, wind: number) {
    for (const b of list) {
      const sw = wind * 0.5 + Math.sin(t * 2.3 + b.ph) * 0.25 + Math.sin(t * 5.1 + b.ph * 2) * 0.06;
      const tx = b.x + sw * b.h * 0.45,
        ty = b.y - b.h * (1 - 0.12 * Math.abs(sw));
      g.fillStyle = b.col;
      g.beginPath();
      g.moveTo(b.x - b.w, b.y);
      g.quadraticCurveTo(b.x + sw * b.h * 0.1, b.y - b.h * 0.5, tx, ty);
      g.quadraticCurveTo(b.x + sw * b.h * 0.12 + b.w * 0.3, b.y - b.h * 0.5, b.x + b.w, b.y);
      g.fill();
    }
  }
  function drawLeaves(g: SceneDrawing, leaves: readonly Leaf[], front: boolean) {
    for (const l of leaves) {
      if (l.z > 1.25 !== front) continue;
      g.save();
      g.translate(l.x, l.y);
      g.rotate(l.rot);
      const flutter = env.spriteMotion ? (l.flutter ?? 1) : 1;
      g.scale(1, 1 - flutter + flutter * Math.cos(l.fl));
      g.fillStyle = l.col;
      env.drawLeaf?.(g, l);
      g.restore();
    }
  }
  function updateLeaves(leaves: Leaf[], dt: number, time: number, wind: number) {
    for (let i = leaves.length - 1; i >= 0; i--) {
      const l = leaves[i]!,
        sp = l.gust ? 3.2 : 1;
      l.x += (40 + 95 * wind) * l.z * dt * S * sp;
      l.y += (l.vy + Math.sin(time * 1.7 + l.ph) * 26) * l.z * dt * 0.6 * S;
      if (env.spriteMotion) l.y -= (l.rise ?? 0) * dt * S;
      l.rot += l.vr * dt * (env.spriteMotion ? (l.spin ?? 1) : 1);
      l.fl += l.vf * dt;
      if (l.x > W + 40 || l.y > H + 40 || l.y < -60) {
        if (l.gust) leaves.splice(i, 1);
        else leaves[i] = newLeaf(false);
      }
    }
  }
  return {
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    balanceLeaves,
    blades,
    drawLeaves,
    updateLeaves,
  };
}
