# Trials

Trials is a separate title-menu mode, unlocked by reaching **wave 10 in Ronin
Waves** (after the third duel). The existing `issen.stats.roninWave` record grants
access to established players too. Boss Rush and Endless do not advance that
record. Locked players can inspect the challenges and rewards.

## Encounters and rewards

| Trial | Completion condition | Cosmetic reward |
| --- | --- | --- |
| Unbroken | Cut 20 ordered enemies, no mistakes | Still ripples kill effect |
| True Edge | Cut 12 enemies, at least 10 perfect cuts, no mistakes | Platinum seal |
| Still Water | Cut 16 enemies who all feint, no mistakes | Violet dusk film |
| Read the Blade | Cut 16 enemies without arrows, including feints, no mistakes | Comet trail kill effect |
| Two Glints | Defeat Ronin Twin Fang without taking a hit | Burnished copper seal |
| Three Masters | Defeat Ronin Kagemaru, Twin Fang and Mirror without hits, wrong counters or expired openings | Pale dawn film |

All six trials are available immediately after access. Each uses Tamahagane,
Sumi, no charm/companion/crest, no Temple or awakened powers, no knives, no shrine
and no recovery. A hit ends the attempt. Selected kill effects, seal colours and
film looks remain visible. Wave timings and enemy counts are fixed by the trial
catalog. Duel timings use the existing Ronin boss rules. Combat uses a fresh
seeded random stream on each attempt, separate from rendering and effects;
identical input timing reproduces encounter choices. Visual weather hazards are
neutralized for trial combat.

The HUD shows the objective and progress. Completion, failure or ending from
pause returns to the Trials panel with the result and a Retry button. A failed
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
objectives and idempotent reward reconciliation. Existing effect tests exercise
the new kill effects' finite particles, expiry and preview isolation.
`tests/browser/trials.spec.ts` covers the locked menu, portrait/landscape overflow,
live failure/retry/quit, all six successful combat sequences, insufficient
perfect cuts, seeded replay, reload persistence, equipping all six cosmetic
rewards and profile isolation. The renderer test iterates the film catalog,
including both Trials films, to check canvas isolation and context restoration.
Successful encounter tests instrument the served module only in the test browser
to advance simulation and supply inputs; no testing hooks ship in the application.
These checks do not establish human difficulty balance or physical touch-device
usability.
