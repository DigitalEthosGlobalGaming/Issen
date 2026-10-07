import type { EventBus, GameEvents } from '../game/events.ts';

export interface DamageFeedbackViews {
  readonly W: number;
  readonly H: number;
  readonly S: number;
  readonly addSlash: (x1: number, y1: number, x2: number, y2: number, width: number, life: number) => void;
  readonly inkBurst: (x: number, y: number, angle: number, count: number, scale: number) => void;
  readonly scraps: (x: number, y: number, count: number, scale: number) => void;
  readonly flash: (amount: number, colour?: string) => void;
  readonly shake: (amount: number) => void;
  readonly pop: (x: number, y: number, text: string, size?: number) => void;
  readonly sfx: { hurt(): void; death(): void; glint(): void };
  readonly combatHaptics: { play(event: 'damage'): void };
  readonly renderLives: () => void;
  readonly setScore: () => void;
  readonly hud: (shown: boolean) => void;
  readonly inkPulse: (value: number) => void;
  readonly letterbox: (duration: number) => void;
  readonly clearLetterbox: () => void;
  readonly resetPlayer: () => void;
  readonly clearHints: () => void;
  readonly hideBossBar: () => void;
  readonly banner: (glyph: string, label: string) => void;
  readonly stamp: (text: string, x: number, y: number, size: number, seal: boolean, life: number) => void;
}

/** Damage feedback receives snapshots and cosmetic capabilities, never run state or combat RNG. */
export function bindDamageFeedback(events: EventBus<GameEvents>, readViews: () => DamageFeedbackViews) {
  const offStruck = events.on('struck', event => {
    const v = readViews(), { x, y, height: h, fatal } = event;
    v.renderLives();
    if (!fatal) {
      if (event.lifeLost) v.inkPulse(1);
      v.setScore();
    }
    v.addSlash(x + h * .4, y - h * .98, x - h * .28, y - h * .35,
      Math.max(fatal ? 5 : 4, h * (fatal ? .022 : .018)), fatal ? .7 : .45);
    v.inkBurst(x + h * .05, y - h * .7, -2.2, fatal ? 40 : 16, h / 420);
    if (fatal) v.scraps(x + h * .05, y - h * .7, 10, h / 300);
    v.flash(fatal ? .45 : .35, '150,22,16');
    v.shake((fatal ? 18 : 12) * v.S);
    if (fatal) {
      v.letterbox(2.5);
      v.sfx.death();
    } else v.sfx.hurt();
    v.combatHaptics.play('damage');
    if (fatal) {
      v.clearHints();
      v.hideBossBar();
    } else v.pop(v.W / 2, v.H * .45, event.label, Math.max(20, 24 * v.S));
  });
  const offSaved = events.on('companionSaved', event => {
    const v = readViews();
    v.pop(event.x, event.y, event.kind === 'tanto' ? 'Tanto' : '狐火');
    if (event.kind === 'tanto') v.hud(true);
    else {
      v.flash(.25, '150,200,255');
      v.sfx.glint();
    }
  });
  const offRevived = events.on('revived', event => {
    const v = readViews(), phoenix = event.kind === 'phoenix';
    v.clearLetterbox();
    v.resetPlayer();
    v.renderLives();
    v.setScore();
    v.hud(true);
    v.inkPulse(0);
    if (event.kind === 'support') v.banner('起', 'Second Wind');
    else if (phoenix) v.banner('鳳凰', 'Rise from the ashes');
    else v.banner('達磨', 'Seven times down, eight times up');
    v.stamp(phoenix ? '鳳' : '起', 0, 0, Math.max(60, 86 * v.S), true, 1.6);
    v.flash(.5, '255,240,220');
  });
  return () => { offRevived(); offSaved(); offStruck(); };
}
