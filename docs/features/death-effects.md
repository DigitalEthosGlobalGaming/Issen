# Scattered Armour

The `scattered-armour` cosmetic unlocks after 500 lifetime enemy kills. It sends
an enemy's existing head, torso, skirt, sleeves, forearms, hands and held weapon
apart; clothing, headwear, tint and seeded appearance remain the same as the living
figure. This effect uses the existing sprite atlases and sword renderer.

`rendering/figures/figure.ts` draws the separate pieces on its explicit target
canvas. `ink-enemy.ts` exposes the finer puppet parts; `death.ts` supplies stateless
ballistic transforms derived from figure seed and elapsed death time. No gameplay
randomness, extra image assets or per-frame offscreen captures are involved.
The ground shadow stays at the original contact position and follows the existing
raw-time fade. Pieces disappear after 1.1 simulation seconds. Reduced motion uses
the existing restrained whole-figure death pose. Bonk retains its blunt reactions.

The Armoury preview owns its own dummy, clock and effects. The effect's particle
spawner does not add generic debris over the actual flying pieces.

Verification: `tests/unit/death-presentation.test.mjs` checks motion, expiry and
style selection; `tests/browser/scattered-armour.spec.ts` compares assembled and
separating sprites for different clothing and headwear identities.
