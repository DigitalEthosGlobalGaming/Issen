import type { SceneDrawing } from '../scene-drawing.ts';
import { cachedMaterialContext } from '../cached-materials.ts';
import { TAU, clamp } from '../../shared/math.ts';
import { rng } from '../../shared/random.ts';
import type { Random } from '../../shared/random.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { setSceneryAtmosphere } from '../environment/scene-kit.ts';
export function blob(
  b: SceneDrawing,
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
    fieldMist?: number;
    hillHeight?: (x: number) => number;
    hillShade?: { top: string; bottom: string };
    mountains?: (context: SceneDrawing) => void;
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
  function buildBG() {
    const st = STAGES[stage];
    if (!st) throw new Error('Unknown stage');
    const bg = document.createElement('canvas');
    bg.width = Math.round(W * DPR);
    bg.height = Math.round(H * DPR);
    const nativeContext = bg.getContext('2d');
    if (!nativeContext) throw new Error('Canvas 2D is unavailable');
    const b = cachedMaterialContext(nativeContext);
    setSceneryAtmosphere(b, `rgb(${st.fog.join(',')})`);
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
    // Preserve terrain texture's seeded stream after removing generated ridge geometry.
    for (const _ly of lay) {
      ridgeFn(r);
      r();
    }
    options.mountains?.(b);
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
    return { canvas: bg, glows: L.glows };
  }

  return buildBG();
}
