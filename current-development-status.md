# Rendering, assets and runtime refactor in progress

Complete all three workstreams in `main-goal.md` strictly in order, then Part 4
verification/report and one develop push. No profiles, benchmarks, store builds,
real-save changes or modifications of `codex/lit-rendering-only`.

Restore point: immutable pushed `pre-refactor` at `ad353b3`. Work is directly on
develop, unpushed. Version **1.66.8**, with `Smaller download` release notes.

## W1 complete; W2 ownership and composition reduction in progress


Latest checkpoint: phased profile loading/reconciliation and initial
persistence are physically owned by game/progression/profile-state.ts. Foundation,
progression and equipment stages keep original save keys, read/write order and
base profile identities. saveMeta resolves current statistics through an explicit
provider, preserving disposable daily/trial and checkpoint-replaced statistics.
Root keeps run/session variables and collection sync eligibility.
`npm run typecheck`, `npm test`: strict types and all 362 units pass
(profile-state-typecheck.log, profile-state-unit.log). The added actual owner test
checks replaced statistics, original identity and failed metadata persistence.
`npx playwright test tests/browser/save-transfer.spec.ts tests/browser/trials.spec.ts tests/browser/daily.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 10 pass in 1.4m on the restarted run (profile-state-browser-retry.log;
terminal confirmed). The earlier stopped run exposed the separately fixed trial
hook import; no assertions or timeouts were loosened.
Next: larger presentation/UI/session binding groups, remaining event reactions,
actual scenario/test API migration and complete root reduction. Audit newly stale
imports separately and retain both known root hooks until explicitly migrated.
The missing-wave broad diagnostic still lacks a natural baseline reproduction.
W2/W3/Part 4 remain incomplete. Continue without review; no early develop push.

Previous checkpoint correction:  restore bossShownDirection for the unchanged
trial browser hook. Import deletion 47beda8 removed that test-only root binding;
the profile verification caught ReferenceError before trial hook initialization.
The stale failed run was stopped. A restarted run with the import restored passes
all 10 save-transfer/daily/trial cases in 1.4m (profile-state-browser-retry.log),
with unchanged assertions/timeouts. Strict types and 362 units pass alongside
the pending profile ownership move. An exhaustive removed-name browser scan found
only this and already-retained BLESS_BY as root hook dependencies; other matches
import their modules directly in browser evaluations.
The profile-state.ts move and its unit are still uncommitted and must be committed
as the next green checkpoint. W2/W3/Part 4 remain incomplete and unpushed.

Previous checkpoint:  separately deleted 70 unused named root imports left by
completed moves. Strict types and all 361 units pass (root-import-cleanup-typecheck.log,
root-import-cleanup-unit.log). Nine startup/readiness browser checks pass in 22.3s
(root-import-cleanup-browser.log), and three blessing cases pass in 23.7s
(root-import-cleanup-blessings.log), both using the rendering-v2 config and
--trace retain-on-failure; terminal results confirmed.
The initial symbol audit missed four shorthand value references; strict checking
caught them, the uncommitted cleanup was restored and the audit corrected.
BLESS_BY is retained for the existing new-blessings browser hook until explicit
test API migration. No gameplay/runtime statements changed.
Next: profile loading/persistence and larger presentation/UI/session bindings.
The composition root remains about 2,600 lines. W2 and subsequent W3/Part 4
are NOT complete. Continue autonomously; no develop push before final verification.

Previous checkpoint:  presentation/environment-host.ts physically owns per-game
scenery state, artwork and environment drawing bindings. Lazy current-view ports
retain viewport, stage, density, cinematic/weather and cosmetic time access.
The live weather record remains gameplay-owned. Its deterministic initialization
now precedes the host construction; both former state initializers use fixed 0.5,
consume no random stream and make no storage/browser writes.
Strict types and all 361 units pass (environment-host-typecheck.log,
environment-host-unit.log). `npx playwright test tests/browser/rendering.spec.ts tests/browser/scene-readiness.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 14 pass in 25.4s (environment-host-browser.log; terminal confirmed).
The initial host layout contract was too narrow; it now includes the actual
drawing layout alongside artwork glows without changing behavior.
Next: delete 75 semantically unused root imports separately, then reduce profile,
presentation/UI/session binding blocks. No profile-loading draft was applied.
All W2/W3/Part 4 requirements remain in scope; do not push develop early.

Previous checkpoint:  the original frame simulation sequence is physically owned
by game/session/frame-simulation.ts. Scene/trial gates, raw run/death deltas,
cinematic isolation, enemy/phase ordering and camera/audio dispatch are retained.
Visual clocks and browser capabilities are explicit ports; no rendering imports.
`npm run typecheck`, `npm test`: strict types and all 361 units pass
(frame-simulation-typecheck.log, frame-simulation-unit.log).
`npx playwright test tests/browser/scene-readiness.spec.ts tests/browser/trials.spec.ts tests/browser/performance.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 16 pass in 1.5m (frame-simulation-browser.log; terminal confirmed).
performance.spec here asserts ordinary menu/blur/resize lifecycle behavior;
no performance suites, benchmarks or profiles were run.

Checkpoint diagnostic investigation: isolated unchanged pre-refactor source
completed the original recovery actions with zero page errors. The added probe
assertion expecting the diagnostic failed (checkpoint-diagnostic-baseline.log).
Therefore its natural occurrence is NOT proven pre-existing. Identical source
contains the throwing guided-order read, but that alone is insufficient proof.
Keep the broad-run diagnostic unresolved and investigate before the W2 gate;
do not loosen assertions or claim a baseline reproduction.

Next: reduce remaining explicit binding setup and finish reaction ownership.
The root remains about 2,700 lines, far from the composition target. W2/W3/Part 4
are incomplete; continue autonomously and do not push develop early.

Previous checkpoint:  equipment appearance and preview-frame construction are
physically owned by presentation/equipment.ts. Read-only views supply current
equipment, palettes, awakening eligibility, layout/lighting and companion state.
Per-game fallback blade and charm palette identities are retained.
Strict types and all 361 units pass (equipment-presentation-typecheck.log,
equipment-presentation-unit.log). The rendering browser invocation passed all
11 cases in 25.3s (equipment-presentation-browser.log). Its two additional file
filters were mistaken nonexistent names, so they supplied no outfit coverage.
The corrected `npx playwright test tests/browser/outfit-awakenings.spec.ts tests/browser/armoury-mobile.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`
passed all six in 33.9s (equipment-presentation-outfits.log; terminal confirmed).
Next: frame simulation ordering, remaining binding setup and reaction ownership.
Baseline checkpoint diagnostic probe is running in the isolated pre-refactor
checkout; do not classify that diagnostic until its assertion/terminal result.
W2 remains incomplete. Complete W2/W3/Part 4 before the one develop push.

Previous checkpoint:  native renderer construction/disposal is physically owned by
presentation/native-services.ts. Prepared lighting retains borrowed ownership;
existing renderer creation and cleanup order is unchanged. Strict types and all
361 units pass (native-services-typecheck.log, native-services-unit.log).
`npx playwright test tests/browser/class-lifecycle.spec.ts tests/browser/rendering.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 17 pass in 25.2s (native-services-browser.log; terminal confirmed).
Next: equipment appearance, frame simulation and remaining composition bindings.
W2 remains incomplete; continue all three workstreams and Part 4 before pushing.

Previous checkpoint:  parry/block cosmetic reactions are owned by
presentation/duel-feedback.ts. Rule events carry flat positions; listeners have
no gameplay state/RNG capability. Hit stop and animation mutations remain rules.
Actual combat orchestration produces identical run/profile/RNG outcomes with
these listeners enabled or disabled. Cosmetic feedback now follows committed
score/profile reactions within the same input call; no new effects or timing.

Verification: `npm run typecheck`, `npm test`: strict types and all 361 units pass
(duel-feedback-typecheck.log, duel-feedback-unit.log).
`npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 253 browser checks pass (duel-feedback-broad.log; terminal result confirmed).
The log includes a missing wave configuration diagnostic in checkpoint recovery;
the same unconditional guided-order read exists at pre-refactor. Investigate with
an unchanged baseline reproduction before deciding whether a repair is in scope.

Next: move native service construction/disposal, equipment appearance and frame
simulation ordering into their actual owners, then reduce explicit binding setup.
Prepared drafts are not applied. The composition root is still about 2,800 lines;
W2 is incomplete. Continue remaining reaction ownership, W2 full gates/version,
all W3 and Part 4. Do not push develop until the complete final verification.

W2.0 baseline harness: 637a4de. W2.1 native-only surfaces/materials/films/paths
and obsolete comparison deletions are complete. Context/events foundation is
committed (3d1f26f); it introduces explicit gameplay/service and presentation
contracts. Live phaseChanged is wired through the phase router;
kill/score/combo events are wired through synchronous listeners; remaining phase/run events await wiring.
The typed bus is synchronous, registration-ordered, reentrant and value-payload-only.
The seeded scenario tests still use temporary inline input/HP drivers; migrate
them to real extracted APIs and cover every state-table state as those appear.

Implemented presentation owners:

- scene.ts and scene-composer.ts: seven actual named layers with explicit-neighbour
  hooks. Foreground bamboo follows combat particles, preserving source order.
- figures.ts: frame renderer and enemy/boss projection/death drawing.
- cues.ts: read-only wave/boss/standoff ensō/glyph projection.
- feedback.ts: cosmetic spawning/drawing, popup/stamp, flash/camera/letterbox,
  weather/cut bursts and effect updates. No RunState/combat RNG.
- state.ts: cosmetic time/wind, effects and camera/flash/ink/letterbox signals.
- environment.ts and environment-state.ts: ambient/grass/leaf/weather drawing,
  cached scenery/particle state and cinematic weather.
- environment-artwork.ts: cached background, mist, grass, drift and weather builders.
- post.ts, post-preparation.ts, post-artwork.ts: prepared drawing, module-owned
  cosmetic post history, camera/post frame preparation and cached grain/vignette/ink.

PresentationContext exposes cosmetic and environment state directly. Gameplay
hitStop/timeScale and live WX hazard timers stay outside presentation. buildWeather
calls cosmetic artwork then resets live WX with combatRandom in the original order.
That boundary split was committed separately (26af5a3) before the builder move.
Scene-ready rule continuation likewise moved outside drawing first (75e8490).
No balance or combat timing changes. Same-input cosmetic reaction/RNG ordering now follows committed kill snapshots; see tmp/runtime-refactor/behaviour-changes.md.
game.ts currently has 3110 lines; composition-root reduction is NOT complete.

Live phase-router integration is complete: inputs dispatch after existing scene-loading/
guided gates. updateFrame visits boss, playing, standoff, between and dead in the
original order, retaining same-frame cascades and raw death/boss cleanup delta.
Checkpoint restore adopts records silently without replaying entry/rewards.
Strict types and all 318 units passed (router-live-final-unit.log).
`npx playwright test --config playwright.rendering-v2.config.ts`: all 253 passed
on the full retry (router-live-broad-retry.log, terminal confirmed). First run
251/253 exposed the stale cinematicStageSeed audit hook; separately committed
a53202b supplies its read-only owner accessor, with seven focused cases green.
Enemy kill physical move is complete: game/combat/kill.ts owns the current cut,
combo, score, reward, blessing and chain rules through explicit current views.
Appearance/disarm/coin/stain/shake ports keep rendering state outside gameplay.
Seeded wave scenarios now call the production kill API. Three focused API cases
cover perfect records/rewards, automatic power isolation and recursive slot refill.
Strict types and all 321 units passed (enemy-kill-unit.log).
Focused browser verification: all 25 passed (enemy-kill-browser.log, 1.8m, terminal confirmed): scattered-armour, new-blessings, trials, editions-mastery and runtime-checkpoint-fixtures with playwright.rendering-v2.config.ts.
Kill/score/combo event split is complete and verified.
game/combat/kill.ts now retains run mutations/combat RNG and emits frozen flat
kill/cutChain values. game/progression/combat-listeners.ts owns profile counters;
presentation/kill.ts owns cut audio/haptics/FX. game/progression/combat-score.ts
owns shared score/combo changes and emits scoreAdded/comboChanged/comboBroken/
comboProtected; presentation/combat-score.ts owns display reactions. Listeners
are synchronous and lifecycle-disposed. Kill snapshots include projection/reward
flags for reactions, retaining no mutable run/character/RNG references.
Strict types and all 326 units passed (kill-events-typecheck.log, kill-events-unit.log),
including payload/disposal/RNG isolation and real scoring/Zen/combo-bank cases.
Focused browser command (kill-events-browser.log): scattered-armour, new-blessings,
trials, editions-mastery and runtime-checkpoint-fixtures with
playwright.rendering-v2.config.ts. All 25 passed (1.8m, terminal confirmed).
First broad event run finished 252 passed / one failed (12.5m): named-profile
save-transfer timed out before its first Options action; cause unestablished.
Five unchanged focused repeats passed (42.5s, kill-events-profile-repeat.log).
`npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 253 passed on the full retry (kill-events-broad-retry.log, terminal confirmed).
No tests, assertions or deadlines were changed.
Current green event checkpoint: 58692a5. Shared character-model physical move
is now complete: shared/character.ts owns the existing plain pose/seed/appearance
types, shared/figure-model.ts owns seed/pose helpers and shared/character-death.ts
owns death styles/duration/opacity/choice. Rendering retains temporary re-exports.
All gameplay imports of rendering/presentation have been removed (rg audit).
Strict types and all 326 units passed (character-model-*.log).
`npx playwright test tests/browser/rendering.spec.ts tests/browser/death-presentation.spec.ts tests/browser/scattered-armour.spec.ts tests/browser/enemy-art-cache.spec.ts --config playwright.rendering-v2.config.ts`:
all 17 passed (23.6s, character-model-browser.log, terminal confirmed).
No record shape, RNG or behavior changes in the physical model move.
Unused figures/model.ts compatibility adapter is removed separately after the src/tests/scripts/docs consumer audit found no references. Strict types and all 326 units passed (model-adapter-cleanup-*.log).
State-machine/registry foundation is now implemented. state-machine.ts dispatches
typed tables and validates states/transitions, retaining existing record state/t;
owners advance freeze/hazard/raw clocks before dispatch. behaviour-registry.ts
provides stable ordered matching by existing record data with duplicate/unknown
type validation. Four real API cases cover timer/hook ordering, invalid restored
states, single dispatch and registry extension without serialized type fields.
State foundation checkpoint 6161d28: strict and all 330 units passed.
Live grunt tables now own enter/idle/attack/strike/dying/fade in game/combat/grunt.ts.
The registry derives feint/Zen/Still/base variants from existing flags, with no
serialized type field. Owner clocks retain attack freeze/surge, life and raw shadows;
shared pose finishing retains the old feint-switch frame and same-frame foxfire
non-split death pose. Existing updateEnemies remains a thin compatibility adapter.
Seven actual API cases cover every state, variants, deadlines, damage and foxfire.
Strict types and all 337 units passed (grunt-table-*.log), including seeded scenarios
and legacy checkpoint unit fixtures.
`npx playwright test tests/browser/new-blessings.spec.ts tests/browser/death-presentation.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/trials.spec.ts tests/browser/feature-plan-04.spec.ts --config playwright.rendering-v2.config.ts`:
all 21 passed (1.6m, grunt-table-browser.log, terminal confirmed).
Runtime and all test update callers now import advanceGrunts directly; legacy checkpoint/scenario checks use the actual owner. Strict types and all 337 units passed (grunt-api-*.log). Source/test/script audit has no enemy-update.ts imports.
Unused enemy-update.ts adapter is removed; strict types and all 337 units passed again (grunt-adapter-*.log).
Grunt construction is physically moved to game/combat/grunt-spawn.ts (createGrunt, plain records and seed/pose/look initialization). enemy-spawn.ts retains a thin spawnEnemy adapter plus ordering/selection utilities. Strict types and all 337 units passed (grunt-spawn-*.log); all four unchanged runtime checkpoint browser fixtures passed (17.5s, terminal confirmed).
Construction consumers now import createGrunt directly (local aliases preserve their existing ports). Strict types and all 337 units passed again (grunt-spawn-api-*.log). The unused spawnEnemy adapter is now removed; enemy-spawn.ts retains ordering/selection utilities. Strict types and all 337 units passed (grunt-spawn-cleanup-*.log). Boss tables/registry now implemented: all ten existing states dispatch through a typed table; base/mirror/twin/spear registry entries own the machine and hooks for direction, double parry and parameter configuration. updateBoss/bossToIdle adapters remain pending consumer migration and separate cleanup. Strict types and all 343 units pass (boss-tables-*.log). Seven live boss/encounter/checkpoint cases passed on the final registry wiring. Boss consumers now import advanceBoss directly with local aliases preserving existing ports; the unused root idle wrapper references resetBossIdle until cleanup. Strict types and all 343 units passed (boss-api-*.log), and no boss-update.ts import remains. Unused boss-update.ts, its resetBossIdle helper and the unused root toIdle wrapper are now removed separately. Strict types and all 343 units passed (boss-cleanup-*.log). Player animation plain records/functions are physically moved unchanged to game/player/player.ts. Runtime and unit helpers use the owner directly; rendering/figures/player.ts retains only the REST_POSE re-export used by browser rendering coverage. Strict types/all 343 units passed (player-move-*.log), and all 15 rendering/checkpoint browser cases passed (21.0s, terminal confirmed).
Player pose selection now uses a typed idle/swing/block/death table derived from swingT/swingDir and the fallen input. The plain animation record retains its exact shape; no separate hurt timer exists. Strict types/all 346 units passed (player-table-*.log); all six live death/checkpoint cases passed (17.3s, terminal confirmed). Companion selection, foxfire rescue and Daruma/Phoenix/support revival are physically owned by game/player/companions.ts; death phase and root keep thin orchestration ports. Strict types/all 346 units passed (companions-*.log), and all five live blessings/encounter cases passed (25.2s, terminal confirmed). Results/reward orchestration now physically lives in game/session/results.ts, with display/storage/reward capabilities explicit. Five actual API tests cover terminal idempotence, daily/trial routing, rollback with an existing claim marker, v1 pending recovery and async disposal. The seeded death/results scenario now uses the actual owner, including the declined async support offer. Strict types/all 351 units pass (results-*.log); all 12 unchanged live support/daily/trial/encounter cases passed (1.4m, terminal confirmed). A separate new first-bonus failed-save probe found an absent claim marker is not restored; reproduced against unchanged pre-refactor ad353b3 in the isolated baseline worktree. The independently reproduced first-claim failed-save edge is now fixed separately: rollback removes a marker that was absent before the attempted grant. Existing-marker rollback still restores its previous identity. Strict types/all 352 units and both live support cases pass (results-rollback-*.log; browser 23.1s, terminal confirmed). All required combat/phase/run event names now emit from rule owners: struck, parry, block, waveStarted/waveCleared, bossStarted/bossDefeated, standoffResolved and runStarted/runEnded, alongside existing kill/score/combo/phase events. Parry/block carry flat sword-tip x/y/height for later light listeners. Owners receive emission-only capabilities; payloads contain frozen values, never mutable records/RNG. Five actual API tests cover deferred entry, committed state and once-only outcomes. Strict types/all 357 units pass (phase-events-*.log); all 19 unchanged live support/daily/trial/encounter/checkpoint/blessing cases passed (browser log, terminal confirmed). Remaining player/pet/foxfire drawing has now physically moved from the root to presentation/player-figures.ts with read-only record/layout/equipment views. Strict types/all 357 units passed (player-figures-*.log); all 17 unchanged rendering/encounter/checkpoint browser cases passed (35.2s, terminal confirmed). Active awakening selection and modifier composition now physically live in game/equipment/active.ts. Narrow views retain title/over versus running upgrade policy and trial neutral modifiers. Strict types/all 357 units passed (active-equipment-*.log); all 12 live equipment/edition/mastery cases passed (57.6s, terminal confirmed). Reward accrual, challenge counters, blade statistics and terminal unlock helpers are now physically owned by game/progression/profile-rules.ts with explicit current profile/run/storage/reveal capabilities. Strict types/all 357 units passed (profile-rules-*.log); all 18 unchanged support/feature-plan/edition/mastery browser cases passed (58.8s, terminal confirmed). Scene readiness, stale-request suppression and paused continuation adoption now physically live in game/session/scene-flow.ts, receiving renderer operations as explicit ports. Drawing remains separate from gameplay continuation. Strict types/all 357 units passed (scene-flow-*.log); all ten unchanged scene-readiness/native-scene/checkpoint browser cases passed (27.9s, terminal confirmed). Parry/boss-victory/standoff profile reactions now live in game/progression/encounter-listeners.ts. Boss event payloads project clean/mirror/mode/rush/blade/victory values; listeners receive current profile/counter capabilities with no run/RNG reference. Rule owners retain run mutations/reward inputs and save after profile reactions. Strict types/all 359 units pass (encounter-events-*.log); all 16 live encounter/result/trial/profile-transfer cases passed (1.6m, terminal confirmed). Next: parry/block cosmetic feedback listeners, remaining root helper/service ownership and composition reduction, then complete W2 gates/version. All W3/Part 4 remain pending; develop stays unpushed. W2 gates/minor version, all W3 and Part 4 remain pending; develop is unpushed.
Prepared drafts under tmp/runtime-refactor/drafts: model move, state foundation,
grunt table and grunt tests are all RUN (do not repeat physical scripts).
move-results-draft is NOT applied; refresh its capture audit before the later move.
Ignored isolated previews were preparation only; actual develop checks above pass.
Earlier checkpoint b360675: between controller, strict/all 316 units and
ten actual trial/save browser cases passed (between-*.log).
Then state tables/registry, player/companions, results/reward ownership and root
reduction. Full W2/W3/Part 4 remain pending; develop stays unpushed. Death
5aa27b4: 314 units/18 browser; shrine d77ded7: 309/17; trials 523b4fd: 306/16;
boss f350035: 303/20; standoff fa674bf: 300/five. No gameplay/save changes.

Wave lifecycle checkpoint a3f32a0: strict, 297 units and thirteen real browser cases
passed (wave-lifecycle-*.log); seeded entry/update use the production API. Wave
input checkpoint 2b6dfe5: strict, 294 units and twenty real browser cases passed.

Previous run-start checkpoint: 5aee8dd; four actual initialization cases and seeded
scenario initialization use run-start.ts. Strict, all 290 units and 15 real browser
trial/recovery/setup cases passed (run-start-*.log).

Previous session checkpoints: run-flow controls 5842908 (284 units, 17 menu/save
and ten graphics/context cases), checkpoint recovery 05a52ee (286 units, six actual
API fixture/action cases and six real browser fixtures/recovery cases). Legacy
records now use the extracted restore/capture APIs and still have identical keys.
Logs run-flow-*.log and checkpoint-flow-*.log retain exact commands/results;
nonexistent context-loss.spec/run-checkpoint.spec patterns matched no cases, and
real graphics/context files were explicitly verified.

Router foundation 556acb9 is integrated in the live runtime.
Owner entry APIs still perform existing direct record writes; router synchronizes
them for dispatch, and all passive enter callbacks avoid replaying entry/rewards.
Other rule event emission and listener ownership remain next.
Remaining rule capture/type audit: tmp/runtime-refactor/rule-port-audit.json.
Preserve same-frame phase cascades and game/cosmetic RNG consumption order.
Full W2, W3 and Part 4 remain pending; do not push develop.

UI final cleanup: strict types and all 274 units passed (ui-cleanup-unit.log).
`npx playwright test tests/browser/ui.spec.ts tests/browser/trials.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/presentation-readiness.spec.ts --config playwright.rendering-v2.config.ts`:
all 17 passed (ui-cleanup-browser.log; terminal completion confirmed).
No intentional behavior/save changes. bossShownDirection's root import remains
for existing trial response instrumentation until that harness migrates.

Implemented UI owners under src/ui/wiring: screens (HUD/animation), panels
(navigation/statistics/title record), secrets (title taps/swipes), admin (guarded
testing controls), settings (preferences/options/lighting debug), setup (setup and
isolated tutorial), armory (equipment/awakening/presets), input (pointer/keyboard/
navigation), purchases (refresh/edition guards/supporter controls), cinematic
(viewer session and grade), profile (reset/transfer/management).
Mutable EQ/ST/settings/session reads retain current getters, not stale captured
values. Callback registration and save-key ordering are preserved. UI mutations
are existing wiring; rule extraction into phase/progression owners remains next.

Focused checks, all terminal-confirmed; each preceded by strict types and all 274
units. Logs tmp/runtime-refactor/ui-<owner>-{unit,browser}.log:

| Owner | Browser files (tests/browser; rendering-v2 config) | Passed |
| --- | --- | --- |
| screens | ui, runtime-checkpoint-fixtures, presentation-readiness | 11 |
| secrets | secrets, secret-recovery, cinematic, runtime-checkpoint-fixtures | 15 |
| admin | admin-layout, offerings-admin, runtime-checkpoint-fixtures | 9 |
| panels | ui, trials, runtime-checkpoint-fixtures | 16 |
| settings | options, ui, runtime-checkpoint-fixtures | 21 |
| setup | setup-progression, tutorial, runtime-checkpoint-fixtures | 9 |
| armory | ui, temple-armoury, presets, runtime-checkpoint-fixtures | 14 |
| input | input, options, secrets, runtime-checkpoint-fixtures | 20 |
| purchases | premium, editions-mastery, runtime-checkpoint-fixtures | 15 |
| cinematic | cinematic, secret-recovery, runtime-checkpoint-fixtures | 11 |
| profile | profile-reset, save-transfer, runtime-checkpoint-fixtures | 8 |

Each table command was `npx playwright test` plus every named
`tests/browser/<file>.spec.ts --config playwright.rendering-v2.config.ts`.
Next: run-flow and phase-router foundation, then waves/standoff/boss/shrine/death
controllers; migrate temporary scenario drivers to actual APIs. Preserve existing
same-frame phase cascades and game/cosmetic RNG order. Run broad browser checks
when rule dispatch changes. Then kill rule/listeners, tables/registry and separate
adapter removal, player/companions and final composition-root reduction.
Full W2 production/Android gate and minor version 1.67.0 remain pending. W3 and
Part 4 remain pending; do not push develop or mark the goal complete.

Cached environment builders checkpoint: Strict types
passed. All 274 units passed (environment-artwork-unit.log).
`npx playwright test tests/browser/presentation-readiness.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/cinematic.spec.ts tests/browser/stage-variation.spec.ts --config playwright.rendering-v2.config.ts`:
all 12 passed (environment-artwork-browser.log; terminal exit confirmed).
Immediately preceding weather boundary: strict types, 274 units and
`npx playwright test tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/cinematic.spec.ts --config playwright.rendering-v2.config.ts`:
all nine passed (weather-boundary-browser.log). Environment state: 13 passed
(environment-state-browser.log). Cues: seven passed; feedback actions: nine;
cosmetic state: 14; cached post: nine; post preparation: seven; environment drawing:
nine; feedback drawing: eight; figures: seven; post drawing/films: two plus seven;
composer: eight; first scene move: 12. All focused run logs are under
tmp/runtime-refactor, and assertions/tolerances remain unchanged.
The ordinary performance.spec.ts lifecycle assertions are not profiling.

Presentation broad first run:
`npx playwright test --config playwright.rendering-v2.config.ts`: 252 passed,
one failed (presentation-broad-browser.log; terminal confirmed). Failure:
rendering.spec.ts shared-artwork preview disposal changed another preview's PNG.
`npx playwright test tests/browser/rendering.spec.ts -g 'armory preview effects stay local' --repeat-each=10 --config playwright.rendering-v2.config.ts`:
all 20 passed unchanged (preview-isolation-repeat.log; terminal confirmed).
No assertion/tolerance or renderer change was made; cause is unestablished.
Ignored pixel diagnostics are prepared under tmp/runtime-refactor/preview-diagnostics
with playwright.preview-diagnostic.config.ts if the failure recurs.
A second uninterrupted broad run on e3e12a2 passed all 253 tests (11.7m),
presentation-broad-recheck.log; terminal completion confirmed. The presentation
cluster is green. UI extraction followed and is now complete.
UI dependency audit/plans are under tmp/runtime-refactor/audit-current.{json,md}
and ui-extraction-plan.md, preserving immutable audit.json/audit.md.
Cosmetic update call order is preserved: clock, ambient, existing rule update,
transition, camera. Next is run-flow/router/phases, kill rule/listeners,
state tables/registry and adapter removal, player/companions, final composition root.
Full W2 unit/broad/production/Android gates and minor version 1.67.0 remain pending.
W3 entirely pending, then Part 4 final verification/report and one develop push.
Do not push develop or mark the goal complete yet.

W2.1 broad verification: `npx playwright test --config playwright.rendering-v2.config.ts`
**249 passed, three failed**; log under
`tmp/runtime-refactor/w2-webgl-broad-browser.log`, terminal exit confirmed.
Two failures were remaining Canvas scene fixtures; the isolated tutorial fixture
sent input before its asynchronous WebGL2 surface was ready. Migrated those scene
fixtures and awaited the native backend before tutorial input, retaining all
assertions. `npx playwright test tests/browser/cinematic-refinements.spec.ts tests/browser/demon-trial.spec.ts tests/browser/tutorial.spec.ts --config playwright.rendering-v2.config.ts`
all **six passed** (webgl-broad-recheck.log; terminal exit confirmed). Every case
now has a green result across broad/recheck coverage. This is NOT a claim that
one uninterrupted broad invocation passed; repeat broad at the next shared
runtime change and at the full W2 gate.
Strict types and all 265 unit tests passed for the native film implementation;
focused native/graphics/depth checks are recorded below. No test tolerance was
relaxed; no scenario was skipped to pass. Canvas-only film parity fixtures/tools
were explicitly removed after replacement native coverage passed. No profiling
ran. No converter/browser process remains live. Version remains 1.66.8 until the
full W2 minor checkpoint; existing Android pre-refactor exception remains.

WebGL2 is acquired explicitly; native surfaces never replace their canvases.
Startup capability failures show one Retry graphics screen. Context loss pauses
live play; restore rebuilds through Pixi and requires explicit resume. Eight-second
unrestored loss shows Reload, with saves intact. Auxiliary surfaces have the same
deadline. Scene materials, films and vector paths require native sinks. Canvas /
OffscreenCanvas texture preparation and native film blend definitions remain.
Current intentional gameplay changes: none (`tmp/runtime-refactor/behaviour-changes.md`).

W1 report: `docs/development/asset-compaction-results.md`. Audit/input evidence:
`tmp/asset-compaction/audit.md`, audit.json and original backups. All 86 families
have exact scalar/surface equality; 78 zero-emission maps are removed. All 86
authoring PNG hashes, recipes, provenance and sprite geometry remain intact.

Ordered commits: compact additions `7a3f420`, runtime URLs/catalog `069fca6`,
602 generated-PNG deletions `9e31acc`, documentation `9be233b`. Future regeneration
correctly cleans stale emission when inputs become zero (`5eb29a3`). There are
352 runtime siblings (180 exact data planes); eleven colour PNG exceptions make
every sibling smaller without relaxing tolerances. Final compaction apply is a
no-op. No converter/browser/build process remains live.

## W1 verification commands and results

Commands run from the repository; Python uses the Pillow-enabled ISSEN_PYTHON.
All logs below are in ignored `tmp/asset-compaction/`.

- `& $env:ISSEN_PYTHON scripts/assets/tests/compact.test.py`: six passed,
  w1-final-python.log. `node scripts/assets/compact.mjs --apply`: zero changes,
  w1-final-noop.log. Node utility/export checks:
  `node --test tests/unit/asset-compaction.test.mjs tests/unit/asset-pack-docs.test.mjs scripts/pbr/tests/cli.test.mjs`:
  ten passed, w1-final-tools.log.
- `npm test`: all 252 passed, w1-final-unit.log.
- `npm run typecheck`: passed, migrated-typecheck.log; strict checking also passed
  in the final production and Android web builds.
- `npx playwright test tests/browser/compacted-planes.spec.ts --config playwright.rendering-v2.config.ts`:
  all 352 conversions passed (180 exact data), every-plane-browser.log; the same
  test passed again after cleanup in the broad suite.
- `npx playwright test tests/browser/pixi-backend.spec.ts tests/browser/pixi-scenes.spec.ts tests/browser/pixi-catalogue.spec.ts tests/browser/material-colour.spec.ts tests/browser/asset-materials.spec.ts tests/browser/environment-materials.spec.ts tests/browser/artwork-loading.spec.ts tests/browser/enemy-art-cache.spec.ts tests/browser/optional-emissive.spec.ts tests/browser/zero-emission-parity.spec.ts --config playwright.rendering-v2.config.ts`:
  all 34 passed, migrated-focused-browser.log. Includes Canvas comparisons and
  context-loss/restore cases. Weapon optional-emission readiness regression fixed.
- `npx playwright test --config playwright.rendering-v2.config.ts`: all 245 passed
  in one uninterrupted 11.5m run, w1-broad-browser.log (terminal exit confirmed).
- `npm run test:production`: final version all four passed,
  w1-version-production.log (terminal exit confirmed).
- `$env:ISSEN_ANDROID_BUILD_DIR='tmp/.verification-build-android'; npm run test:android-web`:
  final version four passed and encounter reload failed, w1-version-android.log.
  The same original assertion fails on unchanged pre-refactor Android web build:
  `npx playwright test tests/android/offline.spec.ts -g 'encounter recovery' --config tmp/asset-compaction/android-baseline.config.ts`,
  android-recovery-baseline.log; focused compact recheck also fails. This is a
  proven pre-existing exception under the goal decision rules; no assertion or
  tolerance was skipped/changed. A first baseline attempt had wrong server cwd;
  the corrected run is the evidence.
- `npx playwright test tests/browser/changelog.spec.ts --config playwright.rendering-v2.config.ts`:
  passed, w1-changelog-browser.log. `node scripts/pbr/refresh-pack-docs.mjs`:
  second refresh zero changes, all 266 plane links independently checked.

Matched byte results are in `tmp/asset-compaction/byte-results.json`. Web bundle
261,053,490 to 120,506,570 bytes; Android web 284,964,042 to 144,390,034. Runtime
planes 266,530,086 to 120,472,123; checked texture tree includes authoring originals
and totals 181,824,601. Unsigned ZIP projection 295,487,341 to 158,550,091 using
one frozen native shell. Projections are neither native builds nor installable
APKs. Existing dist/store/APK outputs remain untouched. Baseline checkout under
`tmp/asset-compaction/restore-baseline` is detached at pre-refactor, clean, with
linked dependencies; preserve it while pre-existing failure evidence is needed.
Future oversized normal/surface review and opt-in captures are listed in W1 report.

## Next steps (all required)

1. W2.0 baseline complete: 378 implementation functions audited in
   `tmp/runtime-refactor/audit.md` and audit.json (335 closure captures, 14 direct
   RNG functions). Snapshot `pre-extraction-game.ts` and reproduction audit script
   remain ignored. No production runtime code moved. Thirteen headless scenario
   and checkpoint tests cover current exports and four real checkpoint fixtures.
   Inline rule boundaries are temporarily represented by harness input handlers;
   replace them with extracted phase/kill APIs and extend all state coverage as
   those APIs appear. Do not claim the harness already tests every inline rule.
   `npm run typecheck` passed (w2-audit-typecheck.log); `npm test` all 265 passed
   (w2-audit-unit.log). `npx playwright test tests/browser/runtime-checkpoint-fixtures.spec.ts --config playwright.rendering-v2.config.ts`
   all four passed (old-checkpoint-browser.log; terminal exit confirmed). Logs
   are in tmp/runtime-refactor. Fixture capture itself passed four cases.
   `tmp/runtime-refactor/behaviour-changes.md`: none yet. No W2 process remains.
2. W2.1 first green increment: WebGL2-only scene surface startup, fixed canvas
   identity, one graphics Retry/Reload screen, main/auxiliary eight-second deadlines,
   explicit resume on restore, tutorial native-only. UI material painter failures
   report through the same graphics error event. No production code moved.
   Strict types passed; `npm test` all 265 passed (webgl-surface-unit.log).
   `npx playwright test tests/browser/graphics-errors.spec.ts tests/browser/class-lifecycle.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts --config playwright.rendering-v2.config.ts`:
   all 13 passed (webgl-surface-browser.log; terminal exit confirmed).
   `npx playwright test tests/browser/pixi-backend.spec.ts -g 'WebGL context|native Armoury' tests/browser/game.spec.ts -g 'runtime disposal|WebGL context|native Armoury' --config playwright.rendering-v2.config.ts`:
   four passed (webgl-main-context.log; terminal exit confirmed). Logs under
   tmp/runtime-refactor. No process remains. Next remove the remaining material
   Canvas branch/checks and standalone Armoury fallback, migrate scene tests to
   prepared native surfaces, remove fallback-only comparisons in separate commits,
   then run the shared-runtime broad suite before extraction.
   Material/Armoury cleanup now implemented and focused checks green. Explicit
   cachedMaterialContext distinguishes texture preparation from native scene
   stamps; all supportsSceneMaterials fallback checks removed. Scene fixtures
   now use native painters with separate Canvas readback. Runtime test injections
   use artworkReady assignment to preserve original fully-loaded timing (a return
   hook exposed partially loaded frames and failed the unchanged maximum-2 pixel
   tolerance; corrected hook passes). Strict types passed, all 265 unit tests
   passed (material-native-unit.log). Material/environment/save suite all 15 passed
   (material-native-browser.log). Scene suite 24/25 passed; only old harness hook
   failed (native-scene-browser.log). Backend suite 20/22 passed; old harness and
   removed fallback assertion failed (native-material-backend.log). Corrected
   `npx playwright test tests/browser/pixi-backend.spec.ts -g 'same prepared scene|unavailable WebGL' tests/browser/scattered-armour.spec.ts -g 'selected Scattered|same prepared scene|unavailable WebGL' --config playwright.rendering-v2.config.ts`
   all three passed (native-harness-ready-recheck.log). These focused/recheck runs
   are not an uninterrupted broad-suite pass. No process remains. Remaining
   W2.1 (now complete): remove Canvas-only film self-copy and path fallback code, migrate film
   tests to native targets, delete fallback-only film reference/tooling separately,
   refresh related docs, run broad browser tests. Then ordered W2 extraction.
   Film and SVG path native-only implementation now complete. Removed Canvas
   self-copy/snapshot storage and noir/glitch alternate film bodies; native filters
   and procedural native geometry remain. Strict types passed; all 265 unit tests
   passed (native-film-unit.log). `npx playwright test tests/browser/pixi-films.spec.ts tests/browser/trial-films.spec.ts tests/browser/rendering.spec.ts --config playwright.rendering-v2.config.ts`:
   all 15 passed (native-film-browser.log, terminal exit confirmed).
   `npx playwright test tests/browser/stage-landmark-visibility.spec.ts tests/browser/scenery-depth.spec.ts --config playwright.rendering-v2.config.ts`:
   all five passed (native-depth-browser.log, terminal exit confirmed). No process
   remains. Completed separately: delete Canvas-only film parity test/reference and its
   dedicated comparison wrapper/benchmark (do not run profiling), then run broad
   shared-runtime regression. W2 context/events and extraction have not begun. Native blend filters
   remain because film output depends on them. W2.1 removes Canvas fallback first; keep Canvas/OffscreenCanvas texture tools.
   Require WebGL2, use one graphics error screen, retain eight-second context-loss
   recovery with explicit resume and Reload on failure. Then follow the eight
   ordered extraction phases, green/checkpoint commits, explicit narrow contexts,
   synchronous typed events, plain state records, state tables/behaviour registry.
3. Finish W2 gates/docs/minor version; proceed through all W3 lighting phases and
   gates/minor version. Do not start W3 before W2 completes. W3 is entirely pending.
4. Part 4 final checks/report, commit completion handoff and push develop once.
   No approval gates; never declare completion from W1 alone or push prematurely.

## Previous completed work (historical handoff)

# Current development status

**Asset packing cancelled at the user's request on 7 October 2026.**

The application uses the original source atlases, material maps and asset loaders
again. The packing scripts, generated tight atlases, packed-page stores, UI
texture tokens and packing-specific tests have been removed. Original PBR maps
and generation tooling are restored with the pre-migration material catalog.
Startup preloads and decodes source artwork; material owners load selected maps.
The newer startup lifecycle and rendering refactors are preserved.

The unfinished asset-pipeline performance comparison is cancelled. Saved local
reports remain under ignored `tmp/`; do not restart benchmarks automatically.
The existing performance harness is restored to its pre-packing implementation.

The separate lit-only rendering work remains unintegrated and is not resumed by
this request. Preserve the `codex/lit-rendering-only` worktree and re-audit it only
when the user asks to continue that work. Its former dependency on completing
asset packing no longer applies.

Version **1.66.6** recorded the return to original assets; the current version is
**1.66.7** after the class refactoring below. No push, deployment or release is
part of these requests. Player save keys remain unchanged.

## Verification of the rollback

- Original blob hashes and removal of packing additions verified for 770 paths.
- All 248 unit tests and all 12 focused asset browser tests passed.
- Strict TypeScript and the production verification build passed; all four
  production browser tests passed after connecting scene-surface initialization.
- The broader browser run exposed startup timeouts and a tutorial failure and
  was stopped after the drawing-context fix made that run stale. All five cases
  in the focused recheck passed with one worker, using their original timeouts.
  Do not describe the full browser regression suite as passing.

Verification logs are saved under ignored `tmp/asset-packing-removal/`.

## Class refactoring follow-up

The started `MainGame` and `SceneSurface` class conversions are complete in
version **1.66.7**. Other modules retain their existing
structure. `main.ts` now creates the startup owner from `main-game.ts`; that class
shares overlapping starts and owns partially initialized surfaces, failure retry
and cleanup. `SceneSurface` owns shared initialization, Canvas fallback, bound
disposal and cancellable auxiliary recovery. Tutorial and preview consumers use
that class. Main-canvas combat suspension and input rebinding remain in the runtime.

Strict TypeScript, all 248 unit tests and all four production browser cases passed.
All 241 browser cases passed across the broad run and focused rechecks, including
six new class lifecycle cases. Existing tests now wait for completed startup and
allow enough total time for repeated original-asset reloads; gameplay assertions
and recovery deadlines remain unchanged. The first broad run stopped after eight
startup-wait failures, and rechecks completed the unrun and interrupted cases.
The coverage audit confirms that every case in the 241-case manifest has a passing
result; this is not a claim that one uninterrupted full-suite invocation passed.
Logs and the coverage audit are saved under ignored `tmp/class-refactoring/`.
No benchmarks, lit-only
integration, push or deployment are part of this follow-up.
