import { TAU, clamp, lerp, easeOut, easeInOut } from '../../shared/math.ts';
import type { Effects } from './state.ts';
export interface EffectDrawing {
  scale: number;
  time: number;
  font: string;
  seal: string;
  mistSprite: CanvasImageSource | null;
}
export function createEffectRenderer(g: CanvasRenderingContext2D, fx: Effects, env: EffectDrawing) {
  const { scale: S, time, font: FONT, seal: SEAL, mistSprite } = env;
  function drawFx() {
    if (mistSprite)
      for (const u of fx.dust) {
        g.globalAlpha = 0.35 * (1 - u.t / u.life);
        g.drawImage(mistSprite, u.x - u.r * 1.5, u.y - u.r * 0.6, u.r * 3, u.r * 1.2);
      }
    g.globalAlpha = 1;
    g.fillStyle = '#0d0c0b';
    for (const d of fx.drops) {
      g.globalAlpha = 1 - clamp((d.t - d.life * 0.6) / (d.life * 0.4));
      g.beginPath();
      g.ellipse(
        d.x,
        d.y,
        d.r,
        d.r * (1 + Math.min(2, Math.abs(d.vy) / 900)),
        Math.atan2(d.vy, d.vx) - Math.PI / 2,
        0,
        TAU,
      );
      g.fill();
    }
    for (const c of fx.scraps) {
      g.globalAlpha = 1 - clamp((c.t - c.life * 0.6) / (c.life * 0.4));
      g.save();
      g.translate(c.x, c.y);
      g.rotate(c.rot);
      g.scale(1, Math.cos(c.rot * 1.7));
      g.fillStyle = '#1a1917';
      g.beginPath();
      g.moveTo(-c.s, -c.s * 0.4);
      g.lineTo(c.s * 0.8, -c.s * 0.5);
      g.lineTo(c.s, c.s * 0.3);
      g.lineTo(-c.s * 0.6, c.s * 0.5);
      g.closePath();
      g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
    for (const s of fx.slashes) {
      const k = s.t / s.life,
        a = 1 - k,
        grow = easeOut(clamp(k * 5));
      const ex = lerp(s.x1, s.x2, grow),
        ey = lerp(s.y1, s.y2, grow);
      const dx = ex - s.x1,
        dy = ey - s.y1,
        ln = Math.hypot(dx, dy) || 1,
        nx = -dy / ln,
        ny = dx / ln,
        mx = (s.x1 + ex) / 2,
        my = (s.y1 + ey) / 2;
      for (const [wm, al] of [
        [3.2, 0.18],
        [1, 0.95],
      ] as const) {
        const w = s.w * wm * (1 - k * 0.6);
        g.fillStyle = s.dark ? `rgba(10,10,9,${a * al})` : `rgba(255,253,246,${a * al})`;
        g.beginPath();
        g.moveTo(s.x1, s.y1);
        g.quadraticCurveTo(mx + nx * w, my + ny * w, ex, ey);
        g.quadraticCurveTo(mx - nx * w * 0.4, my - ny * w * 0.4, s.x1, s.y1);
        g.fill();
      }
    }
    for (const r of fx.rings) {
      const k = r.t / r.life;
      g.strokeStyle = `rgba(255,252,244,${0.7 * (1 - k)})`;
      g.lineWidth = r.w * (1 - k * 0.5);
      g.beginPath();
      g.arc(r.x, r.y, lerp(r.r0, r.r1, easeOut(k)), 0, TAU);
      g.stroke();
    }
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    for (const s of fx.sparks) {
      const a = 1 - s.t / s.life;
      g.strokeStyle = `rgba(255,248,230,${a})`;
      g.lineWidth = Math.max(1, 2 * S);
      g.beginPath();
      g.moveTo(s.x, s.y);
      g.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025);
      g.stroke();
    }
    g.restore();
  }
  function drawSwords() {
    for (const q of fx.swords) {
      const a = 1 - clamp((q.t - q.life + 0.5) / 0.5),
        c = Math.cos(q.ang),
        sn = Math.sin(q.ang),
        hl = q.len / 2;
      g.globalAlpha = a;
      g.lineCap = 'round';
      g.strokeStyle = '#e9e6de';
      g.lineWidth = Math.max(2, q.len * 0.03);
      g.beginPath();
      g.moveTo(q.x - c * hl * 0.45, q.y - sn * hl * 0.45);
      g.lineTo(q.x + c * hl, q.y + sn * hl);
      g.stroke();
      g.strokeStyle = '#161514';
      g.lineWidth = Math.max(3, q.len * 0.045);
      g.beginPath();
      g.moveTo(q.x - c * hl, q.y - sn * hl);
      g.lineTo(q.x - c * hl * 0.5, q.y - sn * hl * 0.5);
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  function drawPx() {
    for (const q of fx.px) {
      if (q.t < 0) continue;
      const k = q.t / q.life,
        fa = 1 - clamp((k - 0.65) / 0.35);
      g.save();
      g.globalAlpha = fa;
      g.translate(q.x, q.y);
      switch (q.k) {
        case 'moon':
          g.rotate(q.rot ?? 0);
          g.globalCompositeOperation = 'lighter';
          g.lineCap = 'round';
          g.strokeStyle = `rgba(240,244,255,${1 - k})`;
          g.lineWidth = q.s * 0.14 * (1 - k * 0.5);
          g.beginPath();
          g.arc(0, 0, q.s * (0.7 + 0.5 * k), -1.1, 1.1);
          g.stroke();
          g.lineWidth = q.s * 0.05;
          g.beginPath();
          g.arc(-q.s * 0.12, 0, q.s * (0.6 + 0.5 * k), -0.9, 0.9);
          g.stroke();
          break;
        case 'star':
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = '#fff';
          g.rotate(time * 4);
          g.fillRect(-q.s, -q.s * 0.15, q.s * 2, q.s * 0.3);
          g.fillRect(-q.s * 0.15, -q.s, q.s * 0.3, q.s * 2);
          break;
        case 'lantern': {
          const sx = Math.sin(time * 2 + (q.ph ?? 0)) * 4 * S;
          g.translate(sx, 0);
          g.globalCompositeOperation = 'lighter';
          const rg = g.createRadialGradient(0, 0, 0, 0, 0, q.s * 2.4);
          rg.addColorStop(0, 'rgba(255,190,110,.55)');
          rg.addColorStop(1, 'rgba(255,190,110,0)');
          g.fillStyle = rg;
          g.fillRect(-q.s * 2.4, -q.s * 2.4, q.s * 4.8, q.s * 4.8);
          g.globalCompositeOperation = 'source-over';
          g.fillStyle = '#ecc98e';
          g.fillRect(-q.s * 0.6, -q.s * 0.8, q.s * 1.2, q.s * 1.6);
          g.fillStyle = '#3a2a1e';
          g.fillRect(-q.s * 0.65, -q.s * 0.9, q.s * 1.3, q.s * 0.2);
          g.fillRect(-q.s * 0.65, q.s * 0.7, q.s * 1.3, q.s * 0.2);
          break;
        }
        case 'crane': {
          if ((q.vx ?? 0) < 0) g.scale(-1, 1);
          const fl = Math.sin(time * 16 + (q.ph ?? 0));
          g.fillStyle = '#f2eee6';
          g.strokeStyle = 'rgba(60,55,50,.5)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(-q.s, 0);
          g.lineTo(q.s, -q.s * 0.1);
          g.lineTo(q.s * 0.3, q.s * 0.25);
          g.closePath();
          g.fill();
          g.stroke();
          g.beginPath();
          g.moveTo(-q.s * 0.2, 0);
          g.lineTo(q.s * 0.1, -q.s * (0.2 + fl * 0.9));
          g.lineTo(q.s * 0.4, -q.s * 0.05);
          g.closePath();
          g.fill();
          g.stroke();
          g.beginPath();
          g.moveTo(q.s, -q.s * 0.1);
          g.lineTo(q.s * 1.25, -q.s * 0.5);
          g.lineTo(q.s * 0.9, -q.s * 0.05);
          g.fill();
          break;
        }
        case 'koi': {
          g.rotate(Math.atan2(q.vy ?? 0, q.vx ?? 0));
          g.fillStyle = q.c ?? '#fff';
          g.beginPath();
          g.ellipse(0, 0, q.s, q.s * 0.32, 0, 0, TAU);
          g.fill();
          g.beginPath();
          g.moveTo(-q.s * 0.85, 0);
          g.lineTo(-q.s * 1.45, -q.s * 0.35);
          g.lineTo(-q.s * 1.3, 0);
          g.lineTo(-q.s * 1.45, q.s * 0.35);
          g.closePath();
          g.fill();
          g.fillStyle = q.c === '#d8642a' ? '#f2eee6' : '#d8642a';
          g.beginPath();
          g.ellipse(q.s * 0.1, -q.s * 0.05, q.s * 0.3, q.s * 0.14, 0.3, 0, TAU);
          g.fill();
          g.fillStyle = '#111';
          g.beginPath();
          g.arc(q.s * 0.7, -q.s * 0.08, q.s * 0.06, 0, TAU);
          g.fill();
          break;
        }
        case 'puff': {
          const r = q.s * (1 + k);
          const rg = g.createRadialGradient(0, 0, 0, 0, 0, r);
          rg.addColorStop(0, 'rgba(160,156,150,.75)');
          rg.addColorStop(1, 'rgba(160,156,150,0)');
          g.fillStyle = rg;
          g.beginPath();
          g.arc(0, 0, r, 0, TAU);
          g.fill();
          break;
        }
        case 'wave': {
          const sc2 = 0.6 + 0.6 * easeOut(k),
            s2 = q.s;
          g.globalAlpha = fa * (1 - k * k);
          g.scale(sc2, sc2);
          g.fillStyle = '#2d4f73';
          g.beginPath();
          g.moveTo(-s2, 0);
          g.quadraticCurveTo(-s2 * 0.3, -s2 * 1.1, s2 * 0.3, -s2 * 0.9);
          g.quadraticCurveTo(s2 * 0.8, -s2 * 0.7, s2 * 0.5, -s2 * 0.35);
          g.quadraticCurveTo(s2 * 0.2, -s2 * 0.6, 0, -s2 * 0.3);
          g.quadraticCurveTo(-s2 * 0.2, -s2 * 0.05, s2, 0);
          g.closePath();
          g.fill();
          g.strokeStyle = '#eef3f6';
          g.lineWidth = s2 * 0.05;
          g.stroke();
          g.fillStyle = '#eef3f6';
          for (let i = 0; i < 6; i++) {
            const u = i / 5;
            g.beginPath();
            g.arc(-s2 * 0.2 + u * s2 * 0.7, -s2 * (0.95 - 0.4 * u * u), s2 * 0.06, 0, TAU);
            g.fill();
          }
          break;
        }
        case 'crack': {
          g.rotate(q.rot ?? 0);
          g.globalCompositeOperation = 'lighter';
          g.lineJoin = 'round';
          g.beginPath();
          (q.pts ?? []).forEach((pt, i) =>
            i ? g.lineTo(pt[0] * q.s, pt[1] * q.s) : g.moveTo(pt[0] * q.s, pt[1] * q.s),
          );
          g.strokeStyle = 'rgba(255,210,110,.35)';
          g.lineWidth = Math.max(6, 8 * S);
          g.stroke();
          g.strokeStyle = '#f3c95a';
          g.lineWidth = Math.max(2, 2.6 * S);
          g.stroke();
          break;
        }
        case 'flake':
          g.rotate(q.rot ?? 0);
          g.scale(1, Math.cos((q.rot ?? 0) * 1.5));
          g.fillStyle = '#e8bf55';
          g.fillRect(-q.s, -q.s, q.s * 2, q.s * 2);
          break;
        case 'soul': {
          g.translate(Math.sin(time * 3 + (q.ph ?? 0)) * 8 * S, 0);
          g.globalCompositeOperation = 'lighter';
          const rg = g.createRadialGradient(0, 0, 0, 0, 0, q.s * 2.6);
          rg.addColorStop(0, 'rgba(190,225,255,.9)');
          rg.addColorStop(0.4, 'rgba(100,160,255,.4)');
          rg.addColorStop(1, 'rgba(100,160,255,0)');
          g.fillStyle = rg;
          g.beginPath();
          g.arc(0, 0, q.s * 2.6, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(235,245,255,.95)';
          g.beginPath();
          g.moveTo(0, -q.s * 1.8);
          g.quadraticCurveTo(q.s, 0, 0, q.s * 0.7);
          g.quadraticCurveTo(-q.s, 0, 0, -q.s * 1.8);
          g.fill();
          g.strokeStyle = 'rgba(190,220,255,.6)';
          g.lineWidth = q.s * 0.35;
          g.lineCap = 'round';
          g.beginPath();
          g.moveTo(0, q.s * 0.5);
          g.quadraticCurveTo(q.s * 0.8 * Math.sin(time * 5), q.s * 1.6, -q.s * 0.3, q.s * 2.6);
          g.stroke();
          break;
        }
        case 'maple': {
          g.rotate(q.rot ?? 0);
          g.scale(1, Math.cos((q.rot ?? 0) * 1.3));
          g.fillStyle = '#b8322a';
          g.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * TAU - Math.PI / 2,
              r = i % 2 ? q.s * 0.45 : q.s;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          g.closePath();
          g.fill();
          break;
        }
        case 'fw':
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = q.c ?? '#fff';
          g.beginPath();
          g.arc(0, 0, q.s, 0, TAU);
          g.fill();
          g.globalAlpha = fa * 0.4;
          g.fillRect(-(q.vx ?? 0) * 0.03, -(q.vy ?? 0) * 0.03, q.s, q.s);
          break;
        case 'conf':
          g.rotate(q.rot ?? 0);
          g.scale(1, Math.cos((q.rot ?? 0) * 1.7));
          g.fillStyle = q.c ?? '#fff';
          g.fillRect(-q.s, -q.s * 0.5, q.s * 2, q.s);
          break;
        case 'duck': {
          g.rotate(q.rot ?? 0);
          const s2 = q.s;
          g.fillStyle = '#f2c630';
          g.beginPath();
          g.ellipse(0, 0, s2, s2 * 0.65, 0, 0, TAU);
          g.fill();
          g.beginPath();
          g.arc(s2 * 0.55, -s2 * 0.6, s2 * 0.45, 0, TAU);
          g.fill();
          g.fillStyle = '#e8762a';
          g.beginPath();
          g.moveTo(s2 * 0.9, -s2 * 0.65);
          g.lineTo(s2 * 1.35, -s2 * 0.5);
          g.lineTo(s2 * 0.9, -s2 * 0.4);
          g.fill();
          g.fillStyle = '#111';
          g.beginPath();
          g.arc(s2 * 0.7, -s2 * 0.75, s2 * 0.08, 0, TAU);
          g.fill();
          g.fillStyle = '#e0b220';
          g.beginPath();
          g.ellipse(-s2 * 0.15, -s2 * 0.05, s2 * 0.45, s2 * 0.25, -0.3, 0, TAU);
          g.fill();
          break;
        }
      }
      g.restore();
    }
  }
  function drawFx2() {
    drawSwords();
    drawPx();
    for (const q of fx.coins) {
      const k = easeInOut(clamp(q.t / q.life)),
        x = lerp(q.x0, 40, k),
        y = lerp(q.y0, 40, k) - Math.sin(k * Math.PI) * 90 * S,
        r = Math.max(6, 8 * S);
      g.fillStyle = '#d8b050';
      g.beginPath();
      g.arc(x, y, r, 0, TAU);
      g.fill();
      g.strokeStyle = '#8a6a20';
      g.lineWidth = 1.5;
      g.stroke();
      g.fillStyle = '#3a2a10';
      g.fillRect(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.5);
    }
    for (const q of fx.shards) {
      g.save();
      g.globalAlpha = 1 - clamp((q.t - q.life * 0.5) / (q.life * 0.5));
      g.translate(q.x, q.y);
      g.rotate(q.rot);
      g.fillStyle = 'rgba(222,230,238,.8)';
      g.strokeStyle = 'rgba(255,255,255,.9)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, -q.s);
      g.lineTo(q.s * 0.6, q.s * 0.7);
      g.lineTo(-q.s * 0.5, q.s * 0.4);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
    }
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const q of fx.kanji) {
      const k = q.t / q.life,
        sc = 1 + 0.35 * Math.pow(1 - clamp(k * 6), 3);
      g.save();
      g.globalAlpha = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
      g.translate(q.x, q.y);
      g.rotate(q.rot);
      g.scale(sc, sc);
      g.font = `800 ${q.s}px ${FONT}`;
      g.lineWidth = Math.max(3, q.s * 0.08);
      g.strokeStyle = 'rgba(236,230,218,.7)';
      g.strokeText(q.ch, 0, 0);
      g.fillStyle = '#0e0d0c';
      g.fillText(q.ch, 0, 0);
      g.restore();
    }
    if (fx.flies.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const q of fx.flies) {
        const a = (1 - q.t / q.life) * (0.5 + 0.5 * Math.sin(time * 8 + q.ph)),
          r = Math.max(3, 6 * S);
        const rg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
        rg.addColorStop(0, `rgba(226,245,160,${a})`);
        rg.addColorStop(1, 'rgba(226,245,160,0)');
        g.fillStyle = rg;
        g.fillRect(q.x - r, q.y - r, r * 2, r * 2);
      }
      g.restore();
    }
    for (const q of fx.splash) {
      g.fillStyle = `rgba(${q.c},${0.9 * (1 - q.t / q.life)})`;
      const r = Math.max(1, (q.drift ? 2.2 : 1.5) * S);
      g.fillRect(q.x - r / 2, q.y - r / 2, r, r);
    }
    for (const q of fx.petals) {
      g.globalAlpha = 1 - clamp((q.t - q.life * 0.6) / (q.life * 0.4));
      g.save();
      g.translate(q.x, q.y);
      g.rotate(q.rot);
      g.scale(1, Math.cos(q.rot * 1.3));
      g.fillStyle = '#ecdcdd';
      g.beginPath();
      g.ellipse(0, 0, q.s, q.s * 0.6, 0, 0, TAU);
      g.fill();
      g.restore();
    }
    for (const c of fx.crows) {
      g.globalAlpha = 1 - clamp((c.t - c.life * 0.6) / (c.life * 0.4));
      const fl = Math.sin(c.t * 18 + c.ph);
      g.save();
      g.translate(c.x, c.y);
      if (c.vx < 0) g.scale(-1, 1);
      g.fillStyle = '#0b0b0a';
      g.beginPath();
      g.ellipse(0, 0, c.s * 0.55, c.s * 0.2, -0.2, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(c.s * 0.55, -c.s * 0.12, c.s * 0.14, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(-c.s * 0.1, 0);
      g.quadraticCurveTo(-c.s * 0.2, -fl * c.s, -c.s * 0.75, -fl * c.s * 0.6);
      g.lineTo(c.s * 0.15, 0);
      g.closePath();
      g.fill();
      g.restore();
    }
    g.globalAlpha = 1;
    if (fx.embers.length || fx.bolts.length) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (const q of fx.embers) {
        g.fillStyle = `rgba(255,220,180,${(1 - q.t / q.life) * (0.6 + 0.4 * Math.sin(time * 20 + q.ph))})`;
        g.beginPath();
        g.arc(q.x, q.y, Math.max(1, 1.8 * S), 0, TAU);
        g.fill();
      }
      for (const q of fx.bolts) {
        const a = 1 - q.t / q.life;
        g.lineJoin = 'round';
        g.beginPath();
        q.pts.forEach((pt, i) => (i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1])));
        g.strokeStyle = `rgba(200,210,255,${a * 0.35})`;
        g.lineWidth = Math.max(6, 9 * S);
        g.stroke();
        g.strokeStyle = `rgba(240,244,255,${a})`;
        g.lineWidth = Math.max(2, 3 * S);
        g.stroke();
      }
      g.restore();
    }
  }
  function drawStains() {
    for (const s of fx.stains) {
      g.fillStyle = `rgba(8,8,7,${0.5 * (1 - clamp((s.t - s.life * 0.6) / (s.life * 0.4))) * clamp(s.t * 4)})`;
      g.beginPath();
      g.ellipse(s.x, s.y, s.rx * clamp(0.4 + s.t * 3), s.rx * 0.22, 0, 0, TAU);
      g.fill();
    }
  }
  function drawPops() {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const q of fx.pops) {
      const k = q.t / q.life;
      g.globalAlpha = 1 - k * k;
      g.font = `800 ${q.size}px ${FONT}`;
      g.lineWidth = 4;
      g.strokeStyle = 'rgba(10,10,9,.75)';
      g.strokeText(q.text, q.x, q.y - k * 16 * S);
      g.fillStyle = '#efe9dd';
      g.fillText(q.text, q.x, q.y - k * 16 * S);
    }
    g.globalAlpha = 1;
  }
  function drawStamps() {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const s of fx.stamps) {
      const k = s.t / s.life,
        sc = 1 + 0.6 * Math.pow(1 - clamp(k * 6), 3),
        a = k < 0.7 ? clamp(k * 10) : 1 - (k - 0.7) / 0.3;
      g.save();
      g.globalAlpha = a;
      g.translate(s.x, s.y);
      g.scale(sc, sc);
      g.rotate(-0.05);
      g.font = `800 ${s.size}px ${FONT}`;
      const tw = g.measureText(s.text).width;
      if (s.seal) {
        const pw = tw + s.size * 0.5,
          ph = s.size * 1.3;
        g.fillStyle = SEAL;
        g.fillRect(-pw / 2, -ph / 2, pw, ph);
        g.strokeStyle = 'rgba(244,237,225,.45)';
        g.lineWidth = 2;
        g.strokeRect(-pw / 2 + 5, -ph / 2 + 5, pw - 10, ph - 10);
        g.fillStyle = '#f4ede1';
        g.fillText(s.text, 0, s.size * 0.04);
      } else {
        g.lineWidth = 6;
        g.strokeStyle = 'rgba(10,10,9,.7)';
        g.strokeText(s.text, 0, 0);
        g.fillStyle = '#efe9dd';
        g.fillText(s.text, 0, 0);
      }
      g.restore();
    }
  }
  return { drawFx, drawFx2, drawStains, drawPops, drawStamps };
}
