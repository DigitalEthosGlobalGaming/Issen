import { DANG } from '../shared/directions.ts';
import { kanji } from '../shared/format.ts';
import type { EventBus, GameEvents } from '../game/events.ts';
import type { createFeedbackPresentation } from './feedback.ts';

type Position = Readonly<{ x: number; y: number; h: number; fog: number; alpha: number }>;
export type KillFeedbackViews = Pick<
  ReturnType<typeof createFeedbackPresentation>,
  'addSlash' | 'killFx' | 'scraps' | 'ring' | 'pop' | 'stamp' | 'letterbox' | 'punch' | 'flash'
> & {
  readonly S: number;
  readonly W: number;
  readonly H: number;
  readonly disarm: (position: Position) => void;
  readonly coin: (position: Position) => void;
  readonly stain: (position: Position) => void;
  readonly shake: (amount: number) => void;
  readonly combatHaptics: { play(event: 'slice'): void };
  readonly sfx: {
    coin(): void;
    bonk(): void;
    slice(): void;
    perfect(): void;
    chime(): void;
    drum(): void;
  };
  readonly renderLives: () => void;
  readonly hud: (shown: boolean) => void;
  readonly setScore: () => void;
  readonly gustLeaves: (count: number) => void;
  readonly notifications: { readonly activeHint: string | null };
  readonly hideHint: () => void;
};

/** Cut snapshots contain values; this listener cannot alter run state or combat RNG. */
export function bindKillFeedback(events: EventBus<GameEvents>, readViews: () => KillFeedbackViews) {
  const removeKill = events.on('kill', (event) => {
    const {
      S,
      W,
      H,
      addSlash,
      killFx,
      scraps,
      ring,
      pop,
      stamp,
      letterbox,
      punch,
      flash,
      disarm,
      coin,
      stain,
      shake,
      combatHaptics,
      sfx,
      renderLives,
      hud,
      setScore,
      gustLeaves,
      notifications,
      hideHint,
    } = readViews();
    const P0 = { x: event.x, y: event.y, h: event.height, fog: event.fog, alpha: event.alpha },
      cx = P0.x,
      cy = P0.y - P0.h * 0.55,
      angle = DANG[event.direction],
      v = [Math.cos(angle), Math.sin(angle)],
      len = P0.h * (event.automatic ? 0.55 : 0.95),
      sc = P0.h / 160;
    if (event.disarmed) disarm(P0);
    if (event.coin) {
      coin(P0);
      sfx.coin();
    }
    addSlash(
      cx - (v[0]! * len) / 2,
      cy - (v[1]! * len) / 2,
      cx + (v[0]! * len) / 2,
      cy + (v[1]! * len) / 2,
      Math.max(3, P0.h * 0.03),
      0.3,
    );
    killFx(cx, cy, angle + Math.PI / 2, sc);
    scraps(cx, cy, 6, sc);
    ring(cx, cy, P0.h * 0.08, P0.h * 0.55, 0.32, Math.max(1.5, 2 * S));
    stain(P0);
    if (event.bonk) sfx.bonk();
    else sfx.slice();
    combatHaptics.play('slice');
    if (event.restored) {
      renderLives();
      pop(0, 0, '正宗 +1 life');
    }
    if (event.knife) {
      hud(true);
      pop(P0.x, P0.y - P0.h * 1.4, 'Knife +1');
    }
    if (event.precisionWard) {
      renderLives();
      pop(P0.x, P0.y - P0.h * 1.4, 'Ward ready');
    }
    if (event.stormCharged) pop(P0.x, P0.y - P0.h * 1.5, 'Lightning charged');
    if (event.rekindled) {
      setScore();
      pop(P0.x, P0.y - P0.h * 1.5, `Rekindle +${event.rekindled}`);
    }
    if (event.frozen) pop(W / 2, H * 0.4, '凍', Math.max(22, 28 * S));
    if (event.perfect) {
      stamp('一閃', W / 2, H * 0.3, Math.max(52, 74 * S), true, 1.1);
      addSlash(
        cx - v[0]! * Math.max(W, H) * 1.3,
        cy - v[1]! * Math.max(W, H) * 1.3,
        cx + v[0]! * Math.max(W, H) * 1.3,
        cy + v[1]! * Math.max(W, H) * 1.3,
        Math.max(2, 2.5 * S),
        0.5,
      );
      ring(cx, cy, P0.h * 0.1, P0.h * 1.3, 0.5, Math.max(2, 3 * S));
      letterbox(0.5);
      punch(1.07, cx, cy);
      shake(10 * S);
      flash(0.32);
      sfx.perfect();
    } else {
      shake(7 * S);
      flash(0.08);
    }
    if (event.furin) {
      pop(0, 0, '風鈴');
      sfx.chime();
    }
    if (event.comboMilestone) {
      stamp(kanji(event.combo) + '連', W / 2, H * 0.2, Math.max(40, 54 * S), false, 1.2);
      gustLeaves(26);
      sfx.drum();
    }
    if (notifications.activeHint === 'swipe') hideHint();
  });
  const removeChain = events.on('cutChain', (event) => {
    const { pop, S } = readViews();
    if (event.kind === 'serpent') pop(0, 0, '大蛇', Math.max(20, 26 * S));
    else if (event.kind === 'tempest') pop(0, 0, '颯');
    else pop(event.x, event.y - event.height * 1.3, '燕', Math.max(20, 26 * S));
  });
  return () => {
    removeChain();
    removeKill();
  };
}
