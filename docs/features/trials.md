# Trials

Trials is a separate title-menu mode, unlocked by reaching **wave 10 in Ronin
Waves** (after the third duel). The existing `issen.stats.roninWave` record grants
access to established players too. Boss Rush and Endless do not advance that
record. The title button appears only after that milestone is saved.
Testing tools can set or clear that milestone in the isolated test profile with
the **Trials unlocked** checkbox; ordinary player saves are unaffected.

## Encounters and rewards

| Trial | Completion condition | Cosmetic reward |
| --- | --- | --- |
| Unbroken | Cut 20 ordered enemies, no mistakes | Still ripples kill effect |
| True Edge | Cut 12 enemies, at least 10 perfect cuts, no mistakes | Platinum seal |
| Still Water | Cut 16 enemies who all feint, no mistakes | Violet dusk film |
| Read the Blade | Cut 16 enemies without arrows, including feints, no mistakes | Comet trail kill effect |
| Two Glints | Defeat Ronin Twin Fang without taking a hit | Burnished copper seal |
| Three Masters | Defeat Ronin Kagemaru, Twin Fang and Mirror without hits, wrong counters or expired openings | Pale dawn film |
| Golden Sovereign | Defeat 1,000 enemies in one wave without a hit | Imperial gold film |
| Broken Reality | 1,000 perfect cuts in one wave; an ordinary cut or hit ends the attempt | Broken signal film |

All eight trials are available immediately after access. Each uses Tamahagane,
Sumi, no charm/companion/crest, no Temple or awakened powers, no knives, no shrine
and no recovery. A hit ends the attempt. Selected kill effects, seal colours and
film looks remain visible. Wave timings and enemy counts are fixed by the trial
catalog. Duel timings use the existing Ronin boss rules. Combat uses a fresh
seeded random stream on each attempt, separate from rendering and effects;
identical input timing reproduces encounter choices. Visual weather hazards are
neutralized for trial combat. A trial ends on the first hit or missed opening
required by its objective. True Edge also ends as soon as the remaining enemies
cannot bring the perfect-cut count to 10; it allows at most two ordinary cuts.

The HUD shows the objective and progress. Failure or ending from pause opens a
dedicated result view with the trial name, objective, failure reason, Retry and
Back to title. Returning to the title clears that result. Completion returns to
the Trials list with the reward and Retry button. A failed
perfect-cut target grants nothing. Replays never duplicate rewards. All rewards
are cosmetic and can be equipped in the Armoury in other modes.

## Ownership and persistence

- `src/game/content/trials.ts` owns presets and cosmetic reward metadata.
- `src/game/progression/trials.ts` owns access, validation, objective checks and
  idempotent completion/reward grants.
- `src/ui/screens/trials.*` owns the trial list, requirements, result and retry UI.
- `src/game.ts` connects the catalog to ordinary combat simulation and handles
  transitions. Trial attempts use disposable statistics and equipment objects;
  profile statistics and equipment are restored on exit. Combat does not write
  ordinary stats, Embers, unlock challenges or Awakening progress during trials.
  Testing tools are unavailable during an attempt.
- `issen.trials` stores `{ completed: string[] }`, validated against known IDs.
  Rewards also use ordinary `issen.unlocks` ownership. Completion is saved first;
  loading reconciles rewards from completion if a previous unlock write failed.
  An abandoned/reloaded attempt grants no completion.
- Existing `issen.*` records retain their meaning. The storage adapter applies
  the existing `issen.testing.*` namespace to Trials too.

## Verification

`tests/unit/trials.test.mjs` covers access, malformed completion data, full
objectives, early impossible-target failure and idempotent reward reconciliation. Existing effect tests exercise
the new kill effects' finite particles, expiry and preview isolation.
`tests/browser/trials.spec.ts` covers the hidden title entry before access, portrait/landscape overflow,
live failure/retry/quit, all eight successful combat sequences, insufficient
early impossible perfect-cut failure, seeded replay, reload persistence, equipping all eight cosmetic
rewards and profile isolation. The renderer test iterates the film catalog,
including both Trials films, to check canvas isolation and context restoration.
Successful encounter tests instrument the served module only in the test browser
to advance simulation and supply inputs; no testing hooks ship in the application.
These checks do not establish human difficulty balance or physical touch-device
usability.

Imperial gold uses gold colour grading and soft golden light. Broken signal uses
cyan/magenta colour fractures, displaced image strips, scanlines and pixel noise.
Both apply to gameplay and Armoury previews. Broken signal gently warps the scene
and shifts its torn strips using the renderer's animation time, without flashing.
Film rendering accepts an explicit time in seconds, keeping preview animation
independent of live combat. Both endurance trials have
no feints, fixed attack timings and no intermediate duels or shrines.
