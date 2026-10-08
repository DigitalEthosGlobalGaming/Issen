import type { EventBus, GameEvents } from '../game/events.ts';
import { DANG } from '../shared/directions.ts';
import type { Boss } from '../game/encounters/boss.ts';
export interface BossFeedbackViews {
  readonly W: number;
  readonly H: number;
  readonly S: number;
  readonly addSlash: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width: number,
    life?: number,
  ) => void;
  readonly killFx: (x: number, y: number, angle: number, scale: number) => void;
  readonly scraps: (x: number, y: number, count: number, scale: number) => void;
  readonly ring: (
    x: number,
    y: number,
    from: number,
    to: number,
    life: number,
    width: number,
  ) => void;
  readonly shake: (amount: number) => void;
  readonly flash: (amount: number) => void;
  readonly sfx: { slice(): void; bossDie(): void; caw(): void };
  readonly combatHaptics: { play(event: 'slice'): void };
  readonly stamp: (
    text: string,
    x: number,
    y: number,
    size: number,
    seal: boolean,
    life?: number,
  ) => void;
  readonly letterbox: (duration: number) => void;
  readonly punch: (zoom: number, x: number, y: number) => void;
  readonly inkBurst: (x: number, y: number, angle: number, count: number, scale: number) => void;
  readonly bossStain: (position: Boss['pos']) => void;
  readonly showBossBar: (shown: boolean) => void;
}
/** Cut/victory presentation consumes committed value snapshots without run/RNG ports. */
export function bindBossFeedback(events: EventBus<GameEvents>, readViews: () => BossFeedbackViews) {
  const offCut = events.on('bossCut', (event) => {
    const { S, addSlash, killFx, scraps, ring, shake, flash, sfx, combatHaptics } = readViews();
    const a = DANG[event.direction],
      v = [Math.cos(a), Math.sin(a)],
      cx = event.x,
      cy = event.y,
      h = event.height,
      len = h * (event.automatic ? 0.55 : 0.9),
      sc = h / 170;
    addSlash(
      cx - (v[0]! * len) / 2,
      cy - (v[1]! * len) / 2,
      cx + (v[0]! * len) / 2,
      cy + (v[1]! * len) / 2,
      Math.max(4, h * 0.03),
      0.35,
    );
    killFx(cx, cy, a + Math.PI / 2, sc);
    scraps(cx, cy, 8, sc);
    ring(cx, cy, h * 0.1, h * 0.7, 0.35, Math.max(2, 2.5 * S));
    shake(12 * S);
    flash(0.15);
    sfx.slice();
    combatHaptics.play('slice');
  });
  const offVictory = events.on('bossDefeated', (event) => {
    const {
      W,
      H,
      S,
      stamp,
      letterbox,
      punch,
      flash,
      addSlash,
      sfx,
      showBossBar,
      inkBurst,
      bossStain,
    } = readViews();
    const a = DANG[event.direction],
      v = [Math.cos(a), Math.sin(a)],
      cx = event.x,
      cy = event.y;
    stamp('討取', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.6);
    letterbox(1.3);
    punch(1.08, cx, cy);
    flash(0.45);
    addSlash(
      cx - v[0]! * Math.max(W, H) * 1.3,
      cy - v[1]! * Math.max(W, H) * 1.3,
      cx + v[0]! * Math.max(W, H) * 1.3,
      cy + v[1]! * Math.max(W, H) * 1.3,
      Math.max(3, 3 * S),
      0.7,
    );
    sfx.bossDie();
    if (event.crow) sfx.caw();
    showBossBar(false);
    inkBurst(cx, cy, a + Math.PI / 2, 30, event.height / 150);
    bossStain({ x: cx, y: event.groundY, h: event.height, fog: event.fog, alpha: event.alpha });
  });
  return () => {
    offVictory();
    offCut();
  };
}
