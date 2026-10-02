import { bladeEffectPoint, supportsInkBlade } from './blade-recipes.ts';
import { supportsInkOutfit } from './outfit-kit.ts';
import { enemyPresence } from './enemy-presence.ts';
import { playerPresence } from './player-presence.ts';
import { TAU, clamp, easeOut } from '../../shared/math.ts';
import type { Palette } from '../palette.ts';
import type { Figure, FigureEnvironment, Pose, Point, BladeStyle, Aura } from './types.ts';
export function createFigureRenderer(g: CanvasRenderingContext2D, env: FigureEnvironment) {
  const { time: clock, petActive, width: W, height: H, palette: cols, random: R } = env;
  const time = env.reducedMotion ? 0 : clock;
  function bladePath(length: number, bladeId: string) {
    g.beginPath();
    for (let i = 0; i <= 28; i++) {
      const [x, y] = bladeEffectPoint(bladeId, length, i / 28);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
  }
  function drawThirdLightning(length: number, bladeId: string) {
    const pulse = env.reducedFlashes ? 0 : Math.floor(time * 18);
    const arcs = (env.effectDensity ?? 1) < 0.55 ? 1 : 2;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let arc = 0; arc < arcs; arc++) {
      g.beginPath();
      for (let i = 0; i <= 12; i++) {
        const [x, centerY] = bladeEffectPoint(bladeId, length, i / 12);
        const jitter =
          i === 0 || i === 12 ? 0 : Math.sin(i * 23.7 + pulse * 7.13 + arc * 19) * 0.019;
        const y = centerY + jitter + (arc ? 0.009 : -0.006);
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.strokeStyle = 'rgba(24,172,255,.48)';
      g.lineWidth = 0.042;
      g.stroke();
      g.strokeStyle = 'rgba(239,253,255,.96)';
      g.lineWidth = 0.008;
      g.stroke();
      const head = env.reducedFlashes ? 0.5 : (time * 1.1 + arc * 0.47) % 1;
      g.beginPath();
      for (let i = 0; i <= 4; i++) {
        const u = Math.max(0, head - 0.2 + (i / 4) * 0.2);
        const [x, centerY] = bladeEffectPoint(bladeId, length, u);
        const y = centerY + Math.sin(u * 36 + pulse * 7.13 + arc * 19) * 0.014;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.strokeStyle = 'rgba(20,182,255,.72)';
      g.lineWidth = 0.055;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.98)';
      g.lineWidth = 0.011;
      g.stroke();
    }
  }
  function drawSword(
    gx: number,
    gy: number,
    ang: number,
    C: Palette,
    bs?: BladeStyle | null,
    _ink = true,
    bladeId = 'steel',
  ) {
    const Lb = bs ? bs.len : 0.52;
    g.save();
    g.translate(gx, gy);
    g.rotate(ang);
    env.inkSword?.draw(g, 0, 0, 0, C, bs, bladeId);
    if (bs && bs.kind === 'beam') {
      const c = bs.c || '120,190,255';

      g.save();
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      const fl = 0.85 + 0.15 * Math.sin(time * 50);
      g.strokeStyle = `rgba(${c},${0.22 * fl})`;
      g.lineWidth = 0.085;
      g.beginPath();
      g.moveTo(0.02, 0);
      g.lineTo(Lb, 0);
      g.stroke();
      g.strokeStyle = `rgba(${c},${0.6 * fl})`;
      g.lineWidth = 0.036;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.95)';
      g.lineWidth = 0.014;
      g.stroke();
      g.restore();
      g.restore();
      return;
    }
    if (bs && bs.kind === 'pan') {
      if (bs.aura) drawAura(Lb, bs.aura, bladeId);
      g.restore();
      return;
    }
    if (bs && bs.glow) {
      g.strokeStyle = bs.glow;
      g.lineWidth = 0.04;
      g.lineCap = 'round';
      bladePath(Lb, bladeId);
      g.stroke();
    }
    if (bs && bs.aura && bs.aura.mode === 'after') {
      for (let i = 1; i <= 2; i++) {
        g.save();
        g.rotate(-i * 0.11 - Math.sin(time * 3) * 0.03);
        g.globalAlpha *= 0.3 / i;
        g.strokeStyle = `rgb(${bs.aura.c})`;
        g.lineWidth = 0.021;
        g.lineCap = 'round';
        bladePath(Lb, bladeId);
        g.stroke();
        g.restore();
      }
    }

    if (bs && bs.aura) drawAura(Lb, bs.aura, bladeId);
    g.restore();
  }
  function drawAura(Lb: number, a: Aura, bladeId: string) {
    const t = time,
      c = a.c;
    g.save();
    if (a.mode === 'dark') {
      for (let i = 0; i < 7; i++) {
        const k = (t * 0.5 + i / 7) % 1,
          [x, centerY] = bladeEffectPoint(bladeId, Lb, 0.1 + 0.85 * ((i * 0.41) % 1)),
          y = centerY - 0.02 - k * 0.1;
        g.fillStyle = `rgba(${c},${0.55 * (1 - k)})`;
        g.beginPath();
        g.ellipse(x, y, 0.035 * (0.6 + k), 0.02 * (0.6 + k), 0, 0, TAU);
        g.fill();
      }
      g.strokeStyle = `rgba(${c},.45)`;
      g.lineWidth = 0.05;
      g.lineCap = 'round';
      bladePath(Lb, bladeId);
      g.stroke();
    } else {
      g.globalCompositeOperation = 'lighter';
      const pul = 0.55 + 0.25 * Math.sin(t * 6);
      g.lineCap = 'round';
      g.strokeStyle = `rgba(${c},${0.25 * pul})`;
      g.lineWidth = 0.065;
      bladePath(Lb, bladeId);
      g.stroke();
      g.lineWidth = 0.025;
      g.strokeStyle = `rgba(${c},${0.5 * pul})`;
      g.stroke();
      if (a.mode === 'bolt') {
        g.strokeStyle = `rgba(${c},.95)`;
        g.lineWidth = 0.006;
        g.beginPath();
        for (let i = 0; i <= 14; i++) {
          const [x, y] = bladeEffectPoint(bladeId, Lb, i / 14);
          const offset = i === 0 || i === 14 ? 0 : (R() - 0.5) * 0.04;
          if (i) g.lineTo(x, y + offset);
          else g.moveTo(x, y);
        }
        g.stroke();
      }
      if (a.mode === 'third') drawThirdLightning(Lb, bladeId);
      if (a.mode === 'frost' || a.mode === 'glow' || a.mode === 'third') {
        const count = a.mode === 'third' ? Math.round(12 * (env.effectDensity ?? 1)) : 6;
        for (let i = 0; i < count; i++) {
          const k = (t * (a.mode === 'third' ? 0.85 : 0.6) + i / count) % 1,
            [x, centerY] = bladeEffectPoint(bladeId, Lb, (i * 0.37 + 0.1) % 1),
            y = centerY - 0.015 - k * (a.mode === 'third' ? 0.13 : 0.07);
          g.fillStyle = `rgba(${c},${0.85 * (1 - k)})`;
          g.beginPath();
          g.arc(x, y, a.mode === 'frost' ? 0.007 : a.mode === 'third' ? 0.011 : 0.009, 0, TAU);
          g.fill();
        }
      }
      if (a.mode === 'petal') {
        for (let i = 0; i < 6; i++) {
          const k = (t * 0.4 + i / 6) % 1,
            [x, centerY] = bladeEffectPoint(bladeId, Lb, 0.15 + 0.85 * ((i * 0.37) % 1)),
            y = centerY - 0.02 - k * 0.13;
          g.fillStyle = `rgba(${c},${0.9 * (1 - k)})`;
          g.save();
          g.translate(x, y);
          g.rotate(t * 3 + i);
          g.beginPath();
          g.ellipse(0, 0, 0.015, 0.008, 0, 0, TAU);
          g.fill();
          g.restore();
        }
      }
    }
    g.restore();
  }
  function tipOf(p: Pose, lx: number, Lb = 0.52): Point {
    Lb = Lb || 0.52;
    const ca = Math.cos(p.ang),
      sa = Math.sin(p.ang);
    return [p.gx + lx + ca * Lb + sa * Lb * 0.05, p.gy + sa * Lb - ca * Lb * 0.05];
  }
  function drawGlint(x: number, y: number, k: number) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const s = k * (0.2 + (env.reducedFlashes ? 0 : 0.035 * Math.sin(time * 45)));
    const rg = g.createRadialGradient(x, y, 0, x, y, s);
    rg.addColorStop(0, 'rgba(255,255,250,.95)');
    rg.addColorStop(0.25, 'rgba(255,250,235,.45)');
    rg.addColorStop(1, 'rgba(255,250,235,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, s, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,252,.95)';
    for (const [a, len] of [
      [0.25, s * 2.6],
      [0.25 + Math.PI / 2, s * 1.7],
    ] as const) {
      const c = Math.cos(a),
        n = Math.sin(a),
        w = s * 0.07;
      g.beginPath();
      g.moveTo(x + c * len, y + n * len);
      g.lineTo(x - n * w, y + c * w);
      g.lineTo(x - c * len, y - n * len);
      g.lineTo(x + n * w, y - c * w);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  function drawSpear(gx: number, gy: number, ang: number, C: Palette) {
    g.save();
    g.translate(gx, gy);
    g.rotate(ang);
    g.strokeStyle = C.hilt;
    g.lineWidth = 0.016;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-0.38, 0);
    g.lineTo(0.8, 0);
    g.stroke();
    g.fillStyle = C.tsuba;
    g.fillRect(0.78, -0.012, 0.03, 0.024);
    const gr = g.createLinearGradient(0, -0.015, 0, 0.015);
    gr.addColorStop(0, C.steelD);
    gr.addColorStop(0.5, C.steelL);
    gr.addColorStop(1, C.steel);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0.81, -0.014);
    g.quadraticCurveTo(0.9, -0.016, 0.98, 0);
    g.quadraticCurveTo(0.9, 0.016, 0.81, 0.014);
    g.closePath();
    g.fill();
    g.restore();
  }
  function drawCrest(id: string, x: number, y: number, r: number) {
    g.save();
    g.translate(x, y);
    const col = 'rgba(224,217,202,.88)';
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineWidth = r * 0.12;
    g.lineCap = 'round';
    const ring = () => {
      g.beginPath();
      g.arc(0, 0, r, 0, TAU);
      g.stroke();
    };
    if (id === 'tomoe') {
      ring();
      for (let i = 0; i < 3; i++) {
        g.save();
        g.rotate((i * TAU) / 3);
        g.beginPath();
        g.arc(0, -r * 0.5, r * 0.26, 0, TAU);
        g.fill();
        g.lineWidth = r * 0.16;
        g.beginPath();
        g.arc(0, 0, r * 0.5, -Math.PI / 2, Math.PI * 0.05);
        g.stroke();
        g.restore();
      }
    } else if (id === 'kikyo') {
      for (let i = 0; i < 5; i++) {
        g.save();
        g.rotate((i * TAU) / 5);
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(-r * 0.5, -r * 0.5, -r * 0.22, -r * 0.98);
        g.lineTo(0, -r * 0.8);
        g.lineTo(r * 0.22, -r * 0.98);
        g.quadraticCurveTo(r * 0.5, -r * 0.5, 0, 0);
        g.fill();
        g.restore();
      }
      g.fillStyle = 'rgba(20,19,17,.8)';
      g.beginPath();
      g.arc(0, 0, r * 0.14, 0, TAU);
      g.fill();
    } else if (id === 'juji') {
      ring();
      g.lineWidth = r * 0.2;
      g.lineCap = 'butt';
      g.beginPath();
      g.moveTo(-r * 0.72, 0);
      g.lineTo(r * 0.72, 0);
      g.moveTo(0, -r * 0.72);
      g.lineTo(0, r * 0.72);
      g.stroke();
    } else if (id === 'aoi') {
      ring();
      for (let i = 0; i < 3; i++) {
        g.save();
        g.rotate((i * TAU) / 3);
        g.beginPath();
        g.moveTo(0, -r * 0.08);
        g.quadraticCurveTo(-r * 0.5, -r * 0.3, -r * 0.3, -r * 0.66);
        g.quadraticCurveTo(-r * 0.15, -r * 0.86, 0, -r * 0.7);
        g.quadraticCurveTo(r * 0.15, -r * 0.86, r * 0.3, -r * 0.66);
        g.quadraticCurveTo(r * 0.5, -r * 0.3, 0, -r * 0.08);
        g.fill();
        g.restore();
      }
    } else if (id === 'fuji') {
      ring();
      for (const sd of [-1, 1])
        for (let k = 0; k < 6; k++) {
          const t = k / 5;
          g.beginPath();
          g.arc(
            sd * r * (0.12 + 0.42 * Math.sin(t * Math.PI * 0.9)),
            -r * 0.62 + t * r * 1.15,
            r * (0.17 - 0.018 * k),
            0,
            TAU,
          );
          g.fill();
        }
    } else if (id === 'tsuru') {
      ring();
      g.lineWidth = r * 0.2;
      g.beginPath();
      g.arc(0, r * 0.05, r * 0.62, Math.PI * 0.95, Math.PI * 2.05);
      g.stroke();
      g.beginPath();
      g.arc(0, -r * 0.5, r * 0.16, 0, TAU);
      g.fill();
      g.lineWidth = r * 0.08;
      g.beginPath();
      g.moveTo(r * 0.1, -r * 0.5);
      g.lineTo(r * 0.4, -r * 0.4);
      g.stroke();
      g.beginPath();
      g.moveTo(0, -r * 0.35);
      g.lineTo(0, r * 0.35);
      g.stroke();
    } else if (id === 'rokumon') {
      for (let row = 0; row < 2; row++)
        for (let c = 0; c < 3; c++) {
          const cx = (c - 1) * r * 0.64,
            cy = (row - 0.5) * r * 0.68;
          g.fillStyle = col;
          g.beginPath();
          g.arc(cx, cy, r * 0.29, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(20,19,17,.85)';
          g.fillRect(cx - r * 0.08, cy - r * 0.08, r * 0.16, r * 0.16);
        }
    }
    g.restore();
  }
  function drawCrow(x: number, y: number, size: number) {
    env.inkCompanion?.draw('crow', g, x, y, size, time, petActive, env.reducedMotion);
  }
  function drawPetAt(type: string, x: number, y: number, size: number) {
    env.inkCompanion?.draw(type, g, x, y, size, time, petActive, env.reducedMotion);
  }
  function drawFigure(f: Figure) {
    f = enemyPresence(f, time, !!env.reducedMotion);
    f = playerPresence(f, time, !!env.reducedMotion);
    const C = f.pal || cols(f.fog),
      lx = f.lean || 0,
      t = time;
    g.save();
    g.translate(f.x, f.y);
    if (f.rot) g.rotate(f.rot);
    g.scale(f.h, f.h * (f.sy || 1));
    if (f.alpha != null && f.alpha < 1) g.globalAlpha *= f.alpha;
    if (f.robeAura) {
      // Small, stateless fabric halo behind the body. It follows figure opacity
      // and never borrows sword aura state or either preview's effect particles.
      const aura = f.robeAura;
      g.save();
      const halo = g.createRadialGradient(lx * 0.35, -0.44, 0.13, lx * 0.35, -0.44, 0.53);
      halo.addColorStop(0, `rgba(${aura.c},0)`);
      halo.addColorStop(0.58, `rgba(${aura.c},.12)`);
      halo.addColorStop(1, `rgba(${aura.c},0)`);
      g.fillStyle = halo;
      g.fillRect(-0.6 + lx * 0.35, -1.02, 1.2, 1.18);
      g.strokeStyle = `rgba(${aura.c},.35)`;
      g.fillStyle = `rgba(${aura.c},.25)`;
      g.lineWidth = 0.007;
      if (aura.mode === 'after' || aura.mode === 'dark') {
        g.beginPath();
        g.ellipse(lx * 0.35, -0.45, 0.38, 0.45, -0.12, Math.PI * 0.68, Math.PI * 1.88);
        g.stroke();
      } else {
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 ? 1 : -1) * (0.29 + Math.floor(i / 2) * 0.035);
          const y = -0.58 + Math.floor(i / 2) * 0.32;
          g.beginPath();
          if (aura.mode === 'bolt') {
            g.moveTo(x - 0.014, y - 0.025);
            g.lineTo(x + 0.01, y);
            g.lineTo(x - 0.008, y + 0.015);
            g.lineTo(x + 0.013, y + 0.036);
            g.stroke();
          } else if (aura.mode === 'petal') {
            g.ellipse(x, y, 0.018, 0.007, i * 0.8, 0, TAU);
            g.fill();
          } else {
            g.arc(x, y, aura.mode === 'frost' ? 0.01 : 0.015, 0, TAU);
            g.fill();
          }
        }
      }
      g.restore();
    }
    if (!f.noShadow) {
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.beginPath();
      g.ellipse(0.05, 0.004, 0.36, 0.035, 0, 0, TAU);
      g.fill();
    }
    if (!f.back) {
      g.strokeStyle = C.hilt;
      g.lineWidth = 0.02;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-0.08 + lx * 0.5, -0.52);
      g.lineTo(-0.36, -0.43);
      g.stroke();
    }
    const p = f.pose,
      gx = p.gx + lx,
      gy = p.gy,
      ca = Math.cos(p.ang),
      sa = Math.sin(p.ang);
    let h2: Point = [gx - ca * 0.075, gy - sa * 0.075];
    function drawHeldWeapons() {
      if (f.spear && !f.noSword) {
        drawSpear(gx, gy, p.ang, C);
      } else if (!f.noSword) {
        drawSword(gx, gy, p.ang, C, f.blade, supportsInkBlade(f.bladeId ?? 'steel'), f.bladeId);
      }
      if (f.twin) {
        drawSword(-0.19 + lx, -0.5, Math.PI - p.ang, C, {
          len: 0.38,
          d: C.steelD,
          m: C.steel,
          l: C.steelL,
          edge: 'rgba(255,253,246,.85)',
        });
      }
    }
    if (f.spear && !f.noSword) h2 = [gx - ca * 0.2, gy - sa * 0.2];
    if (f.twin) h2 = [-0.19 + lx, -0.5];
    // The player is viewed from behind, so the weapon passes behind the robe.
    if (f.back) drawHeldWeapons();
    const playerArt = f.back && supportsInkOutfit(f.robeId) ? env.inkPlayer : undefined;
    // Rear-view hands reach around the body; the torso occludes crossing forearms.
    const enemyArt = !f.back ? env.inkEnemy : undefined;
    playerArt?.drawPart(g, 'arms', f, env);
    (playerArt || enemyArt)?.drawPart(g, 'body', f, env);
    if (f.back && f.crest && !f.cape) drawCrest(f.crest, lx * 0.75, -0.67, 0.06);
    if (f.charm) {
      const cx = 0.1 + lx * 0.5,
        cy = -0.49;
      g.strokeStyle = '#d9d3c4';
      g.lineWidth = 0.004;
      g.beginPath();
      g.moveTo(cx, cy - 0.02);
      g.lineTo(cx, cy);
      g.stroke();
      env.inkCharm?.draw(g, f.charmId, cx, cy, 0.05, f.charm);
    }
    (playerArt || enemyArt)?.drawPart(g, 'head', f, env);
    if (enemyArt) {
      enemyArt.drawPart(g, 'arms', f, env);
      drawHeldWeapons();
      enemyArt.drawPart(g, 'hands', f, env);
    }
    if (f.glint != null && f.glint > 0) {
      const tp = tipOf(p, lx, f.spear ? 0.98 : f.blade ? f.blade.len : 0.52);
      drawGlint(tp[0], tp[1], f.glint);
    }
    if (f.pet === 'crow') drawCrow(0.14 + lx * 0.8, -0.755, 0.1);
    // Ground vegetation belongs to the scene, never to moving or split figure transforms.
    g.restore();
  }
  function drawGroundShadow(f: Pick<Figure, 'x' | 'y' | 'h' | 'alpha'>, opacity = 1) {
    if (opacity <= 0) return;
    g.save();
    g.globalAlpha *= opacity * (f.alpha ?? 1);
    g.translate(f.x, f.y);
    g.scale(f.h, f.h);
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.beginPath();
    g.ellipse(0.05, 0.004, 0.36, 0.035, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  function drawSplit(
    f: Figure,
    p: { x: number; y: number; h: number },
    ang: number,
    t: number,
    dur: number,
  ) {
    const cx = p.x,
      cy = p.y - p.h * 0.55,
      dx = Math.cos(ang),
      dy = Math.sin(ang),
      nx = -dy,
      ny = dx,
      Lg = Math.max(W, H) * 2;
    const fade = 1 - clamp((t - dur * 0.4) / (dur * 0.6));
    if (fade <= 0) return;
    // Ground contact belongs to the whole figure, not either moving fragment.
    // Drawing it inside each clipped half made shadows drift with falling bodies.
    if (!f.noShadow) {
      drawGroundShadow({ ...p, alpha: f.alpha }, fade);
    }
    for (const side of [1, -1]) {
      g.save();
      g.globalAlpha *= fade;
      const sep = p.h * (0.012 + 0.1 * easeOut(clamp(t / (dur * 0.6))));
      const drop = (p.h * 0.5 * t * t * (side === 1 ? 1 : 0.45)) / (dur * dur);
      g.translate(nx * sep * side + dx * sep * 0.5 * side, ny * sep * side + drop);
      g.beginPath();
      g.moveTo(cx - dx * Lg, cy - dy * Lg);
      g.lineTo(cx + dx * Lg, cy + dy * Lg);
      g.lineTo(cx + dx * Lg + nx * Lg * side, cy + dy * Lg + ny * Lg * side);
      g.lineTo(cx - dx * Lg + nx * Lg * side, cy - dy * Lg + ny * Lg * side);
      g.closePath();
      g.clip();
      drawFigure({ ...f, noShadow: true });
      g.restore();
    }
  }

  return { drawFigure, drawSplit, drawGroundShadow, drawPetAt, drawSword, drawGlint, tipOf };
}
