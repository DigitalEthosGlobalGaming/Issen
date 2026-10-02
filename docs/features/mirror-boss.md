# Mirror boss

Version 1.32.0 changes Kyōgetsu the Mirror to a consistent opposite-direction
duel. He never uses attack feints. Parry the sword glint as usual; during the
counter opening, swipe opposite to the displayed arrow and blade. Neither cue
flips or quivers. This rule applies to every cut in the chain, whose required
direction changes after each block. Finishing the chain damages the boss.

A wrong cut ends the opening and breaks the combo; an expired opening lets him
recover. Both count as mistakes for a clean duel. A missed or early parry retains
the ordinary boss damage rules. Equipment modifiers still apply.

`src/game/encounters/boss-openings.ts` owns the displayed direction separately
from the required cut. `boss-update.ts` uses it for the blade pose and prevents
Mirror attack feints, including for restored encounters. `src/game.ts` uses the
same direction for the arrow and connects counter input, hints and chains.
Other bosses retain their normal directions and feints. Existing `issen.*` saves
remain compatible; legacy timed-flip fields are no longer used.
