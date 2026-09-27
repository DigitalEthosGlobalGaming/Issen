import type { Effects } from './state.ts';
import type { Random } from '../../shared/random.ts';
export interface EffectEnvironment {
  scale: number;
  wind: number;
  time: number;
  random: Random;
  onSwordStuck: () => void;
}
export function updateEffects(fx: Effects, dt: number, raw: number, env: EffectEnvironment) {
  const { scale: S, wind, time, random: R, onSwordStuck } = env;
  for (const knife of fx.knives) knife.t += dt;
  fx.knives = fx.knives.filter((knife) => knife.t < knife.life);
  for (const s of fx.slashes) s.t += dt;
  fx.slashes = fx.slashes.filter((s) => s.t < s.life);
  for (const d of fx.drops) {
    d.t += dt;
    d.vy += 1100 * S * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vx *= Math.exp(-dt * 2);
  }
  fx.drops = fx.drops.filter((d) => d.t < d.life);
  for (const s of fx.sparks) {
    s.t += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 600 * S * dt;
  }
  fx.sparks = fx.sparks.filter((s) => s.t < s.life);
  for (const q of fx.pops) q.t += dt;
  fx.pops = fx.pops.filter((q) => q.t < q.life);
  for (const u of fx.dust) {
    u.t += dt;
    u.x += u.vx * dt;
    u.r *= 1 + dt * 0.8;
  }
  fx.dust = fx.dust.filter((u) => u.t < u.life);
  for (const r of fx.rings) r.t += dt;
  fx.rings = fx.rings.filter((r) => r.t < r.life);
  for (const c of fx.scraps) {
    c.t += dt;
    c.vy += 320 * S * dt;
    c.vx += wind * 60 * S * dt;
    c.vx *= Math.exp(-dt * 1.2);
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.rot += c.vr * dt;
  }
  fx.scraps = fx.scraps.filter((c) => c.t < c.life);
  for (const s of fx.stains) s.t += dt;
  fx.stains = fx.stains.filter((s) => s.t < s.life);
  for (const q of fx.petals) {
    q.t += dt;
    q.vy += 90 * S * dt;
    q.vx += wind * 50 * S * dt;
    q.vx *= Math.exp(-dt * 1.5);
    q.vy *= Math.exp(-dt * 1.2);
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.rot = (q.rot ?? 0) + q.vr * dt;
  }
  fx.petals = fx.petals.filter((q) => q.t < q.life);
  for (const q of fx.swords) {
    q.t += dt;
    if (!q.stuck) {
      q.vy += 1200 * S * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.ang += q.vr * dt;
      if (q.vy > 0 && q.y >= q.ground - q.len * 0.3) {
        q.stuck = true;
        q.y = q.ground - q.len * 0.3;
        q.ang = Math.PI / 2 + (R() - 0.5) * 0.5;
        onSwordStuck();
      }
    }
  }
  fx.swords = fx.swords.filter((q) => q.t < q.life);
  for (const q of fx.splash) {
    q.t += dt;
    q.vy += (q.drift ? 60 : 900) * S * dt;
    q.vx *= Math.exp(-dt * (q.drift ? 2 : 0.5));
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
  fx.splash = fx.splash.filter((q) => q.t < q.life);
  for (const q of fx.px) {
    q.t += dt;
    if (q.t < 0) continue;
    if (q.k === 'koi' && q.vr) {
      const a = q.vr * dt,
        c = Math.cos(a),
        sn = Math.sin(a),
        vx = (q.vx ?? 0) * c - (q.vy ?? 0) * sn;
      q.vy = (q.vx ?? 0) * sn + (q.vy ?? 0) * c;
      q.vx = vx;
    } else if (q.vr) q.rot = (q.rot ?? 0) + q.vr * dt;
    if (q.g) q.vy = (q.vy ?? 0) + q.g * S * dt;
    if (q.drag) {
      const f = Math.exp(-dt * q.drag);
      q.vx = (q.vx ?? 0) * f;
      q.vy = (q.vy ?? 0) * f;
    }
    if (q.vx != null) {
      q.x += q.vx * dt;
      q.y += (q.vy ?? 0) * dt;
    }
  }
  fx.px = fx.px.filter((q) => q.t < q.life);
  for (const q of fx.coins) q.t += dt;
  fx.coins = fx.coins.filter((q) => q.t < q.life);
  for (const q of fx.kanji) q.t += dt;
  fx.kanji = fx.kanji.filter((q) => q.t < q.life);
  for (const q of fx.flies) {
    q.t += dt;
    q.x += (q.vx + Math.sin(time * 3 + q.ph) * 18 * S) * dt;
    q.y += q.vy * dt;
  }
  fx.flies = fx.flies.filter((q) => q.t < q.life);
  for (const q of fx.shards) {
    q.t += dt;
    q.vy += 900 * S * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.rot += q.vr * dt;
  }
  fx.shards = fx.shards.filter((q) => q.t < q.life);
  for (const q of fx.bolts) q.t += dt;
  fx.bolts = fx.bolts.filter((q) => q.t < q.life);
  for (const q of fx.embers) {
    q.t += dt;
    q.x += (q.vx + Math.sin(time * 5 + q.ph) * 30 * S) * dt;
    q.y += q.vy * dt;
    q.vy *= Math.exp(-dt * 0.8);
  }
  fx.embers = fx.embers.filter((q) => q.t < q.life);
  for (const q of fx.crows) {
    q.t += dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vy -= 20 * S * dt;
  }
  fx.crows = fx.crows.filter((q) => q.t < q.life);
  for (const s of fx.stamps) s.t += raw;
  fx.stamps = fx.stamps.filter((s) => s.t < s.life);
}
