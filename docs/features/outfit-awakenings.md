# Outfit awakening content

All 20 outfits have an awakening in `src/game/content/robe-awakenings.ts`.
Requirements count only eligible progress while wearing that outfit after
Awakening Access is owned. Counters are independent of blade progress. Lifetime
kill/perfect/duel requirements accumulate; wave and combo requirements are maxima.
The base robe must be owned before its challenge is displayed, including secrets.

| Outfit | Requirement | Awakened benefit | Tradeoff | Visual identity |
| --- | --- | --- | --- | --- |
| Sumi | 120 kills | 15% more attacker spacing | Score ×0.9 | Silver ink afterimage |
| Ash | Wave 9 | Attacks 15% slower | Parry window −15% | Warm ash glow |
| Akabane | Combo 60 | ×5 combo cap; one combo mistake forgiven/wave | Attacks 12% faster | Red petals |
| Wanderer | 6 duels | Feint chance −20 points; standoff window +20% | Boss health +2 | Straw-gold glow |
| Shiro | 60 perfects | Restore a life every 15 clean cuts | Attacks 15% faster | Ivory frost |
| Oni mask | 8 duels | Parry window +35% | Openings −20% | Vermilion dark aura |
| Tengu mask | 100 perfects | Perfect arc +40%; swipe distance ×0.8 | Score ×0.8 | Pale blue afterimage |
| Monk hood | Wave 15 | 5 Shrine choices; guaranteed available rare | Score ×0.75 | Saffron glow |
| Straw cape | Wave 22 | Hazards −75%; attacker spacing +10% | Attacks 10% faster | Rain-green frost |
| Kabuto | 300 kills | 2 run wards forgive mistakes | Score ×0.7 | Aged-brass glow |
| Jinbaori | 10 duels | +2 starting lives; parry window +10% | Score ×0.65 | Commander-gold glow |
| Shinobi | Combo 70 | Double standoffs/reward; half swipe distance | −1 starting life | Indigo afterimage |
| Kitsune mask | 80 perfects | Reveal feints; feints cannot cost a life | Attacks 15% faster | Fox-amber petals |
| Noh mask | 7 duels | Guaranteed available rare; openings +20% | Score ×0.8 | Porcelain glow |
| Yoroi | Wave 24 | +2 starting lives; 1 run ward | Attacks 15% faster; score ×0.75 | Steel-blue sparks |
| Komusō | 70 perfects | Perfect arc +30%; hidden-arrow score ×1.4 | Parry window −15% | Reed afterimage |
| Rags | 240 kills | Restore a life every 4 waves; lost lives add ×0.25 score | −1 starting life | Copper-patch glow |
| Kabuki lion | Combo 90 | 2 combo mistakes forgiven/wave; growing 10-combo bonus | Attacks 12% faster | Rose petals |
| Scarecrow | 180 kills | Attacks 25% slower; feint chance −20 points | Score ×0.4 | Harvest petals |
| Tanuki | 5 duels | Feints cannot cost lives; reflect one wrong cut/wave | Score ×0.6 | Moss-dark aura |

Awakened outfit modifiers replace base outfit modifiers; blade and robe activation
are independent, and their sources then compose through `computeModifiers`.
Normal-life increases and recovery respect the five-life cap. Feint probability
offsets are percentage points, not multipliers. Duration modifiers below one make
attacks faster. Shrine rare guarantees require a remaining eligible rare blessing.

Before access, the Armoury hides challenges, badges and awakening details. After
access it shows requirements; completion shows activation instructions only.
Select/equip a tile and tap it again to activate. Active powers replace base stats
in yellow with an explicit **Awakened active** label. Deactivation restores base
stats and hides awakened powers. Upgrades-off setups preserve selected forms but
suppress their powers, show base stats and explain the suppression.

`st.c` supplies a comma-separated RGB fabric accent, and `aura` supplies the
matching colour/effect for the isolated preview and live renderer. Adding an
outfit requires a catalog entry, progress/unlock support, and renderer integration;
changing a description does not implement a mechanic.
