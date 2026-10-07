import { recordSecretEvent } from '../../game/progression/secret-events.ts';
import { activeNow } from '../../platform/activity.ts';
import type { createLifecycle } from '../../platform/lifecycle.ts';
import type { createAudio } from '../../audio/audio.ts';
import type { Statistics } from '../../game/progression/statistics.ts';
import type { RunState } from '../../game/run-state.ts';
import type { Direction } from '../../shared/directions.ts';
import type { ItemCategory } from '../../game/content/items.ts';

export interface SecretViews {
 readonly G: Readonly<Pick<RunState, 'state' | 'panel'>>;
 readonly ST: Statistics;
 readonly UNL: ReadonlySet<string>;
 readonly audioInit: () => void;
 readonly tn: ReturnType<typeof createAudio>['tone'];
 readonly sfx: Pick<ReturnType<typeof createAudio>['cues'], 'caw' | 'perfect'>;
 readonly flash: (amount: number, colour?: string) => void;
 readonly saveStats: () => void;
 readonly checkUnlocks: () => void;
 readonly toast: (item: { k: string; msg?: string; n?: string; type?: ItemCategory }) => void;
}

/** Title input owns its gesture/sequence state; progression remains behind explicit ports. */
export function createTitleSecrets(readViews: () => SecretViews) {
  const KONAMI = 'up,up,down,down,left,right,left,right';
  let kseq: Direction[] = [];
  let tapN = 0,
    tapLast = 0;
  function titleTap() {
    const { G, ST, UNL, audioInit, tn, sfx, flash, saveStats, checkUnlocks, toast } = readViews();
    if (G.state !== 'title' || G.panel) return;
    const now = activeNow();
    tapN = now - tapLast < 1500 ? tapN + 1 : 1;
    tapLast = now;
    audioInit();
    if (tapN < 20) {
      if (tapN >= 5) tn({ f0: 520 + (tapN - 5) * 55, dur: 0.07, g: 0.05 });
      return;
    }
    const completedTaps = tapN;
    tapN = 0;
    sfx.caw();
    flash(0.3, '230,220,190');
    if (recordSecretEvent(ST, { kind: 'titleTaps', count: completedTaps })) {
      saveStats();
      checkUnlocks();
    }
    toast({
      k: '案山子',
      msg: UNL.has('scarecrow')
        ? 'The Scarecrow is already yours'
        : 'Secret found. End a run to claim Scarecrow.',
    });
  }
  function konamiInput(d: Direction) {
    const { G, ST, UNL, audioInit, tn, sfx, flash, saveStats, checkUnlocks, toast } = readViews();
    tapN = 0;
    if (G.state !== 'title' || G.panel) return;
    kseq.push(d);
    if (kseq.length > 8) kseq.shift();
    {
      const K = KONAMI.split(',');
      let m = 0;
      for (let n = Math.min(kseq.length, 8); n > 0; n--) {
        if (kseq.slice(-n).join() === K.slice(0, n).join()) {
          m = n;
          break;
        }
      }
      if (m > 0 && m < 8) {
        audioInit();
        tn({ f0: 900 + m * 120, dur: 0.08, g: 0.05 });
      }
    }
    if (kseq.join() === KONAMI) {
      kseq = [];
      audioInit();
      sfx.perfect();
      flash(0.4, '150,200,255');
      if (recordSecretEvent(ST, { kind: 'konami' })) {
        saveStats();
        checkUnlocks();
      }
      toast({
        k: '光剣',
        msg: UNL.has('koken')
          ? 'Kōken is already yours'
          : 'Secret found. End a run to claim Kōken.',
      });
    }
  }
  function bindTitleGestures(el: HTMLElement, lifecycle: ReturnType<typeof createLifecycle>, logoTap: () => void) {
    let sx = 0,
      sy = 0,
      id: number | null = null,
      done = false,
      logoTarget = false;
    lifecycle.listen(el, 'pointerdown', (e) => {
      if (e.target instanceof Element && e.target.closest('button, a')) return;
      if (id !== null) return;
      id = e.pointerId;
      logoTarget = e.target instanceof Element && !!e.target.closest('.t-k, .t-wrap');
      done = false;
      sx = e.clientX;
      sy = e.clientY;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* Synthetic events and unavailable capture retain in-element handling. */
      }
    });
    const fire = (e: PointerEvent) => {
      if (e.pointerId !== id || done) return;
      const dx = e.clientX - sx,
        dy = e.clientY - sy;
      if (dx * dx + dy * dy < 900) return;
      done = true;
      konamiInput(
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
      );
    };
    lifecycle.listen(el, 'pointermove', fire);
    lifecycle.listen(el, 'pointerup', (e) => {
      if (e.pointerId !== id) return;
      fire(e);
      if (e.pointerId === id && !done) {
        if (logoTarget) logoTap();
        else titleTap();
      }
      id = null;
    });
    lifecycle.listen(el, 'pointercancel', (e) => {
      if (e.pointerId === id) id = null;
    });
    lifecycle.listen(el, 'lostpointercapture', (e) => {
      if (e.pointerId === id) id = null;
    });
  }

 return { titleTap, konamiInput, bindTitleGestures };
}
