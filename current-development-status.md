## LIVE W3 phase 1 broad browser gate — resume exact process

Source under verification is committed 4d4ed49, version 1.68.0. Strict/all401
units and all47 affected native/startup/restore/game/checkpoint browsers PASS.
Full command now running:
 npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure
Unified exec session 14622 is confirmed LIVE by write_stdin returning this handle.
Log tmp/lighting-refactor/phase1-broad-browser.log; 260 cases, two Edge workers.
Latest authoritative observation: three passing cases, no reported failure.
Poll this same handle, do not restart on timeout, and do not edit application/test
source while live. Documentation-only changes do not change source under test.
After terminal, fix actual failures without weakening assertions; get a complete
passing combined invocation. Then record exact broad evidence/commit checkpoint
and continue immediately to W3 phase 2 fullscreen MRT diffuse/specular lights,
light-source registry, deterministic 16-light budget, rig integration/debug.
W3 phases 2–6 and Part 4 are required and pending; goal remains active.
No develop push until full completion; immutable pre-refactor retained.
Prior turn made concrete progress (geometry implementation/tests/commit); this
handle may legitimately span goal continuations. No other browser jobs are live.
## W3 phase 1 focused checkpoint green — broad browser next

Final 1.68.0 geometry implementation has strict npm run typecheck PASS and all
401 units PASS. Exact 12-file affected browser command passed all 47 in 1.9m,
exit 0; phase1-native-browser.log under tmp/lighting-refactor. Session 72734 closed.
Files: geometry-buffer, lighting-mrt, pixi-backend/scenes/catalogue/films,
material-colour, graphics-errors, presentation-readiness, game,
runtime-checkpoint-fixtures, changelog; config playwright.rendering-v2.config.ts
and --trace retain-on-failure. Real target/depth/surface/albedo/cutoff/clip/normal
values, below-cutoff forward translucency, source/target ownership, restore
material reupload, missing-MRT error and actual debug views are covered.
Native title debug screenshots were visually inspected after waiting for startup
completion and the painter's completed lightingFrameView metadata. No assertion
or timeout was weakened; midpoint depth now has explicit 8-bit rounding.
No live process remains at this checkpoint. NEXT: run the complete combined broad
browser invocation with source fixed, save phase1-broad-browser.log and record its
exact live handle. Do not begin phase 2 until the broad check finishes green.
Then implement light accumulation/registry/16-light ranking and rig/debug, followed
by the remaining mandatory W3 phases and Part 4. No early develop push.
External generation scripts already applied/non-idempotent; do not rerun.
## W3 phase 1 implementation — focused browser verification live

Version 1.68.0, lock/title/changelog aligned. Native painter-owned G0/G1/G2 targets,
geometry material shader, default/per-material alpha cutoff, last-writer data,
borrowed current texture/generation hook and session-only lighting debug views
implemented. Resize/restore/dispose own independent surfaces; MRT is required at
startup and restore. Existing forward shader remains pending W3 phases 2–4.
Strict npm run typecheck PASS; final node --test tests/unit/*.test.mjs all 401 PASS.
Logs tmp/lighting-refactor/phase1-{typecheck,unit}.log.
Focused 12-file browser invocation is LIVE in unified exec session 72734; log
 tmp/lighting-refactor/phase1-native-browser.log, latest observed 23 passing cases.
Poll exact handle; keep application/tests fixed until terminal, do not restart on
observation timeout. New five-case geometry checks cover exact channels, cutoffs,
last writer, preserved forward translucency/clips, rotation/nonuniform/normalY,
independent targets/source destruction, restored material pixels, missing MRT,
completed debug frames and session-only state. Native MRT probe is also included.
Screenshots use testInfo.outputPath and actual rendered views were inspected.

A rendering regression was fixed: Pixi clear does not bind its supplied target,
so clear after MRT had erased G data and accumulated the view alpha. Explicit view
bind+clear restores original material/film assertions. Mesh GL blend state is
restored alongside container blend mode. Restore tests now issue restoration in
another browser task after loss dispatch; timeout/assertions unchanged. Zero-depth
8-bit tie is explicitly encoded, rather than weakening byte assertions.
NEXT on focused terminal: fix failures, record exact results, run required broad
browser verification with this source fixed, finalize phase-1 docs/audit/status
and commit green checkpoint. Only then proceed to W3 phase 2 light accumulation,
16-light registry/rig/debug. All later W3 phases and Part 4 remain required.
No develop push, profiling/benchmarks, native/store builds or real-save changes.
Generation scripts in the external workspace are applied and non-idempotent;
do not rerun them. Ignored W3 audit tmp/lighting-refactor/audit.md.
## W3 audit checkpoint — native MRT verified, G-buffer next

W1/W2 complete under the explicit pre-existing Android failure exception below.
W3 audit started in tmp/lighting-refactor/audit.md: actual seven composer passes,
material/light producers, painter/surface ownership, CPU foliage and migration plan.
No application lighting implementation has changed yet; version remains 1.67.0.
Native Pixi 8.22 MRT is verified in real Edge with one RenderTarget and three GLSL
layout outputs: complete framebuffer, exact red/green/blue attachment pixels,
three attachments, adequate queried limits and zero GL error. Final test command:
 npx playwright test tests/browser/lighting-mrt.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure
PASS one case in 2.4s, exit 0; tmp/lighting-refactor/mrt-capability.log. No live process.
Test helper tests/helpers/pixi-mrt.ts lets Vite resolve installed package imports.
Use explicit #version 300 es in vertex/fragment; Pixi detects GLSL mode from the
fragment header. Non-destructive target binds require clear:false. No raw helper
or alternate backend is required. Initial probe authoring errors were corrected;
no exact pixel/assertion/error/completeness check was relaxed.
NEXT: complete W3 pre-reading/producer lifetime audit, then phase 1 painter-owned
G0/G1/G2 geometry targets and testing-tools debug views with alpha cutoff,
normal transform/depth/material flags and full resize/restore/disposal tests.
Do not jump to light budget in place of G-buffer. All W3 phases and Part 4 remain.
Keep develop unpushed until complete; no profiling/native/store/real-save work.
## W2 complete — begin W3 lighting audit

Final implementation source d87e344, version 1.67.0. No live verification process
remains. Exact final commands/results (logs under tmp/runtime-refactor):
- node --test tests/unit/*.test.mjs: all 401 PASS (w2-final-unit.log).
- npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure:
  all 254 PASS in 14.0m, exit 0 (w2-final-broad-browser.log), session 36134 closed.
- npm run test:production: strict/build and all four PASS in 21.0s, exit 0
  (w2-final-production.log), session 68148 closed.
- ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android with npm run test:android-web:
  strict/build succeed, four PASS/one FAIL in 21.9s, exit 1 (w2-final-android.log),
  session 42466 closed. Unchanged offline.spec.ts:55 immediate pause/reload assertion
  receives screen instead of /on/, identical to the proven immutable pre-refactor
  result in tmp/asset-compaction/android-recovery-baseline.log. Record this explicit
  goal exception, do not call Android green or weaken the test.

W2 report docs/development/runtime-refactor-results.md records actual requirement
mapping, intentional behavior, verification, phone checklist and future opt-in captures.
W1 and W2 complete. NEXT: read W3 source/pre-reading, write
 tmp/lighting-refactor/audit.md with actual composer/material/light producers,
Pixi 8.22 MRT findings, foliage paths and migration plan; implement W3 phases in
strict order with focused checks/commits. W3 and Part 4 are fully pending.
No develop push until full completion; pre-refactor remains the restore point.
No profiling/benchmarks, native/store builds, real saves or lit-only worktree edits.
## W2 final gate preparation: version 1.67.0

Requirement-by-requirement audit is in tmp/runtime-refactor/w2-final-requirement-audit.md
and docs/development/runtime-refactor-results.md. Actual source/controller/table/
registry/event/composer/checkpoint/renderer evidence inspected, no new ownership
gap identified. Version/lock/title/changelog aligned to 1.67.0; current architecture/
rendering maps consolidated; behavior report/manual phone checklist/future opt-in
captures written. W3 and Part 4 remain fully required.
Explicit draw-haptics gap closed in presentation-readiness.spec.ts: actual combat
haptic and direct navigator vibration calls are counted and asserted zero through
repeated draw and readiness settlement, alongside original run/RNG/save assertions.
`npx playwright test tests/browser/presentation-readiness.spec.ts tests/browser/changelog.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all two PASS in 10.3s (w2-final-isolation-changelog.log), terminal exit 0.
Formatting-only test/html edits followed this focused run; broad final must cover them.
`node --test tests/unit/*.test.mjs`: final 1.67.0 all 401 PASS (w2-final-unit.log).
Logs under tmp/runtime-refactor. Final combined broad browser, test:production
(strict+verification build included) and Android-web gates remain pending.
Do not start W3 or push develop until W2 gates and checkpoint commit complete.
Version/docs generation script is non-idempotent and already applied.

## Latest green checkpoint: obsolete session adapter cleanup

Separately deleted 22 runtime/session.ts getters absent from the compiler-resolved
SessionBindingViews intersection after all session UI moves were committed:
$, applySeal, hud, renderHp/Lives, setScore, toast, saved buttons/screens/shrine,
apparel motion, hints, presentationState, audioInit, leaves, trial objective,
runResults, best line, renderGameOver, armory-new and pause screen. Actual UI
listeners retain their own typed capabilities. Compiler audit is
 tmp/runtime-refactor/session-capability-cleanup-audit.json.
`npm run typecheck`: PASS (session-capability-cleanup-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(session-capability-cleanup-unit.log); logs under tmp/runtime-refactor.
`npx playwright test tests/browser/game.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/guided-lessons.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 10 PASS in 29.6s (session-capability-cleanup-browser.log), terminal exit 0.
No live browser process remains. Actual source audit now finds no direct DOM
writes in game modules; frame/scene runtime orchestration and guided UI adapter
are relocated. This is not proof of full W2 completion.
Next: requirement-by-requirement W2 audit against main-goal.md and actual source/
scenario/checkpoint/isolation/state-machine/registry/composer/renderer evidence;
fix any gaps, clean the final architecture/rendering ownership map, finalize
behavior report/manual phone checklist and synchronize 1.67.0 version/lock/title/
changelog. Run final full units, broad browsers, test:production and Android-web
before W3 begins. Earlier combined broad runs are stale and are not a final pass.
All W3 and Part 4 remain required; develop remains unpushed.
Cleanup script applied once; do not rerun stale non-idempotent generators.

## Latest green checkpoint: guided lesson UI adapter relocation

Moved guided-lessons.ts and its CSS from game/onboarding into ui/wiring; audio
wiring and the browser fixture import the actual new owner. guided-state.ts
retains deterministic progress, freeze and input-consumption decisions. Exact
adapter source parity after relative-import normalization PASS is recorded in
 tmp/runtime-refactor/guided-ui-move-parity.log; no rules/copy/style change.
`npm run typecheck`: PASS (tmp/runtime-refactor/guided-ui-move-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(tmp/runtime-refactor/guided-ui-move-unit.log).
`npx playwright test tests/browser/guided-lessons.spec.ts tests/browser/game.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all six PASS in 29.0s (tmp/runtime-refactor/guided-ui-move-browser.log), exit 0.
No live browser process remains. Results ownership and runtime frame/scene
relocation are green in the preceding checkpoints.
Next: separately delete compiler-audited stale session view/binding capabilities;
then perform requirement-by-requirement W2 audit, final scenarios/checkpoints/
units/broad browsers/production/Android-web, docs/behavior report/phone checklist
and version 1.67.0. All W3/Part 4 remain required; develop is unpushed.

## Latest green checkpoint: runtime frame/scene orchestration relocation

Physically moved frame-simulation.ts and scene-flow.ts from game/session to runtime.
Only relative imports/callers changed; normalized exact source parity PASS is
recorded in tmp/runtime-refactor/session-orchestration-move-parity.log. Rule and
cosmetic dispatch order, renderer readiness, stale requests, pending callbacks,
paused adoption and post-presentation clock reset are unchanged.
`npm run typecheck`: PASS (session-orchestration-move-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(session-orchestration-move-unit.log); logs under tmp/runtime-refactor.
`npx playwright test tests/browser/game.spec.ts tests/browser/scene-readiness.spec.ts tests/browser/scene-continuation.spec.ts tests/browser/cinematic.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 18 PASS in 1.1m (session-orchestration-move-browser.log), terminal exit 0.
No live browser process remains.
Next: move game/onboarding/guided-lessons.ts DOM/CSS adapter to UI; keep actual
lesson progress/freezes/input state in game/onboarding/guided-state.ts. Then
separate stale session adapter cleanup and full W2 requirements/gates/docs/version
1.67.0. All W3/Part 4 remain required; develop is unpushed.

## Latest green checkpoint: results presentation ownership

Results rules emit deeply frozen display/sequence snapshots and synchronous
resultCue/resultReady values. ui/wiring/results-feedback.ts owns DOM/game-over,
letterbox/hints, screen/HUD/best/buttons and sequence presentation. UI completion
and bonus actions forward sequence IDs to the actual result rule owner; rewards,
profile/store settlement, overReady, support rollback/claims and recovery remain
rules. Sequence action storage retains only the current sequence; stale callbacks
from a replaced result screen no longer enable the newer screen (intentional
lifetime correction recorded in the behavior log). Save keys/records unchanged.
Actual normal/daily/recovery/bonus tests prove listener isolation, deep snapshots,
disposal, rollback/once-only currency and current sequence readiness.
`npm run typecheck`: PASS (tmp/runtime-refactor/results-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 401 PASS
(tmp/runtime-refactor/results-feedback-unit.log).
Initial affected browser run: 15 PASS/one daily-label encoding failure; fixed UTF-8
middle dot without changing the existing assertion.
`npx playwright test tests/browser/game.spec.ts tests/browser/daily.spec.ts tests/browser/support-rewards.spec.ts tests/browser/death-presentation.spec.ts tests/browser/feature-plan-06.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
final all 16 PASS in 1.2m (tmp/runtime-refactor/results-feedback-browser-fixed.log),
terminal exit 0 confirmed. No live browser process remains.
Next actual source audit: game/session/frame-simulation.ts combines rule/cosmetic
frame dispatch; game/session/scene-flow.ts orchestrates renderer requests/DOM
readiness and rule continuations. Move these runtime orchestration owners to
runtime in a separate physical-move commit, preserving every statement/order.
Then separate stale session capability/adapter cleanup and full W2 requirements/
gates/docs/1.67.0. All W3/Part 4 remain required; develop is unpushed.
Result generation/fix/lifetime scripts are non-idempotent and already applied.

## Latest green checkpoint: run-start presentation ownership

Run-start emits frozen runStartCue/runModeHint/runFortune values; UI-owned
run-start-feedback.ts reacts to motion/effects/letterbox resets, hints, screen/
HUD/bossbar/score/seal, audio initialization and trial leaves. Rule controller
retains player pose/timing reset, seed/combat RNG, weather generation, modifiers,
profile identity/counters, checkpoint clearing, trial eligibility and scene/
encounter entry. Cosmetic actions retain original synchronous call boundaries.
Seven actual normal/Ronin/Blade/Zen/rush/daily/trial scenarios compare run/profile/
player/weather/ledger/gameplay RNG with listeners enabled/absent and test frozen
values/disposal. No assertion or timeout was weakened.
`npm run typecheck`: PASS (tmp/runtime-refactor/run-start-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 396 PASS
(tmp/runtime-refactor/run-start-feedback-unit.log).
`npx playwright test tests/browser/game.spec.ts tests/browser/daily.spec.ts tests/browser/trials.spec.ts tests/browser/new-blessings.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 16 PASS in 1.7m (tmp/runtime-refactor/run-start-feedback-browser.log),
terminal exit 0 confirmed. No live browser process remains.
Next: results.ts UI/presentation ownership. Its direct DOM/renderGameOver,
letterbox/hints, screen/HUD/best/buttons and result sequence display must move;
retain overReady, reward settlement/profile/storage rollback and callbacks as
rules. Then separately delete stale adapter capabilities and complete W2 audit/
gates/docs/version 1.67.0. All W3 and Part 4 remain required; develop is unpushed.
The run-start generation script is non-idempotent and already applied.

## Latest green checkpoint: title/pause/resume UI ownership

Run-flow rules emit frozen runFlowCue values for seal/title/letterbox/best/pause/
trial-objective display and reuse existing sessionScreen/shrineOffers listeners.
ui/wiring/run-flow-feedback.ts owns actual display actions; runtime owns disposal.
Profile identity restoration, player animation reset, stage/title attract setup,
pause counters/secrets, teaching audio freeze, context-loss guard, clock reset,
quit checkpoint and result entry retain original synchronous boundaries.
Actual transition tests compare rules/profile/player with UI enabled/absent and
verify snapshots/disposal. Existing assertions and browser timeouts are unchanged.
`npm run typecheck`: PASS (tmp/runtime-refactor/run-flow-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 389 PASS
(tmp/runtime-refactor/run-flow-feedback-unit.log).
`npx playwright test tests/browser/game.spec.ts tests/browser/options.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/trials.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 27 PASS in 2.3m (tmp/runtime-refactor/run-flow-feedback-browser.log),
terminal exit 0 confirmed. The final runtime/session formatting-only edit
followed strict/unit verification and preceded this passing browser run.
No live browser process remains. Next: run-start and results actual UI/presentation
ownership; then separate stale adapter/capability cleanup, full W2 audit/gates/docs/
1.67.0; all W3 and Part 4 remain required. Develop remains unpushed.
The run-flow generation script is non-idempotent and already applied.

## Latest green checkpoint: saved-run UI ownership

Checkpoint restoration/capture now emits immutable display values; ui/wiring/
checkpoint-feedback.ts owns labels, boss bar, lives/score/HP, seal, HUD, saved
buttons, failure toast and continuation screen. Shrine continuation reuses the
existing shrineOffers listener with frozen filtered IDs. Rule/profile adoption,
weather-before-RNG restoration, phase adoption, clock reset, record format/save
keys and loading early returns retain their original boundaries.
New actual playing/boss/standoff/shrine tests compare run/profile/equipment/
weather/persistence/gameplay RNG with UI enabled/absent, preserve frozen snapshots
and verify disposal, failure order and silent loading exit.
`npm run typecheck`: PASS (tmp/runtime-refactor/checkpoint-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 388 PASS
(tmp/runtime-refactor/checkpoint-feedback-unit.log).
`npx playwright test tests/browser/game.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts tests/browser/scene-continuation.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 15 PASS in 1.0m (tmp/runtime-refactor/checkpoint-feedback-browser.log),
terminal exit 0 confirmed. No live browser process remains.
Next: remaining run-flow/run-start/results UI ownership, full W2 requirements
and gates, all W3 and Part 4. Develop remains unpushed; no approval is pending.
Do not rerun the non-idempotent checkpoint draft/resume scripts.

## Active implementation: domain runtime composition

Foundation/context lifetime is committed at a47566f. Strict checks, all 371 units
and all 254 combined browser cases pass in 14.1m; the unchanged eight-trial
encounter/reload case passes inside the full run. Logs: cached-views-regression-
typecheck.log, cached-views-regression-unit.log, cached-views-foundation-broad.log
under tmp/runtime-refactor. This supersedes the earlier foundation reload failure.

The domain composition is committed at f01fad7. Separate root import cleanup
removes 127 unused imports and leaves 129 lines. Strict checks, all 371 units and
all six startup/preview/disposal/scene-continuation browsers pass in 28.2s
(composition-imports-typecheck.log / composition-imports-unit.log /
composition-imports-browser.log). Root cleanup is committed at 2c03768.
Runtime owners: foundation, presentation, UI base, profile/equipment rules, combat
wiring, scene continuation, phases, sessions, menu/controls, frame/viewport and
synchronous reaction wiring. Renderer-dependent frame-bindings/startup moved
from game/session to runtime; no presentation/rendering imports remain in src/game.
Plain record shape, rule/RNG ownership and the three cached live projections are
retained. The isolated draft and semantic/reference audits remain under
tmp/runtime-refactor; original generators are non-idempotent.

Parsed probes migrate 24 hooks in 20 files (89 references); harness fields,
assertions and deadlines stay intact. Utilities needed only by injected probes
are imported into instrumented responses. The first focused invocation exposed
an eager run-flow read of refreshArmoryNew before controls existed. That run was
stopped (domain-composition-browser.log; terminal exit 1). Root menu/clock ports
now return stable forwarding callbacks, resolving later owners only when invoked.
Strict checks pass (domain-composition-deferred-typecheck.log). All 371 units
passed after the physical move (domain-composition-unit.log). Actual title/start/
pause/resume passes after the deferred callback repair
(domain-composition-startup-browser.log; terminal exit 0).

The unchanged 12-file focused browser invocation passes all 45 cases in 3.5m
(domain-composition-deferred-browser.log; exit 0). Strict checks and all 371 units
pass after the callback fix. The combined browser run completed with 253 passes
and one scene-continuation intercepted module-request ECONNRESET during reload
(domain-composition-broad.log; exit 1). The unchanged failing case passes in 13.0s
on focused recheck (domain-composition-scene-continuation-recheck.log; exit 0).
The failure trace is preserved in composition-scene-continuation-failure-trace.zip.
This is not a full passing combined-run claim or a proven pre-existing failure.
Targeted/actual scenario coverage is green for the internal composition checkpoint;
the fully passing broad W2 checkpoint remains required before lighting.

Original composition/import apply manifests are now stale; preserve current source.

Wave/knife/missed-swipe cosmetics and wave/knife profile progression now use
immutable value events in actual source. Strict and all 374 units pass
(wave-events-typecheck.log / wave-events-unit.log). The exact six-file browser
command passes all 22 cases (wave-events-browser.log): game, new-blessings,
trials, scene-readiness, scene-continuation and features, with rendering-v2
configuration and retained failure traces. Assertions/deadlines are unchanged.
Knife persistence now precedes cosmetics within the same call; wave preparation
and deferred profile settlement keep their original boundaries. Behavior changes
are recorded in tmp/runtime-refactor/behaviour-changes.md and architecture docs.

Wave event checkpoint is committed at f53dc44. Challenger entry/twitch/draw/exit
cues are now applied through presentation/standoff-cues.ts. Strict and all 375
actual units pass (standoff-cues-typecheck.log / standoff-cues-unit.log). The exact
browser command with feature-plan-06, runtime-checkpoint-fixtures and tanto,
rendering-v2 configuration and retained traces passes all 11 cases
(standoff-cues-browser.log). No source was changed during either browser run.
Actual deferred entry/cut/exit isolation proves frozen snapshots, disposal and
identical run/profile/combat RNG when cosmetic cues are absent. Entry checkpoint,
transition/wave continuation and cosmetic values retain their original order.

Standoff cue checkpoint is committed at f1d0e82. Boss entry/health/ready/trait,
draw/recovery/counter/heal/deflection/opening hint cues now use frozen events and
presentation/boss-cues.ts. Boss state table has emission instead of sound/flash
callbacks. Guided lesson actions remain rules because they freeze/gate combat.
Strict/all 379 units pass (boss-cues-typecheck.log / boss-cues-unit.log), including
four actual base/Twin/spear/Mirror deferred/recovery/Counter/Breath/afterimage/
deflection/victory fights proving listener isolation, one-time save and disposal.
Exact focused browser command: trials, feature-plan-06, scene-readiness, tanto,
game with rendering-v2 configuration and retained failure traces; all 21 pass
(boss-cues-browser.log). Original assertions/deadlines remain unchanged.

Boss cue checkpoint is committed at ed6cc8a. Grunt bell/feint/bark now emit
frozen values from the behaviour table; presentation/grunt-cues.ts owns sounds.
Strict/all 380 actual units pass (grunt-cues-typecheck.log / grunt-cues-unit.log).
Exact browser command: game, new-blessings, runtime-checkpoint-fixtures with
rendering-v2 configuration and retained traces; all 12 pass in 41.9s
(grunt-cues-browser.log). Actual seeded feint/Shiba/Still/late damage test proves
identical run/profile/combat RNG, frozen values and listener disposal.
Timers, switch-frame pose, pet state and damage remain in the grunt rules.

Grunt event checkpoint is committed at 3a389ee. Shrine/trial rule phases now emit
frozen values; profile progression and UI feedback have dedicated listeners.
Shrine rule view is narrowed; obsolete shrine HUD/screen/toast/offers adapters
were removed from runtime phase binding as required by that typed contract.
Rule RNG, modifiers, checkpoints, continuation and trial profile/RNG restoration
retain their original boundaries. Trial progression installs before UI during
runtime session construction and resolves current owners lazily.
Strict/all 383 units pass (shrine-trial-events-typecheck.log /
shrine-trial-events-unit.log). Actual seeded Crossroads/Twin/reroll and natural
Quiet Blade combat/completion/failed retry prove profile/UI isolation, frozen
snapshots, once-only settlement, original save order and listener disposal.
Exact browser command: trials, feature-plan-06, new-blessings,
runtime-checkpoint-fixtures, game with rendering-v2 config and retained traces:
all 23 pass in 2.2m (shrine-trial-events-browser.log). Assertions/timeouts unchanged.

Shrine/trial ownership checkpoint is committed at 6b66d72. Separate capability
cleanup is now applied: all prepared source hashes matched before mutation.
Compiler-symbol audit removes 209 unused captures/58 obsolete view fields;
typed runtime owners lose 35 unused adapters and 13 caller action getters.
runtime/phases no longer takes presentation; standoff cosmetics have their own
view and trial UI action ports use TrialFeedbackViews. Twelve unused imports and
one unused stage lookup are removed. No rule branch, RNG or checkpoint change.
Final strict/all 383 units pass (phase-capability-cleanup-final-typecheck.log /
phase-capability-cleanup-final-unit.log). Earlier same-stage strict/383 units and
all 10 game/scene-continuation/runtime-checkpoint-fixtures browsers pass in 33.0s
(phase-capability-cleanup-browser.log). The final change after browsers only
deletes the unused standoff stage lookup/import. No source changed during browsers.
Audits under phase-capability-cleanup: original field/capture/hash audit.json,
runtime-audit.json, caller-audit.json and import-audit.json (eleven imports there;
the last STAGES import was removed afterwards). Original prepared hashes/scripts
are now stale/non-idempotent; never reapply them.

Next: finish the remaining session/UI ownership against the full W2 requirements.
Actual inspection still finds direct DOM/screen/cosmetic orchestration in
run-start, run-flow, results and checkpoint-flow. Results directly updates DOM
fields and renders game-over; checkpoint adoption writes encounter labels/bar;
run-start directly clears effects/screens and displays mode hints; run-flow
directly controls title/resume screens. Do not claim full ownership from the
129-line root or import scan. Move their UI/presentation work into actual owning
listeners/adapters while preserving transactions, guided input freezes, player
animation mutation, scene continuation, RNG, profile settlement and checkpoints.
Then do the requirement audit and final W2 gates: scenario/checkpoint/full units/
broad browser/production/Android-web, 1.67.0 version/changelog, architecture/
behavior log/phone checklist. All W3 and Part 4 remain required.
Develop is unpushed; push once only after full completion. No profiling/benchmarks,
store builds, real-save edits or lit-only changes. No live browser process remains.

## Latest green checkpoint: Damage and companion event reactions

Damage/death, Tanto/foxfire saves and Daruma/Phoenix/support revival feedback
now react to immutable value events in presentation/damage-feedback.ts. Rules
retain lives/combo/attacker mutations, hit stop, slow motion, trial failure,
checkpoint boundaries and encounter restart. Same-call presentation ordering is
recorded in tmp/runtime-refactor/behaviour-changes.md and architecture/decision docs.
Actual enabled/disabled listener scenarios prove run/profile/combat RNG isolation.
`npm run typecheck`: pass (damage-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 370 pass (damage-feedback-unit.log).
`npx playwright test tests/browser/death-presentation.spec.ts tests/browser/support-rewards.spec.ts tests/browser/game.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/scene-readiness.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 17 pass in 1.4m (damage-feedback-browser.log; terminal exit 0 confirmed).
Combined broad completed: 250 pass, four stale edition-fixture failures in 14.8m
(damage-feedback-broad.log; terminal exit 1). Both fixtures still replaced the
removed local edition declaration, so their override silently left Web access.
The route hooks now assert and replace the actual constructor edition input.
`npm run typecheck`: pass (edition-hook-typecheck.log).
`npx playwright test tests/browser/editions-mastery.spec.ts tests/browser/premium.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 11 pass in 1.2m (edition-hook-browser.log; terminal exit 0).
Original access/purchase/revocation/viewport assertions and timeouts remain.
Full combined verification must be rerun after the upcoming context move.

## Previous green checkpoint: Session state and browser service owners

game/session/runtime-state.ts owns eleven plain mutable lifetime fields: template,
ledger, milestones/reveals, checkpoint/offers, clocks, knocks, reward flow and crest
reveal flag. game/session/state-view.ts forwards only explicit named fields into
nine binding providers, preserving replacement identities and lazy service getters.
platform/runtime-preferences.ts owns settings/access/haptic capabilities and browser
access flags. ui/wiring/audio.ts owns audio/guided/mute wiring. Construction calls,
save keys, checkpoint records, gameplay RNG and settings application remain intact.
Semantic reference audits are in tmp/runtime-refactor; source moves use actual
records rather than global text substitution. New units exercise actual run entry
against the session owner, deferred service reads and capability isolation.
`npm run typecheck`: pass (state-services-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 368 pass (state-services-unit.log).
`npx playwright test tests/browser/options.spec.ts tests/browser/daily.spec.ts tests/browser/trials.spec.ts tests/browser/feature-plan-06.spec.ts tests/browser/scene-continuation.spec.ts tests/browser/secrets.spec.ts tests/browser/cinematic.spec.ts tests/browser/support-rewards.spec.ts tests/browser/death-presentation.spec.ts tests/browser/class-lifecycle.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 44 pass in 3.7m (state-services-browser.log; terminal exit 0 confirmed).

Separate import cleanup: twelve unused browser/state constructor imports removed.
Compiler-symbol audit retained live browser instrumentation. Strict check and all
368 units pass (state-services-imports-typecheck.log and state-services-imports-unit.log).

Latest passing combined broad:
`npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 254 pass in 14.0m (frame-startup-broad.log; terminal exit 0 confirmed).
That invocation covers frame/startup moves, unused import cleanup and corrected
Options fixture, and predates the latest state/service ownership batch.

## Completed ownership and important evidence

W1 is complete and committed (5406e90), with layout-preserving compact planes,
optional emissive and exact data maps. Tight repacking stays cancelled. See
docs/development/asset-compaction-results.md and preserved verification below.

W2 WebGL2-only startup/recovery, typed context/events, ordered seven-layer composer,
UI/session/phase owners, actual grunt/boss/player tables and behaviour registries,
companions, profile policy/equipment/progress, frame scheduling and artwork startup
are implemented. Damage/companion/kill/combo/score/parry/block and successful boss/standoff feedback
react to immutable event values. Rules own outcomes and gameplay RNG. Runtime
dimensions, mutable profile identity and remaining service/action projections still
need genuine composition reduction. See overview.md and refactor-decision-log.md.

Actual-API scenarios drive daily/trial entry/completion and wrong swipe damage,
normal/Ronin waves, rush/boss fights, standoff/shrine/death/results. Bounded winning
and missed-parry/recovery paths visit every reachable boss state; mirror has no
feint. Fixed-date daily/repeated trial seed assert profile isolation and once-only
settlement. Fixtures resolve current RNG/profile ports (c55acea; 365 units before
new state-view tests). Checkpoint compatibility fixtures and round trips remain.

Controlled unchanged pre-refactor proofs document first support failed-save retry,
the intentional Twin three-badge fixture, and stale scene continuation on checkpoint
adoption. Fixes and real browser/headless regressions are committed. The previous
combined run had 253 pass/one paused Options snapshot race in 14.0m. Held actual
renderer completion on pre-refactor reproduces checkpoint/RNG mutation while state
stays paused (paused-options-baseline.log; original equality assertion fails).
The fixture now waits for ready scene and actual wave configuration before freezing
an encounter; original equality/timeouts remain, intentional paused scene adoption
remains separately tested. Corrected full254 run above proves combined coverage.

## Resume here; all remaining work is required

Finish genuine composition reduction: root is 1606 lines, far from the approximately
200-line target. Consolidate remaining profile identity, geometry/equipment colour,
scene loading state and explicit context/service/action projections into their true
owners. Remaining enemy/player helpers, secret/shrine/result view callbacks and
wave/boss reactions need owning orchestration/presentation modules. Do not
rename the remaining monolith. Preserve plain records and both random streams.
Keep root BLESS_BY/bossShownDirection and artworkReady instrumentation until actual
browser hooks migrate. Applied drafts are non-idempotent; regenerate isolated
previews from current source rather than overwriting with old copies.

After complete W2 implementation: scenario/checkpoint/full unit/broad browser,
test:production and Android web gates; docs/behaviour report and phone checklist;
minor 1.67.0 with lock/title/changelog synchronized and committed.
W3 is entirely pending: audit/read APIs, MRT G-buffer/light pre-pass/composite,
16 lights/PBR/masks/old shader removal, instanced grass/leaves, event lights,
half-resolution/extension hooks; all ordered gates/docs and minor 1.68.0.
Do not implement W3 before W2 finishes. Part 4: final exact checks/report, byte
results/future opt-in captures, completion status/report commit, ONE develop push
and verified pushed hash. No partial completion claim or early develop push.

## Execution rules

Preserve source while browser verification runs. Keep physical moves, behavior
changes and deletions in separate commits. Assertions/tolerances/timeouts are not
loosened. Named-pipe TS7 and repository writes require elevated execution in this
session; the goal authorizes them. Disposable files live under ignored tmp.
Existing baseline has a node_modules junction; do not recursively delete through
it. Prepared lighting is borrowed. No profiles or performance suites; ordinary
browser performance.spec.ts exercises functional lifecycle and is permitted.

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

