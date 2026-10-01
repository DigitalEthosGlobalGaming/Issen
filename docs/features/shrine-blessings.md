# Shrine blessings added in 1.9.0

Seven blessings add encounter, resource and ward choices without changing the
saved run's seeded combat decisions. Shrine offer IDs remain fixed in checkpoints.

## Rarity progression in 1.12

Natural rare odds per ordinary choice are 8% after boss one, 12% after boss two,
18% after bosses three/four, 24% after bosses five/six and 30% from boss seven.
Equipment and Temple bonuses add percentage points; guarantees still work from
the first Shrine. Curses retain their existing 40% insertion roll from boss two,
occupying one choice. Offers remain unique and mode-filtered; an exhausted common
pool can force rare fallback. Waves and Boss Rush use the same curve with their
own boss count, and Boss Rush retains its duel-relevant pool. Existing checkpoint
offers restore unchanged; newly generated offers use the new curve.

## Blessing effects

| Blessing | Tier | Rule |
| --- | --- | --- |
| Knife Dance | Common | Only enters the pool when this run can carry a Temple Throwing Knife. Every third consecutive perfect cut returns one knife, up to capacity. Unlocking it has no announcement. |
| Stolen Tempo | Common | The first perfect cut in each wave makes the next attacker hesitate. |
| Final Flourish | Common | A perfect manual cut on the final foe stores one ward for the next wave. It expires at that wave's end and never stacks with itself. A duel between those waves does not consume it. |
| Stormcall | Rare | Every three consecutive perfect cuts charge a bolt. It kills the next attacker as they begin attacking. Automatic lightning kills cannot charge another bolt. |
| Rekindle | Rare | Once per wave, the first perfect cut after an actual combo break restores half of the lost combo, rounded down. |
| Crossroads | Rare | Choosing it immediately grants one random eligible curse. Later Shrines offer two more choices. It is unavailable if no eligible curse remains. |
| Oath of Precision | Cursed | Normal cuts do not raise combo. Five consecutive perfect cuts grant one persistent ward; only one Oath ward can be held. |

An ordinary non-perfect cut or a mistake resets the perfect-cut progress for
Knife Dance, Stormcall and Oath. Automatic kills do not count as player cuts.
Ward protection is automatic. On a hit, the once-per-wave Ward blessing is
spent first, followed by Final Flourish, Oath, then stored Paper Wards. Wards
prevent life loss but ordinarily allow a combo break. The life display gains a
blue outline and ward mark whenever protection is ready, including in No Lives
and Endless modes. Run checkpoints include the new counters and restore older
checkpoints with empty counters.
