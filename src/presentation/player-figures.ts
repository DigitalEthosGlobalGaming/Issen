import { foxfirePose } from './foxfire-pose.ts';
import type { Palette } from '../rendering/palette.ts';
import { TAU } from '../shared/math.ts';
import { ROBES } from '../game/content/cosmetics.ts';
import { ROBE_AWAKENINGS } from '../game/content/robe-awakenings.ts';
import type { RunState } from '../game/run-state.ts';
import type { PlayerAnimation } from '../game/player/player.ts';
import type { Equipment } from '../platform/saves.ts';
import type { SceneDrawing } from '../rendering/scene-drawing.ts';
import type { Figure, SecondaryMotion } from '../rendering/figures/types.ts';

export interface PlayerFigureViews {
  readonly G: Readonly<Pick<RunState, 'm' | 'state' | 'foxUsed'>>;
  readonly L: { readonly player: { readonly x: number; readonly y: number; readonly h: number } };
  readonly g: SceneDrawing;
  readonly presentationState: { readonly time: number };
  readonly EQ: Readonly<Equipment>;
  readonly W: number;
  readonly H: number;
  readonly drawPetAt: (type: string, x: number, y: number, size: number) => void;
  readonly P: Readonly<PlayerAnimation>;
  readonly drawFigure: (figure: Figure) => void;
  readonly apparelMotion: { sample(): SecondaryMotion };
  readonly playerRobePalette: () => Palette;
  readonly isRobeSp: () => boolean;
  readonly bladeStyle: () => Figure['blade'];
  readonly CHARMCOL: Readonly<Record<string, string>>;
  readonly petOf: () => string;
}
/** Read-only figure views keep companion/player drawing outside gameplay rules. */
export function createPlayerFigures(readViews: () => PlayerFigureViews) {
  function drawFoxfire() {
    const { G, L, g, presentationState } = readViews();
    if (!G.m || !G.m.foxfire) return;
    const { x, y, radius: r } = foxfirePose(L.player, presentationState.time);
    const a = G.foxUsed && G.state !== 'title' ? 0.22 : 0.9;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
    rg.addColorStop(0, `rgba(170,215,255,${a})`);
    rg.addColorStop(0.4, `rgba(90,150,255,${a * 0.5})`);
    rg.addColorStop(1, 'rgba(90,150,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r * 2.4, 0, TAU);
    g.fill();
    const tip = y - r * 1.6 - Math.sin(presentationState.time * 9) * r * 0.3;
    g.fillStyle = `rgba(230,245,255,${a})`;
    g.beginPath();
    g.moveTo(x, tip);
    g.quadraticCurveTo(x + r, y, x, y + r * 0.7);
    g.quadraticCurveTo(x - r, y, x, tip);
    g.fill();
    g.restore();
  }
  function drawPet() {
    const { EQ, L, H, W, drawPetAt } = readViews();
    const pt = EQ.pet,
      p = L.player;
    if (pt === 'shiba') drawPetAt('shiba', p.x + p.h * 0.47, H - 2, p.h * 0.14);
    else if (pt === 'mystic-rock')
      drawPetAt(pt, p.x + p.h * 0.46, H - 2 - p.h * 0.12, Math.min(120, p.h * 0.23));
    else if (pt === 'cat') drawPetAt('cat', W * 0.85, H * 0.93 - W * 0.045, Math.max(W, H) * 0.045);
  }
  function drawPlayer() {
    const {
      L,
      P,
      drawFigure,
      apparelMotion,
      playerRobePalette,
      isRobeSp,
      EQ,
      bladeStyle,
      CHARMCOL,
      petOf,
    } = readViews();
    const p = L.player;
    drawFigure({
      x: p.x + P.lean * p.h,
      y: p.y + P.fall * p.h * 0.22,
      h: p.h,
      back: true,
      fog: 0,
      d: P.d,
      pose: P.pose,
      secondary: apparelMotion.sample(),
      waiting: P.swingT > 0.6 && !P.fall,
      lean: 0,
      rot: -P.fall * 0.28,
      noShadow: true,
      pal: playerRobePalette(),
      robeAura: isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.aura : null,
      blade: bladeStyle(),
      bladeId: EQ.blade,
      robeId: EQ.robe,
      variant: (ROBES[EQ.robe] || {}).variant,
      cape: (ROBES[EQ.robe] || {}).cape,
      coat: (ROBES[EQ.robe] || {}).coat,
      rf: ROBES[EQ.robe],
      charm: CHARMCOL[EQ.charm],
      charmId: EQ.charm,
      crest: EQ.crest === 'nocrest' ? null : EQ.crest,
      pet: petOf(),
    });
  }
  return { drawFoxfire, drawPet, drawPlayer };
}
