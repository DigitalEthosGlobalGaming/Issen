# Implemented architecture

Issen is a vanilla DOM/Canvas application compiled with TypeScript 7 and served or
bundled by Vite. All application TypeScript under `src/` is included in strict
type checking; Vite's transpilation alone is not the build gate.

## Startup and ownership

Root `index.html` loads `src/main.ts`. It imports the ordered styles, mounts the
shell and screen fragments, then calls `startGame()` in `src/game.ts`.
The returned disposer stops the runtime. `main.ts` removes the mounted root and
registers disposal with Vite HMR before a replacement instance starts.

`game.ts` remains the composition and orchestration layer. Its private closure
owns the player profile, current run, scene dimensions, camera effects and service
instances. It connects feature callbacks to audio, persistence, effects and UI.
It still contains encounter transitions, kill/damage presentation, title secrets,
main scene layer order and post-processing orchestration. These are not separate
session/renderer services yet; do not assume the proposed migration tree describes
implemented files.

## Where changes belong

| Concern                                                                 | Maintained location                                                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Run fields and restart initialization                                   | `src/game/run-state.ts`                                                |
| Enemy spawn, targeting, damage, simulation                              | `src/game/combat/`                                                     |
| Wave difficulty, boss factories/openings/updates, standoffs             | `src/game/encounters/`                                                 |
| Items, stages, cosmetics, bosses, blessings, awakenings                 | `src/game/content/`                                                    |
| Modifier composition and shrine rules                                   | `src/game/equipment/`, `src/game/shrine/`                              |
| Scoring, records, statistics, unlocks                                   | `src/game/progression/`                                                |
| Secret trigger counters and fixed-point eligibility                     | `src/game/progression/secret-events.ts`, `unlocks.ts`                  |
| Temple upgrades, tutorial status, mode milestones                       | `src/game/progression/meta.ts`                                         |
| Pending Embers and one-time end-run settlement                          | `src/game/progression/run-rewards.ts`                                  |
| First-encounter teaching state and overlay                              | `src/game/onboarding/`                                                 |
| Run-end tally/reveal and viewed Armoury gear                            | `src/ui/screens/run-results.ts`, `src/game/progression/armory-seen.ts` |
| Independent gated blade/outfit challenges                               | `src/game/progression/awakening-progress.ts`, `unlocks.ts`             |
| Outfit awakening catalog                                                | `src/game/content/robe-awakenings.ts`                                  |
| Knife target selection and charge spending                              | `src/game/combat/knife.ts`                                             |
| Tutorial practice scene and isolated canvas                             | `src/ui/screens/tutorial.ts`, `tutorial.css`                           |
| Temple and testing menu controls                                        | `src/ui/screens/template.ts`, `admin.ts`                               |
| Backgrounds, ambient grass/leaves, weather                              | `src/rendering/scene/`                                                 |
| Figure geometry, poses, player animation, projection                    | `src/rendering/figures/`                                               |
| Particle state, spawning, updates, drawing, films                       | `src/rendering/effects/`                                               |
| Isolated armory rendering                                               | `src/rendering/armory-preview.ts`                                      |
| Screen fragments and controllers                                        | `src/ui/screens/`                                                      |
| HUD/navigation, hints/toasts, share-card composition                    | `src/ui/`                                                              |
| Pointer and keyboard adapters                                           | `src/input/`                                                           |
| Synthesized cues, audio context and ambience                            | `src/audio/audio.ts`                                                   |
| Save validation, storage, sharing, haptics, lifecycle, frame scheduling | `src/platform/`                                                        |

## Boundaries that matter

- Feature functions receive explicit state and dependencies. Randomized rules
  accept a random source so tests can reproduce outcomes. State mutations and
  callbacks are synchronous; callers can observe phase changes immediately.
- Frame scheduling separates capped raw elapsed time from slowed simulation time.
  Pausing skips simulation but retains rendering. Hit-stop/slow timers retain
  their existing raw-time behavior. Resume resets the scheduler's clock. Guided
  lessons go directly to safe practice using that paused-simulation boundary.
  The first boss approaches at normal speed, then holds its parry glint.
- Main rendering, armory previews and share cards use explicit target canvases.
  Preview instances own their particle and animation state; no global canvas swap
  is used. Palette caches are instance-owned.
- `createLifecycle()` owns runtime listeners and timers. Input, setup, armory,
  notifications, audio and frame scheduling expose cleanup connected by `game.ts`.
  Sharing can outlive a view; the runtime ignores its returned message after disposal.
- Storage failure is non-fatal. `platform/saves.ts` validates profile data before
  it reaches gameplay. Existing `issen.*` keys and mode-record keys remain stable.
  Browser origin determines which saves are visible.
  Stats' confirmed profile reset routes through `clearActiveProfile`, deleting
  only the active namespace and suppressing stale writes until reload. The test
  admin wrapper cannot delete the player namespace. `bindProfileReset` owns the
  accessible confirmation modal and isolates its keyboard events from gameplay.
- `progression/meta.ts` validates the new `issen.meta` progression record. Temple
  modifiers and consumables are captured at run start and apply only to opted-in,
  arrow-guided Normal Waves runs with Normal lives. Normal starts at two lives,
  with equipment/upgrades added without a total life cap. Tutorial practice owns separate state and never
  records gameplay rewards. It is optional from the title menu; first play starts
  a normal run. The runtime persists its completion/skip callback.
- Combat accrues half-rate Embers in a run-local ledger and writes them to
  `issen.meta` only when death or explicit End run settles the run. The runtime
  then grants mode/equipment unlocks, presents an Ember tally and unlock cards,
  and finally shows the summary. The result screen animates each run's gain into
  the available balance, then hides the gain while retaining the settled balance
  and accessible total. `issen.armorySeen` stores gear detail views; old owned
  gear migrates as seen. Unviewed gear, its tab, and the Armoury entry
  use underlined labels. `issen.guidedLessons` records only successful
  first ordered cuts and boss parries. Both keys follow the active profile
  namespace and use validated defaults.
- No lives and Endless require Vitality rank 1; the Arrows choice appears after
  Blade Only unlocks. Boss Rush Shrine offers and Twin grants use a curated
  duel-relevant pool. Ambient audio fades one persistent loop on pause instead
  of restarting it.
- `progression/awakening-progress.ts` validates `issen.awakening`: blade and robe
  counters are independent and earn only after category access (rank 1 weapons,
  rank 2 outfits). Metadata schema 3 preserves old combined access as rank 2. Existing lifetime blade
  progress migrates once. Awakened sources replace their base category source;
  upgrades Off suppresses both forms without deleting ownership or progress.
- `progression/modes.ts` preserves existing record identities and adds a `-base`
  suffix for upgrades-off runs, so new base-play scores do not overwrite upgraded
  records. Normal-life setup retains its saved `'3'` identifier despite the new
  two-life baseline.
- `Figure.robeAura` is separate from blade aura. Its stateless body halo is drawn
  on the explicit figure context with inherited opacity, including preview/death
  rendering; it does not consume random or particle state.
- Testing tools use `platform/storage.ts` to route every store read/write to
  `issen.testing.*` while the session's test-profile flag is active. Switching
  profiles reloads the runtime to avoid mixing in-memory state. The admin panel
  exposes mutations only inside that isolated profile.
- HTML fragments are static Vite `?raw` imports. Mount before binding controllers.
  `styles/index.css` fixes cascade order: tokens, base, HUD, screens, armory,
  components. Keep feature-specific styling beside its feature when substantial.

## Adding a feature

Start with the owning catalog or gameplay module, its local types and a deterministic
test. Wire new outcomes into `game.ts` only where presentation or encounter flow
needs them. Add drawing to the relevant renderer with explicit inputs, not by
reaching into run globals. For a new screen, add its fragment to `ui/mount.ts`, its
screen identifier/navigation entry, and a controller only when it has behavior.

See [rendering and visual consistency](rendering.md) for the Canvas/DOM split,
scene layering and shared style patterns. See
[development and verification](../development/local-development.md) for commands
and the [migration record](typescript-migration.md) for completion evidence and coverage limits.
