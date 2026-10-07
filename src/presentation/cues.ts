import { drawEnso as renderEnso, enemyGlyphCue } from '../rendering/glyphs.ts';
import { bossShownDirection } from '../game/encounters/boss-openings.ts';
import { clamp } from '../shared/math.ts';
import { STAGES } from '../game/content/stages.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { Direction } from '../shared/directions.ts';
import type { Enemy } from '../game/combat/enemy.ts';
import type { RunState } from '../game/run-state.ts';

export interface CueViews {
  readonly g: SceneDrawing;
  readonly time: number;
  readonly SEAL: string;
  readonly SEALARC: string;
  readonly FONT: string;
  readonly pz: () => number;
  readonly G: Readonly<
    Pick<
      RunState,
      | 'state'
      | 'cfg'
      | 'stage'
      | 'enemies'
      | 'attacker'
      | 'bless'
      | 'm'
      | 'blade'
      | 'event'
      | 'freezeT'
      | 'so'
      | 'boss'
    >
  >;
  readonly ordered: () => boolean;
  readonly liveOrdered: () => Enemy[];
  readonly veil: number;
}

/** Read-only encounter cues; direction/target resolution remains in rules. */
export function createCuePresentation(readViews: () => CueViews) {
  function drawEnso(
    x: number,
    y: number,
    r: number,
    dir: Direction,
    o: Parameters<typeof renderEnso>[6],
  ) {
    const { g, time, SEAL, SEALARC, FONT, pz, G } = readViews();
    renderEnso(
      g,
      {
        time: time,
        seal: SEAL,
        sealArc: SEALARC,
        font: FONT,
        perfectZone: pz(),
        noArc: !!G.m.noArc,
      },
      x,
      y,
      r,
      dir,
      o,
    );
  }

  function drawGlyphs() {
    const { G, ordered: isOrdered, veil, liveOrdered, g } = readViews();
    if (G.state === 'title' || !G.cfg) return;
    const ordered = isOrdered(),
      night = STAGES[G.stage]!.weather === 'night',
      veilK = 1 - veil * 0.85 * G.m.hazard;
    if (G.state === 'playing' || G.state === 'dead') {
      const live = G.enemies.filter(
        (e) => e.state === 'idle' || e.state === 'attack' || (e.state === 'enter' && e.t > 0.3),
      );
      const rk = ordered ? liveOrdered() : null;
      for (const e of live) {
        const p = e.pos,
          isA = e === G.attacker,
          r = isA ? clamp(p.h * 0.18, 22, 32) : clamp(p.h * 0.13, 12, 20),
          y = Math.max(p.y - p.h * 1.18 - r, r + 62);
        const shown = e.fake && !e.switched && !G.bless.has('mercy') ? e.fake : e.dir,
          rank = ordered ? rk!.indexOf(e) + 1 : 0;
        const cue = enemyGlyphCue(isA, rank, e.state === 'enter' ? (e.t - 0.3) / 0.3 : 1);
        let alpha = cue.alpha;
        if (G.state === 'dead') alpha *= 0.4;
        alpha *= veilK;
        const seer = G.bless.has('foresight') && (ordered ? rank === 1 : isA);
        if (G.event === 'fog' && !isA && !seer) alpha = 0;
        let arrowA = null;
        if (night && !G.m.noFade) {
          arrowA = isA
            ? clamp(1 - (e.p - 0.22) / 0.15, 0.06, 1)
            : e.state === 'idle'
              ? clamp(1 - (e.t - 0.9) / 0.4, 0.06, 1)
              : 1;
        }
        if (G.blade) arrowA = 0;
        if (G.m.blind) arrowA = 0;
        else if (seer) arrowA = null;
        drawEnso(p.x, y, r, shown, {
          emphasis: cue.emphasis,
          prog: isA && !G.m.noRing ? clamp(e.p) : null,
          alpha,
          rank,
          quiver: !!(e.fake && !e.switched),
          arrowA,
          frozen: isA && G.freezeT > 0,
          ghost: (G.bless.has('fox') || G.m.foxsight) && e.fake && !e.switched ? e.dir : null,
        });
      }
    }
    const so = G.so;
    if (so && G.state === 'standoff' && so.fired && !so.done) {
      const p = so.e.pos,
        r = clamp(p.h * 0.13, 22, 36);
      drawEnso(p.x - p.h * 0.42, Math.max(p.y - p.h * 0.8, r + 64), r, so.e.dir, {
        prog: clamp((so.t - so.ft) / so.win),
        alpha: 1,
        arrowA: G.blade || G.m.blind ? 0 : null,
        noArc: 1,
      });
    }
    const b = G.boss;
    if (b && b.state === 'stagger' && G.state === 'boss') {
      const p = b.pos,
        r = clamp(p.h * 0.11, 22, 38),
        ex = p.x - p.h * 0.42,
        ey = Math.max(p.y - p.h * 0.78, r + 64);
      drawEnso(ex, ey, r, bossShownDirection(b), {
        prog: clamp(b.t / b.window),
        alpha: 1,
        arrowA: G.blade || G.m.blind || G.m.duelBlind ? 0 : null,
        noArc: 1,
      });
      if (b.chainLen > 1) {
        const n = b.chainLen,
          sz = Math.max(6, r * 0.2),
          gp = sz * 2.3;
        for (let i = 0; i < n; i++) {
          g.save();
          g.translate(ex + (i - (n - 1) / 2) * gp, ey + r * 1.55);
          g.rotate(Math.PI / 4);
          g.fillStyle = i < b.chainLeft ? '#efe9dd' : 'rgba(239,233,221,.22)';
          g.strokeStyle = 'rgba(10,10,9,.6)';
          g.lineWidth = 1.5;
          g.fillRect(-sz / 2, -sz / 2, sz, sz);
          g.strokeRect(-sz / 2, -sz / 2, sz, sz);
          g.restore();
        }
      }
    }
  }

  return { drawEnso, drawGlyphs };
}
