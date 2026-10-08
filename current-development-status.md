# Rendering, assets and runtime refactor in progress

Complete all three workstreams in main-goal.md strictly in order, then Part 4
verification/report and one develop push. No approval gates. No profiles,
benchmarks, store builds, real-save changes or lit-only worktree modifications.
Restore point: immutable pushed pre-refactor at ad353b3. Work is directly on
develop, unpushed. Version 1.66.8 with committed W1 Smaller download notes.

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

Next: apply the prepared separate capability cleanup under tmp/runtime-refactor/
phase-capability-cleanup. audit.json contains current source hashes and prepared
filenames for boss/standoff/waves/trials and standalone standoff-feedback type.
Compiler symbols identify 209 unused destructured captures and 58 obsolete
BossViews/StandoffViews/TrialSessionViews fields. Preparation does not mutate
actual source. Check ALL source hashes before applying; adapt runtime/phases and
runtime/session to the narrower views, remove now-unused imports separately in
this deletion-only cleanup, format affected source, and verify. Do not resurrect
old cosmetic ports to satisfy compilation. No live browser process remains.

Then finish W2 requirement audit and final gates: scenarios/checkpoints/full
units/broad browser/production/Android-web, 1.67.0 version/changelog, final
architecture/behavior log/phone checklist. Review session display orchestration
in run-start/run-flow/results/checkpoint-flow against ownership requirements;
an import scan alone is insufficient. All W3 and Part 4 remain required.
Develop is unpushed; push once only after full completion. No profiling/benchmarks,
store builds, real-save edits or lit-only changes. Old preview sources are stale;
generation/apply scripts are non-idempotent. Preserve the current authoritative
source rather than copying whole previews.

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

