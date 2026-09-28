# Feature plan 05 — clearer progression and a fairer third stage

Status: implemented in v1.3.0; Vitality total wording refined in v1.3.1. The wave targets remain candidates for human playtesting.

## Intent

Make new goals and rewards quick to read, give unlocks an audible moment, smooth
the difficulty before the third boss, and let players review blessings while
paused. Keep the existing Ronin wave 10 Trials requirement and the end-of-run
reward settlement.

## Decisions and acceptance checks

### Trials entry and copy

- Hide the **Trials** button entirely until the saved best Ronin Waves progress
  reaches wave 10. The mode reveal at run end announces it; the button appears
  when the player returns to the title. Direct start attempts remain gated.
  Existing qualifying saves show it immediately after load. A fresh profile and
  one at wave 9 see no button or empty menu gap.
- Remove the two explanatory paragraphs and locked-state message from the
  Trials screen. Show `Trials · 0/6 complete`, followed by the cards. Keep one
  brief shared rule, such as **One hit ends the trial**. Each card gets a short
  objective and a compact reward line; the result shows **Complete** or the
  concrete failed condition, with **Retry**. Preserve exact rules in the
  catalog and detailed documentation, not on every card.
- Example card: **True Edge** — **10 perfect cuts in 12. No hits.** / **Reward:
  Platinum seal**. **Two Glints** — **Defeat Twin Fang. No hits.** Do not repeat
  the fixed loadout, disabled purchases, timing numbers or normal-run reward
  policy on the menu. Keep accessible names that state each objective.

### Reward reveals and Armoury

- Make a newly unlocked gear card read like its Armoury detail: glyph, category,
  name, flavour line, then the same **+ benefit** and **− tradeoff** text where
  the item has them. Cosmetic items show their flavour line. The reveal should
  use catalog data, so it cannot drift from the Armoury when copy changes.
  Keep the existing Ember tally, mode reveals and single-settlement behavior.
- Give each newly displayed unlock card one short, gentle but audible chime.
  The sound plays when the card appears, not for the Ember tally, every animation
  frame, or a second tap on that card. It respects mute and does not pile up
  when several rewards appear. Check it after a duel and after a wave run.
- An owned Armoury item retains its unlock requirement beneath its flavour and
  stats in muted text, for example **Unlocked: Win your first duel**. Secret
  items reveal their real condition after ownership. Starting items with no
  condition show no empty line. Existing activation, perk and tradeoff text stays
  readable.

### Temple copy

- Remove the generic paragraph explaining which setup permits upgrades and the
  extra sentence saying Awakening challenges appear after purchase. The first
  Awakening description already carries that meaning.
- Shorten Vitality's catalog description to **+1 starting life per rank** and
  its displayed totals to **N starting lives**. Omit the explanation about
  equipment stacking and the phrase “before equipment bonuses.” Do not change
  the two-life baseline, rank effects, costs or eligibility.
- At rank 0, show **Next** only; no **Current** line. At later ranks show current
  and next values, and at maximum show current only. Keep the number truthful:
  rank 0's next Vitality value is **3 starting lives** (two baseline plus one
  purchased rank). Shorten other duplicated stat copy where it fits this same
  pattern, without hiding costs or prerequisites.

### Waves 7–12

The current neutral-loadout curve explains the wave 8 spike:

| Mode | Wave 6 | Wave 8 | Wave 10 |
| --- | --- | --- | --- |
| Normal | 11 enemies, 16% feints, 1.65s attack | 15, 50%, 1.39s | 19, 44%, 1.13s |
| Ronin | 15 enemies, 30% feints, 1.14s attack | 19, 60%, 0.93s | 22, 50%, 0.72s |

Wave 7 enters Cherry Blossom. Its flat 20 percentage point feint increase
combines with the rising base chance, more enemies and shorter gaps. For normal
Waves runs, ease waves 7–9 as one encounter band rather than adjusting only
wave 8: cap feints around 20%, cap packs at 13 enemies and retain at least the
wave 7 attack gap. Ronin remains harder, but cap the same band around 30%
feints and 16 enemies, with attack timing no faster than roughly 1 second.
Avoid an abrupt single-wave spike at 10: ramp enemy count, feints and pace
through waves 10–12 until the old late-wave pressure is reached. Let the
Cherry Blossom weather cue remain visual without adding its full feint bonus
before the third boss. Do not alter the boss roster or the Trials presets.

Tune those target values against playtesting, with a deterministic table test
for Normal and Ronin at waves 6–12. Check active modifiers and stage weather
so the cap applies to the base encounter without silently cancelling earned
gear effects. The intended experience is that reaching the third boss takes
skill, while the fastest and most feint-heavy waves begin afterward.

### Pause blessings

- Put a **Blessings** panel in the center of the pause screen, between the
  heading and Continue/End run. List the run's owned Shrine blessings in a
  scrollable area using their catalog glyph, name and short effect. When empty,
  show **No blessings yet**.
- The list is read-only. It updates on each pause, keeps Continue and End run
  visible in portrait and short landscape layouts, supports touch/wheel/keyboard
  scrolling, and does not scroll or trigger gameplay underneath. Resume returns
  to the same combat state; the panel adds no saved data.

## Implementation map

`src/game.ts` owns title visibility, result callbacks and pause transitions.
`src/ui/screens/trials.ts` and `trials.html` own short challenge copy.
`src/ui/screens/run-results.ts`, `game-over.ts` and `armory.ts` should share a
small catalog-to-display projection for item text. `src/audio/audio.ts` owns the
new cue. `src/ui/screens/template.ts` and `src/game/progression/meta.ts` own
Temple wording. `src/game/encounters/configuration.ts` owns the wave curve;
keep modifier composition unchanged. `src/ui/screens/pause.html` and its styles
own the blessing panel, rendered from the run's `bless` IDs and
`src/game/content/blessings.ts`.

## Verification and release

Add focused browser checks for hidden/unlocked Trials entry, compact cards,
matching unlock/Armoury copy, muted and once-per-card audio, owned condition
text, Temple rank 0/1/max copy, and a scrollable pause list with zero and many
blessings. Add deterministic wave configuration tests at the stage transition
in both modes and with representative modifiers. Check portrait and short
landscape layouts. Run strict TypeScript, unit, browser and production checks.
Implementing this feature set is a gameplay and presentation change, so bump
the minor app version and keep `package.json`, lockfile and title version aligned.
The implementation bumps the app to v1.3.0.
