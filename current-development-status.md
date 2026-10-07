# Rendering, assets and runtime refactor in progress

Complete all three workstreams in main-goal.md strictly in order, then Part 4
verification/report and one develop push. No approval gates. No profiles,
benchmarks, store builds, real-save changes or lit-only worktree modifications.
Restore point: immutable pushed pre-refactor at ad353b3. Work is directly on
develop, unpushed. Version 1.66.8 with committed W1 Smaller download notes.

## Latest green checkpoint: Session state and browser service owners

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
are implemented. Kill/combo/score/parry/block and successful boss/standoff feedback
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
damage/wave/boss reactions need owning orchestration/presentation modules. Do not
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

