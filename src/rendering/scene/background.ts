import { TAU, clamp } from '../../shared/math.ts';
import { rng } from '../../shared/random.ts';
import type { Random } from '../../shared/random.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
export function blob(
  b: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rgb: string,
  a: number,
) {
  b.save();
  b.translate(x, y);
  b.scale(1, ry / rx);
  const gr = b.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  b.fillStyle = gr;
  b.beginPath();
  b.arc(0, 0, rx, 0, TAU);
  b.fill();
  b.restore();
}

export function createBackground(
  W: number,
  H: number,
  DPR: number,
  stage: number,
  options: {
    fieldTrees?: boolean;
    fieldStatues?: boolean;
    fieldRocks?: boolean;
    fieldMist?: number;
    stageProps?: boolean;
    hillHeight?: (x: number) => number;
    hillShade?: { top: string; bottom: string };
    mountains?: (context: CanvasRenderingContext2D) => void;
  } = {},
) {
  const portrait = H >= W * 0.9,
    S = Math.max(W, H) / 900;
  const L = { ...createLayout(W, H), glows: [] as { x: number; y: number; r: number }[] };
  function ridgeFn(r: Random) {
    const p = [r() * TAU, r() * TAU, r() * TAU, r() * TAU] as const;
    return (u: number) =>
      0.55 +
      0.32 * Math.sin(u * 2.1 * Math.PI + p[0]) +
      0.18 * Math.sin(u * 5.3 * Math.PI + p[1]) +
      0.07 * Math.sin(u * 13 * Math.PI + p[2]) +
      0.03 * Math.sin(u * 31 * Math.PI + p[3]);
  }
  function pine(b: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
    // Local variation preserves the seeded layout of the surrounding scenery.
    const variation = rng(Math.round(x * 31 + y * 17 + s * 101));
    const shore = STAGES[stage]!.bgx === 'shore';
    const charred = STAGES[stage]!.bgx === 'temple';
    const lean = (variation() - 0.5) * 0.12 + (shore ? 0.15 : 0);
    const width = 0.88 + variation() * 0.22;
    b.save();
    b.translate(x, y);
    b.rotate(lean);
    b.fillStyle = col;
    b.beginPath();
    b.moveTo(-s * 0.045, 0);
    b.quadraticCurveTo(-s * 0.025, -s * 0.65, s * 0.012, -s * 1.48);
    b.lineTo(s * 0.035, -s * 1.1);
    b.lineTo(s * 0.055, 0);
    b.closePath();
    b.fill();
    for (let i = 0; i < 4; i++) {
      const yy = -s * (0.55 + i * 0.28 + variation() * 0.035),
        w = s * (0.75 - i * 0.14) * width * (charred ? 0.75 : 1),
        offset = s * ((variation() - 0.5) * 0.17 + (shore ? 0.08 : 0));
      b.beginPath();
      b.ellipse(
        offset,
        yy,
        w,
        s * (0.12 + variation() * 0.06) * (charred ? 0.65 : 1),
        (variation() - 0.5) * 0.09,
        0,
        TAU,
      );
      b.fill();
    }
    b.restore();
  }
  function branch(
    b: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    ang: number,
    w: number,
    depth: number,
    r: Random,
  ) {
    const x2 = x + Math.cos(ang) * len,
      y2 = y + Math.sin(ang) * len;
    b.lineWidth = w;
    b.beginPath();
    b.moveTo(x, y);
    b.quadraticCurveTo((x + x2) / 2 + (r() - 0.5) * len * 0.35, (y + y2) / 2, x2, y2);
    b.stroke();
    if (depth <= 0) return;
    const n = depth > 3 ? 2 : r() < 0.5 ? 2 : 3;
    for (let k = 0; k < n; k++)
      branch(
        b,
        x2,
        y2,
        len * (0.6 + r() * 0.2),
        ang + (r() - 0.5) * 0.9 + (k - (n - 1) / 2) * 0.6,
        w * 0.64,
        depth - 1,
        r,
      );
  }
  function drawTemple(b: CanvasRenderingContext2D, r: Random, hz: number) {
    const x = W * (portrait ? 0.24 : 0.2),
      by = hz + H * 0.075,
      s = H * (portrait ? 0.07 : 0.11);
    b.save();
    b.globalCompositeOperation = 'lighter';
    blob(b, x, by - s * 0.6, s * 2.6, s * 1.6, '255,226,196', 0.35);
    blob(b, x, by - s * 0.2, s * 1.4, s * 0.7, '255,236,210', 0.4);
    b.restore();
    for (let i = 0; i < 14; i++)
      blob(
        b,
        x + s * (0.2 + i * 0.35) + (r() - 0.5) * s * 0.4,
        by - s * (1.6 + i * 0.45),
        s * (0.6 + i * 0.08),
        s * (0.35 + i * 0.05),
        '12,10,9',
        0.22,
      );
    b.fillStyle = '#120f0e';
    for (let i = 0; i < 4; i++) {
      const w = s * (1.1 - i * 0.2),
        y = by - i * s * 0.42,
        rh = s * 0.12;
      b.fillRect(x - w * 0.32, y - s * 0.3, w * 0.64, s * 0.3);
      b.beginPath();
      b.moveTo(x - w * 0.62, y - s * 0.28);
      b.quadraticCurveTo(x - w * 0.4, y - s * 0.3 - rh * 0.2, x - w * 0.3, y - s * 0.3 - rh);
      b.lineTo(x + w * 0.3, y - s * 0.3 - rh);
      b.quadraticCurveTo(x + w * 0.4, y - s * 0.3 - rh * 0.2, x + w * 0.62, y - s * 0.28);
      b.closePath();
      b.fill();
    }
    b.fillRect(x - s * 0.015, by - 4 * s * 0.42 - s * 0.45, s * 0.03, s * 0.35);
    b.save();
    b.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++)
      blob(b, x + (r() - 0.5) * s * 1.3, by - r() * s * 0.9, s * 0.12, s * 0.2, '255,236,214', 0.5);
    b.restore();
  }
  function drawSea(b: CanvasRenderingContext2D, r: Random, hz: number, hb: number) {
    const y0 = hz + H * 0.045,
      y1 = hb + H * 0.035;
    const gr = b.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, '#555b5f');
    gr.addColorStop(1, '#2b2f32');
    b.fillStyle = gr;
    b.fillRect(0, y0, W, y1 - y0);
    b.lineCap = 'round';
    for (let i = 0; i < Math.round(W / 2.5); i++) {
      const d = r(),
        y = y0 + Math.pow(d, 1.3) * (y1 - y0),
        len = (6 + d * 40) * S * (0.5 + r()),
        x = r() * W;
      b.strokeStyle = `rgba(215,220,222,${0.1 + d * 0.35 * r()})`;
      b.lineWidth = (0.5 + d * 1.6) * S;
      b.beginPath();
      b.moveTo(x, y);
      b.quadraticCurveTo(x + len * 0.5, y - len * 0.08, x + len, y);
      b.stroke();
    }
    b.fillStyle = 'rgba(225,228,230,.35)';
    b.fillRect(0, y1 - H * 0.006, W, H * 0.006);
    b.fillStyle = '#1d2022';
    b.beginPath();
    b.moveTo(W * 0.78, y1);
    b.lineTo(W * 0.83, y0 - H * 0.03);
    b.lineTo(W * 0.9, y0 - H * 0.045);
    b.lineTo(W, y0 - H * 0.02);
    b.lineTo(W, y1);
    b.closePath();
    b.fill();
  }
  function drawGrove(b: CanvasRenderingContext2D, r: Random, hb: number) {
    const n = Math.round(W / 10),
      arr = [];
    for (let i = 0; i < n; i++) arr.push({ x: r() * W, d: r(), seg: (16 + r() * 22) * S });
    arr.sort((a, c) => a.d - c.d);
    for (const t of arr) {
      const c = Math.round(118 - t.d * 80),
        w = (2 + t.d * 6) * S,
        base = hb + H * 0.03;
      b.fillStyle = `rgb(${c},${c + 3},${c - 2})`;
      b.fillRect(t.x - w / 2, -10, w, base + 10);
      b.fillStyle = `rgba(${c - 30},${c - 28},${c - 32},.9)`;
      for (let y = base - t.seg; y > 0; y -= t.seg)
        b.fillRect(t.x - w * 0.7, y, w * 1.4, Math.max(1, w * 0.2));
      b.strokeStyle = `rgba(${c - 20},${c - 15},${c - 25},.8)`;
      b.lineWidth = Math.max(1, w * 0.35);
      for (let k = 0; k < 4; k++) {
        const ly = r() * base * 0.6,
          dr = r() < 0.5 ? -1 : 1;
        b.beginPath();
        b.moveTo(t.x, ly);
        b.quadraticCurveTo(t.x + dr * w * 3, ly + w * 1.5, t.x + dr * w * 6, ly + w * 4);
        b.stroke();
      }
    }
    const mg = b.createLinearGradient(0, hb - H * 0.12, 0, hb + H * 0.04);
    mg.addColorStop(0, 'rgba(190,196,188,0)');
    mg.addColorStop(1, 'rgba(190,196,188,.55)');
    b.fillStyle = mg;
    b.fillRect(0, hb - H * 0.12, W, H * 0.16);
  }
  function drawBlossom(b: CanvasRenderingContext2D, r: Random, x: number, y: number, rad: number) {
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU,
        d = Math.sqrt(r()) * rad;
      blob(
        b,
        x + Math.cos(a) * d * 1.3,
        y + Math.sin(a) * d * 0.7,
        rad * (0.1 + r() * 0.15),
        rad * (0.08 + r() * 0.1),
        r() < 0.7 ? '238,222,224' : '200,182,186',
        0.35 + r() * 0.3,
      );
    }
  }
  function toro(b: CanvasRenderingContext2D, x: number, y: number, s: number, snow: boolean) {
    b.fillStyle = '#2a2826';
    b.fillRect(x - s * 0.08, y - s * 0.55, s * 0.16, s * 0.55);
    b.fillRect(x - s * 0.22, y - s * 0.08, s * 0.44, s * 0.08);
    b.fillRect(x - s * 0.2, y - s * 0.72, s * 0.4, s * 0.18);
    b.fillStyle = 'rgba(255,225,170,.55)';
    b.fillRect(x - s * 0.08, y - s * 0.68, s * 0.16, s * 0.1);
    b.fillStyle = '#2a2826';
    b.beginPath();
    b.moveTo(x - s * 0.32, y - s * 0.72);
    b.lineTo(x, y - s * 0.95);
    b.lineTo(x + s * 0.32, y - s * 0.72);
    b.closePath();
    b.fill();
    b.fillRect(x - s * 0.04, y - s * 1.05, s * 0.08, s * 0.12);
    if (snow) {
      b.fillStyle = '#eeebe4';
      b.beginPath();
      b.moveTo(x - s * 0.36, y - s * 0.72);
      b.quadraticCurveTo(x, y - s * 1.04, x + s * 0.36, y - s * 0.72);
      b.quadraticCurveTo(x, y - s * 0.84, x - s * 0.36, y - s * 0.72);
      b.fill();
    }
  }
  function torii(b: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
    const w = s * 0.8;
    b.fillStyle = col;
    b.fillRect(x - w * 0.4, y - s, w * 0.09, s);
    b.fillRect(x + w * 0.31, y - s, w * 0.09, s);
    b.fillRect(x - w * 0.5, y - s * 0.78, w, s * 0.07);
    b.beginPath();
    b.moveTo(x - w * 0.62, y - s * 0.98);
    b.quadraticCurveTo(x, y - s * 0.92, x + w * 0.62, y - s * 0.98);
    b.lineTo(x + w * 0.58, y - s * 1.08);
    b.quadraticCurveTo(x, y - s * 1.03, x - w * 0.58, y - s * 1.08);
    b.closePath();
    b.fill();
    b.fillStyle = 'rgba(0,0,0,.3)';
    b.fillRect(x - w * 0.55, y - s * 0.98, w * 1.1, s * 0.03);
  }
  function jizo(b: CanvasRenderingContext2D, x: number, y: number, s: number) {
    b.fillStyle = '#6e6a63';
    b.beginPath();
    b.ellipse(x, y - s * 0.35, s * 0.22, s * 0.35, 0, 0, TAU);
    b.fill();
    b.beginPath();
    b.arc(x, y - s * 0.8, s * 0.16, 0, TAU);
    b.fill();
    b.fillStyle = '#8c2a1f';
    b.beginPath();
    b.moveTo(x - s * 0.2, y - s * 0.62);
    b.lineTo(x + s * 0.2, y - s * 0.62);
    b.lineTo(x, y - s * 0.35);
    b.closePath();
    b.fill();
  }
  function fence(b: CanvasRenderingContext2D, x0: number, x1: number, y: number, s: number) {
    b.strokeStyle = '#2b2926';
    b.lineWidth = Math.max(1, s * 0.05);
    for (let x = x0; x < x1; x += s * 0.35) {
      b.beginPath();
      b.moveTo(x, y);
      b.lineTo(x, y - s * 0.5);
      b.stroke();
    }
    b.beginPath();
    b.moveTo(x0, y - s * 0.38);
    b.lineTo(x1, y - s * 0.38);
    b.moveTo(x0, y - s * 0.18);
    b.lineTo(x1, y - s * 0.18);
    b.stroke();
  }
  function umbrella(b: CanvasRenderingContext2D, x: number, y: number, s: number) {
    b.save();
    b.translate(x, y);
    b.rotate(-0.35);
    b.fillStyle = '#8c2a1f';
    b.beginPath();
    b.ellipse(0, 0, s * 0.6, s * 0.18, 0, Math.PI, TAU);
    b.fill();
    b.strokeStyle = 'rgba(20,10,8,.6)';
    b.lineWidth = Math.max(1, s * 0.02);
    for (let i = -3; i <= 3; i++) {
      b.beginPath();
      b.moveTo(0, -s * 0.02);
      b.lineTo(i * s * 0.18, -s * 0.14 + Math.abs(i) * s * 0.035);
      b.stroke();
    }
    b.strokeStyle = '#3a2a1e';
    b.lineWidth = Math.max(1, s * 0.035);
    b.beginPath();
    b.moveTo(0, 0);
    b.lineTo(s * 0.1, s * 0.6);
    b.stroke();
    b.restore();
  }
  function hangLantern(b: CanvasRenderingContext2D, x: number, y: number, s: number) {
    b.strokeStyle = '#1c1a18';
    b.lineWidth = Math.max(1, s * 0.05);
    b.beginPath();
    b.moveTo(x, y);
    b.lineTo(x, y - s * 1.4);
    b.lineTo(x + s * 0.5, y - s * 1.4);
    b.stroke();
    b.fillStyle = '#d9b88a';
    b.beginPath();
    b.ellipse(x + s * 0.5, y - s * 1.05, s * 0.2, s * 0.28, 0, 0, TAU);
    b.fill();
    b.fillStyle = '#1c1a18';
    b.fillRect(x + s * 0.38, y - s * 1.35, s * 0.24, s * 0.05);
    b.fillRect(x + s * 0.38, y - s * 0.8, s * 0.24, s * 0.05);
  }
  function perchCrow(b: CanvasRenderingContext2D, x: number, y: number, s: number) {
    b.fillStyle = '#141312';
    b.beginPath();
    b.ellipse(x, y, s * 0.5, s * 0.3, -0.3, 0, TAU);
    b.fill();
    b.beginPath();
    b.arc(x + s * 0.4, y - s * 0.3, s * 0.2, 0, TAU);
    b.fill();
    b.beginPath();
    b.moveTo(x - s * 0.35, y + s * 0.1);
    b.lineTo(x - s * 0.85, y + s * 0.3);
    b.lineTo(x - s * 0.3, y - s * 0.1);
    b.fill();
  }
  function drawProps(b: CanvasRenderingContext2D, ft: number, gy: number) {
    const s = L.eH,
      i = stage;
    L.glows = [];
    if (i === 0 && options.fieldStatues !== false) {
      jizo(b, W * 0.045, ft + H * 0.014, s * 0.3);
      jizo(b, W * 0.085, ft + H * 0.016, s * 0.26);
    }
    if (i === 1) {
      fence(b, 0, W * 0.3, ft + H * 0.012, s * 0.35);
      const tx = W * (portrait ? 0.93 : 0.9),
        ty = ft - H * (portrait ? 0.12 : 0.18);
      for (const c of [
        [-0.02, 0],
        [0.02, -0.03],
        [0.045, 0.02],
      ] as const)
        perchCrow(b, tx + c[0] * W, ty + c[1] * H, s * 0.09);
    }
    if (i === 2) torii(b, W * 0.3, ft + H * 0.005, s * 1.0, 'rgba(140,50,40,.72)');
    if (i === 3) {
      toro(b, W * 0.92, ft + H * 0.02, s * 0.5, false);
      umbrella(b, W * 0.7, H * 0.87, s * 0.45);
    }
    if (i === 4) {
      toro(b, W * 0.07, ft + H * 0.02, s * 0.5, false);
      fence(b, W * 0.62, W, ft + H * 0.012, s * 0.35);
    }
    if (i === 5) toro(b, W * 0.92, ft + H * 0.02, s * 0.5, true);
    if (i === 6) {
      hangLantern(b, W * 0.9, H * 0.66, s * 0.45);
      L.glows.push({ x: W * 0.9 + s * 0.225, y: H * 0.66 - s * 0.47, r: s * 0.55 });
    }
    if (i === 7) {
      const y1 = gy - L.eH * 0.3 + H * 0.035;
      torii(b, W * 0.38, y1 - H * 0.01, s * 1.3, 'rgba(150,50,38,.8)');
    }
    if (i === 8) {
      toro(b, W * 0.06, ft + H * 0.02, s * 0.55, false);
      toro(b, W * 0.94, ft + H * 0.02, s * 0.55, false);
      L.glows.push(
        { x: W * 0.06, y: ft + H * 0.02 - s * 0.35, r: s * 0.4 },
        { x: W * 0.94, y: ft + H * 0.02 - s * 0.35, r: s * 0.4 },
      );
    }
  }
  function buildBG() {
    const st = STAGES[stage];
    if (!st) throw new Error('Unknown stage');
    const bg = document.createElement('canvas');
    bg.width = Math.round(W * DPR);
    bg.height = Math.round(H * DPR);
    const b = bg.getContext('2d');
    if (!b) throw new Error('Canvas 2D is unavailable');
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    const r = rng(20260926 + stage * 97);
    const hz = L.horizonY,
      gy = L.groundY,
      sx = L.sunX,
      sy = hz * st.sunF,
      M = Math.max(W, H),
      A = Math.min(1, st.sunA);
    let gr = b.createLinearGradient(0, 0, 0, hz + H * 0.06);
    gr.addColorStop(0, st.sky[0]);
    gr.addColorStop(0.45, st.sky[1]);
    gr.addColorStop(0.85, st.sky[2]);
    gr.addColorStop(1, st.sky[3]);
    b.fillStyle = gr;
    b.fillRect(0, 0, W, H);
    if (st.moon) {
      blob(b, sx, sy, M * 0.22, M * 0.22, '205,208,212', 0.28);
    } else {
      const rg = b.createRadialGradient(sx, sy, 0, sx, sy, M * 0.45 * (st.sunA > 1 ? 1.3 : 1));
      rg.addColorStop(0, `rgba(255,252,242,${0.95 * A})`);
      rg.addColorStop(0.07, `rgba(246,241,230,${0.6 * A})`);
      rg.addColorStop(0.35, `rgba(200,195,184,${0.16 * A})`);
      rg.addColorStop(1, 'rgba(200,195,184,0)');
      b.fillStyle = rg;
      b.fillRect(0, 0, W, H);
    }
    b.save();
    b.beginPath();
    b.rect(0, 0, W, gy);
    b.clip();
    b.globalCompositeOperation = 'lighter';
    const nr = st.moon ? 6 : Math.round(11 * A);
    for (let i = 0; i < nr; i++) {
      const a = Math.PI / 2 + (r() - 0.5) * 1.9,
        len = M * 0.75,
        w = (0.02 + r() * 0.05) * len;
      const ex = sx + Math.cos(a) * len,
        ey = sy + Math.sin(a) * len,
        nx = -Math.sin(a) * w,
        ny = Math.cos(a) * w;
      const lg = b.createLinearGradient(sx, sy, ex, ey);
      lg.addColorStop(0, `rgba(255,250,238,${st.moon ? 0.05 : 0.1 * A})`);
      lg.addColorStop(1, 'rgba(255,250,238,0)');
      b.fillStyle = lg;
      b.beginPath();
      b.moveTo(sx, sy);
      b.lineTo(ex + nx, ey + ny);
      b.lineTo(ex - nx, ey - ny);
      b.closePath();
      b.fill();
    }
    b.restore();
    for (let i = 0; i < 190; i++) {
      const x = r() * W * 1.3 - W * 0.15,
        y = Math.pow(r(), 1.25) * hz * 0.95 - H * 0.03,
        rad = (40 + r() * 140) * S;
      const ds = Math.hypot(x - sx, y - sy) / (M * 0.5);
      const dark = clamp(1 - (y / hz) * 0.75) * clamp(ds * 1.15, 0.12, 1);
      blob(
        b,
        x,
        y,
        rad * 1.6,
        rad * 0.65,
        st.cloud,
        Math.min(0.5, (0.04 + 0.17 * dark * r()) * st.cloudA),
      );
    }
    for (let i = 0; i < 110; i++) {
      const x = sx + (r() - 0.5) * W * 1.1,
        y = sy + (r() - 0.35) * hz * 0.9,
        rad = (25 + r() * 90) * S;
      const ds = Math.hypot(x - sx, y - sy) / (M * 0.5);
      blob(
        b,
        x,
        y,
        rad * 1.5,
        rad * 0.55,
        '240,235,224',
        Math.min(0.4, (0.04 + 0.12 * r()) * clamp(1.2 - ds) * st.hiA),
      );
    }
    for (let i = 0; i < 70; i++) {
      const x = r() * W,
        y = r() * hz * 0.55,
        rad = (30 + r() * 80) * S;
      blob(
        b,
        x,
        y,
        rad * 1.8,
        rad * 0.5,
        st.cloud === '60,58,55' ? '40,39,37' : '10,10,9',
        (0.05 + 0.1 * r()) * st.cloudA,
      );
    }
    if (st.moon) {
      b.fillStyle = '#e9e7e0';
      b.beginPath();
      b.arc(sx, sy, M * 0.028, 0, TAU);
      b.fill();
      for (let i = 0; i < 5; i++)
        blob(
          b,
          sx + (r() - 0.5) * M * 0.03,
          sy + (r() - 0.5) * M * 0.03,
          M * 0.008,
          M * 0.007,
          '150,148,142',
          0.5,
        );
    }
    const lay = [
      { base: hz + H * 0.005, amp: H * (portrait ? 0.1 : 0.15), col: st.mtn[0], peak: true },
      { base: hz + H * 0.03, amp: H * 0.075, col: st.mtn[1] },
      { base: hz + H * 0.058, amp: H * 0.05, col: st.mtn[2] },
    ];
    for (const ly of lay) {
      const f = ridgeFn(r);
      const pu = 0.72 + r() * 0.12;
      // Preserve the downstream terrain/grass seed when replacing the ridge artwork.
      if (options.mountains) continue;
      b.fillStyle = ly.col;
      b.beginPath();
      b.moveTo(0, H);
      for (let x = 0; x <= W + 3; x += 3) {
        const u = x / W;
        let v = f(u);
        if (ly.peak) v += 0.75 * Math.exp(-Math.pow((u - pu) / 0.11, 2));
        b.lineTo(x, ly.base - ly.amp * v);
      }
      b.lineTo(W, H);
      b.closePath();
      b.fill();
      const mg = b.createLinearGradient(0, ly.base - ly.amp * 0.5, 0, ly.base + H * 0.05);
      mg.addColorStop(0, `rgba(${st.mist},0)`);
      mg.addColorStop(0.7, `rgba(${st.mist},.55)`);
      mg.addColorStop(1, `rgba(${st.mist},.2)`);
      b.fillStyle = mg;
      b.fillRect(0, ly.base - ly.amp * 0.5, W, ly.amp * 0.5 + H * 0.05);
    }
    options.mountains?.(b);
    if (st.bgx === 'temple') drawTemple(b, r, hz);
    const hillBase = gy - L.eH * 0.3;
    const hf = ridgeFn(r);
    const hillY = options.hillHeight ?? ((x: number) => hillBase - H * 0.035 * hf(x / W));
    if (options.hillShade) {
      const shade = b.createLinearGradient(0, hz, 0, gy);
      shade.addColorStop(0, options.hillShade.top);
      shade.addColorStop(1, options.hillShade.bottom);
      b.fillStyle = shade;
    } else b.fillStyle = st.hill;
    b.beginPath();
    b.moveTo(0, H);
    for (let x = 0; x <= W + 3; x += 3) b.lineTo(x, hillY(x));
    b.lineTo(W, H);
    b.closePath();
    b.fill();
    // Still consume placement randomness so grass and terrain stay identical.
    for (let i = 0; i < Math.round(W / 18); i++) {
      const x = r() * W,
        s = (6 + r() * 12) * S,
        c = (st.pine + r() * 22) | 0;
      if (options.fieldTrees !== false)
        pine(b, x, hillY(x) + s * 0.2, s, `rgba(${c},${c - 1},${Math.max(0, c - 3)},.92)`);
    }
    let mg2 = b.createLinearGradient(0, hillBase - H * 0.05, 0, hillBase + H * 0.03);
    mg2.addColorStop(0, `rgba(${st.mist},0)`);
    mg2.addColorStop(0.75, `rgba(${st.mist},.5)`);
    mg2.addColorStop(1, `rgba(${st.mist},.15)`);
    b.save();
    b.globalAlpha = clamp(options.fieldMist ?? 1);
    b.fillStyle = mg2;
    b.fillRect(0, hillBase - H * 0.05, W, H * 0.08);
    b.restore();
    if (st.bgx === 'shore') drawSea(b, r, hz, hillBase);
    if (st.bgx === 'bamboo') drawGrove(b, r, hillBase);
    const ft = gy - L.eH * 0.18;
    gr = b.createLinearGradient(0, ft, 0, H);
    gr.addColorStop(0, st.field[0]);
    gr.addColorStop(0.3, st.field[1]);
    gr.addColorStop(1, st.field[2]);
    b.fillStyle = gr;
    b.beginPath();
    b.moveTo(0, ft + H * 0.01);
    b.quadraticCurveTo(W * 0.3, ft - H * 0.012, W * 0.6, ft + H * 0.004);
    b.quadraticCurveTo(W * 0.85, ft + H * 0.012, W, ft - H * 0.004);
    b.lineTo(W, H);
    b.lineTo(0, H);
    b.closePath();
    b.fill();
    b.lineCap = 'round';
    for (let i = 0; i < Math.round((W * H) / 220); i++) {
      const y = ft + Math.pow(r(), 0.75) * (H - ft),
        d = (y - ft) / (H - ft),
        len = (2 + d * 20) * S * (0.5 + r()),
        x = r() * W;
      const light = r() < 0.2;
      b.strokeStyle = light
        ? `rgba(200,195,184,${0.08 + d * 0.12})`
        : `rgba(${st.tex},${0.12 + d * 0.3})`;
      b.lineWidth = (0.5 + d * 1.3) * S;
      b.beginPath();
      b.moveTo(x, y);
      b.lineTo(x + (r() - 0.3) * len * 0.6, y - len);
      b.stroke();
    }
    mg2 = b.createLinearGradient(0, ft - H * 0.02, 0, ft + H * 0.09);
    mg2.addColorStop(0, `rgba(${st.mist},.35)`);
    mg2.addColorStop(1, `rgba(${st.mist},0)`);
    b.save();
    b.globalAlpha = clamp(options.fieldMist ?? 1);
    b.fillStyle = mg2;
    b.fillRect(0, ft - H * 0.02, W, H * 0.11);
    b.restore();
    for (const rk of [
      [W * 0.84, H * 0.93, W * 0.12],
      [W * 0.95, H * 0.88, W * 0.07],
    ] as const) {
      if (options.fieldRocks === false) continue;
      b.fillStyle = '#1e1d1b';
      b.beginPath();
      b.ellipse(rk[0], rk[1], rk[2], rk[2] * 0.42, 0, 0, TAU);
      b.fill();
      blob(
        b,
        rk[0] - rk[2] * 0.2,
        rk[1] - rk[2] * 0.25,
        rk[2] * 0.6,
        rk[2] * 0.18,
        stage === 3 ? '230,228,222' : '150,145,135',
        stage === 3 ? 0.7 : 0.25,
      );
    }
    if (options.fieldTrees !== false) {
      b.strokeStyle = '#22211f';
      b.lineCap = 'round';
      const tr = rng(77);
      branch(
        b,
        W * (portrait ? 0.96 : 0.93),
        ft + H * 0.01,
        H * (portrait ? 0.065 : 0.1),
        -Math.PI / 2 - (st.bgx === 'shore' ? 0.32 : 0.2),
        (portrait ? 4 : 6) * S,
        st.bgx === 'temple' ? 5 : 6,
        tr,
      );
      if (st.bgx === 'sakura') {
        drawBlossom(
          b,
          r,
          W * (portrait ? 0.94 : 0.91),
          ft - H * (portrait ? 0.13 : 0.2),
          H * (portrait ? 0.074 : 0.106),
        );
        const lx2 = W * 0.06,
          ly2 = ft + H * 0.01;
        branch(
          b,
          lx2,
          ly2,
          H * (portrait ? 0.05 : 0.08),
          -Math.PI / 2 + 0.2,
          (portrait ? 3 : 5) * S,
          5,
          tr,
        );
        drawBlossom(
          b,
          r,
          lx2 + H * 0.02,
          ly2 - H * (portrait ? 0.1 : 0.15),
          H * (portrait ? 0.058 : 0.084),
        );
      }
    }
    if (options.stageProps !== false) drawProps(b, ft, gy);
    return { canvas: bg, glows: L.glows };
  }

  return buildBG();
}
