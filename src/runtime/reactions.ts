import { createRuntimeUIBase } from '../runtime/ui-base.ts';

import { createRuntimePresentation } from '../runtime/presentation.ts';
import { createRuntimeFoundation } from '../runtime/foundation.ts';

import { bindStandoffFeedback } from '../presentation/standoff-feedback.ts';

import { bindBossFeedback } from '../presentation/boss-feedback.ts';
import { bindDamageFeedback } from '../presentation/damage-feedback.ts';
import { bindDuelFeedback } from '../presentation/duel-feedback.ts';
import { bindEncounterProgression } from '../game/progression/encounter-listeners.ts';

import { bindCombatScoreFeedback } from '../presentation/combat-score.ts';
import { bindKillFeedback } from '../presentation/kill.ts';
import { bindCombatProgression } from '../game/progression/combat-listeners.ts';

import type { GameContext } from '../game/session/context.ts';
import type { PresentationContext } from '../presentation/context.ts';

import { REST_POSE as PREST } from '../game/player/player.ts';

import { BOSS_SHADOW_DURATION } from '../rendering/figures/death.ts';

/** Install synchronous progression and cosmetic listeners in registration order. */
export function bindRuntimeReactions(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  events: GameContext<PresentationContext>['events'],
  rules: Omit<ReturnType<Parameters<typeof bindCombatProgression>[1]>, 'ST'> & {
    readKillViews: Parameters<typeof bindKillFeedback>[1];
  },
) {
  foundation.lifecycle.add(
    bindCombatProgression(events, () => ({
      ST: foundation.profile.profileFoundation.ST,
      bst: rules.bst,
      challenge: rules.challenge,
      checkUnlocks: rules.checkUnlocks,
    })),
  );
  foundation.lifecycle.add(
    bindEncounterProgression(events, () => ({
      ST: foundation.profile.profileFoundation.ST,
      bst: rules.bst,
      challenge: rules.challenge,
    })),
  );
  foundation.lifecycle.add(
    bindBossFeedback(events, () => ({
      W: foundation.view.geometry.W,
      H: foundation.view.geometry.H,
      S: foundation.view.geometry.S,
      addSlash: presentation.addSlash,
      killFx: presentation.killFx,
      scraps: presentation.scraps,
      ring: presentation.ring,
      flash: presentation.flash,
      sfx: foundation.browser.sfx,
      combatHaptics: foundation.browser.combatHaptics,
      stamp: presentation.stamp,
      letterbox: presentation.letterbox,
      punch: presentation.punch,
      inkBurst: presentation.inkBurst,
      shake: (amount) => {
        foundation.view.presentationState.shake = Math.max(
          foundation.view.presentationState.shake,
          amount,
        );
      },
      showBossBar: (shown) => {
        foundation.browser.$('bossbar').classList.toggle('on', shown);
      },
      bossStain: (p) => {
        foundation.view.presentationState.fx.stains.push({
          x: p.x,
          y: p.y + p.h * 0.01,
          rx: p.h * 0.3,
          t: 0,
          life: BOSS_SHADOW_DURATION,
        });
      },
    })),
  );
  foundation.lifecycle.add(
    bindStandoffFeedback(events, () => ({
      W: foundation.view.geometry.W,
      H: foundation.view.geometry.H,
      S: foundation.view.geometry.S,
      addSlash: presentation.addSlash,
      killFx: presentation.killFx,
      scraps: presentation.scraps,
      ring: presentation.ring,
      stamp: presentation.stamp,
      punch: presentation.punch,
      flash: presentation.flash,
      sfx: foundation.browser.sfx,
      combatHaptics: foundation.browser.combatHaptics,
    })),
  );
  foundation.lifecycle.add(
    bindDuelFeedback(events, () => ({
      S: foundation.view.geometry.S,
      sparks: presentation.sparks,
      ring: presentation.ring,
      flash: presentation.flash,
      sfx: foundation.browser.sfx,
      combatHaptics: foundation.browser.combatHaptics,
      letterbox: presentation.letterbox,
      buzz: foundation.browser.buzz,
      shake: (amount) => {
        foundation.view.presentationState.shake = Math.max(
          foundation.view.presentationState.shake,
          amount,
        );
      },
    })),
  );
  foundation.lifecycle.add(
    bindDamageFeedback(events, () => ({
      W: foundation.view.geometry.W,
      H: foundation.view.geometry.H,
      S: foundation.view.geometry.S,
      addSlash: presentation.addSlash,
      inkBurst: presentation.inkBurst,
      scraps: presentation.scraps,
      flash: presentation.flash,
      pop: presentation.pop,
      sfx: foundation.browser.sfx,
      combatHaptics: foundation.browser.combatHaptics,
      renderLives: ui.renderLives,
      setScore: ui.setScore,
      hud: ui.hud,
      letterbox: presentation.letterbox,
      inkPulse: (value) => {
        foundation.view.presentationState.inkPulse = value;
      },
      clearLetterbox: () => {
        foundation.view.presentationState.lbT = 0;
      },
      resetPlayer: () => {
        foundation.run.P.fall = 0;
        foundation.run.P.pose = { ...PREST };
      },
      banner: ui.banner,
      stamp: presentation.stamp,
      clearHints: ui.clearHints,
      hideBossBar: () => {
        foundation.browser.$('bossbar').classList.remove('on');
      },
      shake: (amount) => {
        foundation.view.presentationState.shake = Math.max(
          foundation.view.presentationState.shake,
          amount,
        );
      },
    })),
  );
  foundation.lifecycle.add(bindKillFeedback(events, rules.readKillViews));
  foundation.lifecycle.add(
    bindCombatScoreFeedback(events, () => ({
      setScore: ui.setScore,
      pop: presentation.pop,
      W: foundation.view.geometry.W,
      H: foundation.view.geometry.H,
    })),
  );
}
