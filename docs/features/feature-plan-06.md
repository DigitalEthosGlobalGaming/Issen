# Feature plan 06 — Steel's third form, seeded runs and checkpoints

Status: implemented in v1.7.0; startup recovery, blade lightning and adaptive cosmetic density added in v1.8.0.

## Intent

Give the starting Steel blade a long-term third form, make each ordinary run's gameplay randomness reproducible from its seed, and let players resume after leaving or a crash at the latest safe encounter boundary. A fatal loss must be recorded immediately.

## Decisions and acceptance checks

### Steel's third Awakening

- Add a third, Steel-only form after **Steel awakened** (`steel+`). The existing Awakening Access Temple rank 1 is required. Rank 2 remains the outfit challenge purchase and is not a prerequisite. Unlock `steel++` when the independent Steel blade challenge reaches **3,000 eligible kills** and `steel+` is owned. This is a cumulative total after Awakening Access was purchased; kills before that purchase, Zen practice and Trials do not count. The player need not make another 3,000 kills after obtaining `steel+`.
- In the Armoury, show base Steel, Steel awakened and the third form as exclusive selections. Keep the saved `steel+` ownership and old `bladeSp` selection working. A new, validated equipment selection represents the third form; other blades and outfits retain their current controls. Upgrades Off suppresses its power and visuals for that run without deleting ownership or challenge progress. The run captures the selected form at start so changing an Armoury selection cannot alter a live or resumed run.
- The third form accepts either left or right for a horizontal target, and either up or down for a vertical target. Apply this to ordinary cuts, ordered waves, standoffs and boss opening sequences; an axis mismatch still has the existing consequence. Keep actual swipe direction for swing animation, scoring and input feedback. This rule belongs in gameplay targeting/validation, not pointer or keyboard input, so both inputs behave alike. Guided lessons and Trials keep their prescribed rules.
- Give this form a distinct glowing blade with branching blue-white lightning travelling down its length and lightweight drifting sparks, visible in gameplay and its isolated Armoury preview. Use the existing explicit-canvas figure/effects paths. The glow and sparks stop when the form is inactive or upgrades are off, and preview particle state never changes live gameplay or its random sequence. Keep reduced motion and low-end performance in mind: bound particle counts and avoid a particle spawn on every frame at high rates.
- The third form inherits Steel awakened's `Score ×1.15` benefit and `Enemies strike 5% faster` tradeoff, then adds axis-matched cuts. It is one complete form rather than two stacked awakened modifier sources. The Armoury and unlock reveal describe the full effect.

### Seeded ordinary runs

- Generate and store one random 32-bit seed when a new ordinary run begins. Show the seed in pause/results and on the resume prompt so it can be recorded. New Run generates a fresh seed; Continue never does. Trial presets retain their existing fixed seeds and isolated progress.
- Route **gameplay-affecting** rolls through a restorable seeded random stream: starting fortune, stage events, enemy directions/feints/selection, encounter timing, standoffs, boss patterns and Shrine offers. Save the generator state at each checkpoint. Keep rendering, ambient weather, camera shake, cosmetic particles and isolated previews on separate random streams so frame rate, resize, pause and preview cannot change combat outcomes. A fresh run with the same seed, setup, equipment and player actions should produce the same gameplay decisions.
- Adjust cosmetic effect density from sustained frame timing, aiming for a 60 fps render budget. Scale leaves, gusts, weather and hit effects down under load and restore them gradually when rendering recovers; this must not alter combat random state or encounter rules.
- Define a stable generator algorithm and stream version in the save format. Do not silently change old saved runs when the algorithm changes; either support their version through resume or fail safely with a clear recovery path. Validate imported values and provide a non-crypto fallback if `crypto.getRandomValues` is unavailable; randomness is for reproducibility, not a security guarantee.

### Run checkpoints and loss recording

- Write a checkpoint after the complete state for each new wave, boss duel or standoff has been prepared, before the player can act. At a Shrine, save the generated offer IDs **before** showing the choice; resuming restores those same offers. After a blessing choice, apply it once, then save the next encounter checkpoint. Include the run seed and generator state, setup/loadout and upgrades snapshot, phase, wave/boss/stage state, score, lives, combo, blessings, consumables, pending Embers and other run-owned counters needed to restart that boundary. Rebuild transient canvases, audio, effects and UI from validated data instead of serializing them.
- On reload, restore a valid active checkpoint behind the pause screen. **Continue** starts at that boundary with the exact saved setup, modifiers and offers. A missing or malformed checkpoint must leave the saved profile intact and allow a fresh run. Saving failures remain non-fatal; tell the player when the run could not be made resumable.
- When damage becomes fatal, synchronously persist a terminal **lost** state before the death animation or delayed results screen. On reload, a lost run cannot Continue. Finish results, records, unlocks and pending Ember settlement at most once from that terminal state, including after a crash during results. Explicit **End run** similarly records a terminal ended state and settles once. Do not keep an active checkpoint after finalization. A normal pause, tab close or app exit leaves the last checkpoint available.
- Round replay must not duplicate profile rewards. Keep combat-earned profile statistics, challenge kills, records, unlocks and pending Embers consistent with the checkpoint boundary: commit only completed boundary progress or attach a run/checkpoint identity to idempotent writes. A resumed encounter must neither count prior attempts twice nor grant the same reward twice. Preserve all existing `issen.*` save keys and migrate old `issen.equip` and `issen.awakening` values; the new run checkpoint uses a separate validated key in the active profile namespace. Profile reset and testing-profile isolation include that key. Trials/tutorial do not create ordinary resumable checkpoints.
- Checkpoints deter casual restarts, but local browser storage can be edited or deleted. Describe this as crash recovery with prompt loss recording, not cheat-proof enforcement.

## Implementation map

- `src/game/content/awakenings.ts`, `src/game/progression/unlocks.ts` and `awakening-progress.ts`: define the Steel third form and dependent unlock without changing existing IDs or kill history.
- `src/platform/saves.ts`, `src/game/equipment/modifiers.ts`, `src/ui/screens/armory.ts`, setup summary, test-profile admin controls and `src/game.ts`: validate the exclusive form selection and apply its complete modifiers for the captured run loadout.
- `src/game/combat/targeting.ts`, boss opening and standoff validation: share a small direction-match rule with an axis-enabled option. `src/rendering/figures/` and `src/rendering/effects/`: distinct glow and preview-safe sparks.
- `src/shared/random.ts`: restorable generator and separate gameplay/cosmetic streams. `src/game/run-state.ts` and a new `src/platform/` checkpoint module: explicit serializable checkpoint schema, validation and migration. `src/game.ts` owns capture, restoration and transition ordering; `src/game/progression/run-rewards.ts` and progression writers own idempotent settlement/commit behavior. UI screens own Continue and seed display.
- Update architecture, local development and feature documentation where save behavior, controls or ownership changes.

## Verification and release

- Unit tests: third-form prerequisites and cumulative kill threshold; legacy equipment/save migration; all four directions in normal, ordered, boss and standoff cases; deterministic seeded rolls; generator state restore; checkpoint validation and terminal-state idempotence.
- Browser tests: earn and select each Steel form, preview and upgrades-off rendering, same-seed run equivalence, reload at a wave/boss/standoff/Shrine, unchanged Shrine offers, Continue after close, and no Continue after fatal loss or End run. Verify no duplicate kills, Embers, records or unlocks across repeated reloads. Test the isolated testing profile and a malformed checkpoint. Check portrait and landscape UI.
- During implementation run strict TypeScript and focused tests for changed modules. Because run transitions, persistence and random selection are shared runtime behavior, run the full unit/browser suites and `test:production` before release. `test:production` already builds and type-checks.
- The app version is **1.8.0** in `package.json`, `package-lock.json` and the title screen.
