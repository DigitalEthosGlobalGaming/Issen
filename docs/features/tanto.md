# Tanto defensive strikes

Introduced in 1.42.0, Tanto is a three-rank Temple upgrade costing 175, 300 and
450 Embers. Each rank grants one automatic defensive strike per run. It follows
the standard Temple eligibility: Normal Waves, arrows On, Normal lives and
upgrades On. Trials and Daily presets receive no Tanto charges.

Before an enemy-caused hit consumes a ward or life, a remaining charge kills
an ordinary attacker, finishes a standoff, or interrupts a boss and removes one
boss health. Boss chain requirements do not block this defensive strike. An
assisted duel cannot earn a clean-duel reward. Automatic cuts award normal
kill/duel progress but no perfect-cut or speed-timing bonus. Environmental hits
without an opponent do not consume a charge. Charges never refill within a run.

The runtime connects the pure spending rule in `src/game/combat/tanto.ts` to
existing kill and boss lifecycle handlers. Remaining strikes appear in the HUD
and setup summary. Checkpoints preserve spent charges, including a boss victory
transition. Older checkpoints and Temple saves default missing Tanto values to
zero without changing the `issen.*` save keys.
