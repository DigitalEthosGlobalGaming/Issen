# Rendering, assets and runtime refactor in progress

Complete all three workstreams in main-goal.md strictly in order, then Part 4
verification/report and one develop push. No approval gates. No profiles,
benchmarks, store builds, real-save changes or lit-only worktree modifications.
Restore point: immutable pushed pre-refactor at ad353b3. Work is directly on
develop, unpushed. Version 1.66.8 with committed W1 Smaller download notes.

## Latest green checkpoint: Standoff success feedback events

Successful standoff cuts emit an immutable position/direction snapshot after committing the rule outcome. presentation/standoff-feedback.ts owns cut debris, rings, stamps, sound and haptics. Actual seeded combat has identical outcomes and gameplay RNG with the listener enabled or disabled.
`npm run typecheck`: strict types pass (standoff-feedback-typecheck.log).
`node --test tests/unit/*.test.mjs`: all 365 units pass (standoff-feedback-unit.log).
`npx playwright test tests/browser/feature-plan-06.spec.ts tests/browser/encounter-flow.spec.ts tests/browser/death-presentation.spec.ts --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 9 pass in 1.0m (standoff-feedback-browser.log; terminal exit 0 confirmed).
Logs are under ignored tmp/runtime-refactor. This checkpoint has focused live
coverage; the latest broad invocation predates this binding change.

Latest combined broad: `npx playwright test --config playwright.rendering-v2.config.ts --trace retain-on-failure`:
all 254 passed in 13.5m (phase-bindings-broad.log; terminal exit 0 confirmed),
covering seven-phase binding plus the checkpoint continuation fix.

## Completed ownership and important evidence

W1 is complete and committed (5406e90). Layout-preserving compact planes,
optional emissive and exact data maps are standard; tight repacking stays
cancelled. See docs/development/asset-compaction-results.md and commands below.

W2 WebGL2-only startup/recovery, typed context/events, seven-layer composer,
UI owners, all live phase controllers/router, checkpoint/run/trial/results
owners, kill/score/profile reactions, state-machine/behaviour registries,
actual grunt/boss/player tables and companion rules are implemented.
Native/equipment/environment/figure presentation, phased profile state,
active equipment/profile policy and frame dispatch have explicit owners.
Kill, combo/score, parry/block and successful boss-cut/victory cosmetics listen
to immutable value events. Seven phases share their typed construction provider.
Implemented binding/state/lifecycle owners: game/session/phase-bindings.ts, ui/wiring/menu-bindings.ts, game/session/session-bindings.ts, game/session/activity.ts, presentation/graphics-lifecycle.ts, presentation/viewport.ts.
See docs/architecture/overview.md and refactor-decision-log.md for exact ownership,
physical moves, separate fixes/deletions and prior verification checkpoints.

Support first-claim failed-save rollback is fixed and proved on unchanged
pre-refactor. The rush single-badge fixture now chooses a single blessing;
unchanged baseline seed proved Twin intentionally has three badges.
Checkpoint adoption now discards superseded scene continuation. Controlled real
renderer completion on unchanged pre-refactor reproduces the missing-wave
exception/null configuration (scene-continuation-baseline.log; exit 1). Actual
live and headless saved-wave/enemy/RNG regressions pass; broad coverage includes
the fix. Earlier natural probe was inconclusive and is superseded.
Behaviour changes remain in tmp/runtime-refactor/behaviour-changes.md for final
report: reaction ordering, first support retry, same-scene continue bug fix.

## Resume here; all remaining work is required

Run the combined broad browser suite for all recent bindings and feedback changes, then consolidate remaining composition owners and scenario API coverage.
Isolated session/activity/graphics-lifecycle/viewport/standoff-feedback previews
exist under tmp/runtime-refactor with strict logs. Except owners described above,
they are unapplied and have no live coverage. Regenerate each from current source
before applying; never overwrite the root with a stale preview.

Finish genuine composition reduction: root remains 2032 lines, far from
the approximately 200-line target. Move remaining session state/services and
presentation/UI/lifecycle bindings into their actual owners, finish remaining
standoff/damage/wave/boss reactions, and migrate residual scenario adapters to
actual new APIs. Keep plain checkpoint shapes and separate gameplay/cosmetic RNG.
Do not merely rename the remaining monolith. Keep root BLESS_BY and
bossShownDirection until their actual browser hooks migrate. Preserve artworkReady
assignment as test instrumentation anchor until explicit hook migration.

After W2 is fully implemented: scenario/checkpoint/full unit/broad browser,
test:production and Android web gates; docs/behaviour report and phone checklist;
bump minor to 1.67.0 with lock/title/changelog synchronized and commit.
W3 is entirely pending: audit/read APIs, MRT G-buffer/light pre-pass/composite,
16 lights/PBR/masks/old shader removal, instanced grass/leaves, event lights,
half resolution/extension hooks; all ordered verification gates, docs and minor
1.68.0. Do not start W3 implementation before W2 finishes.
Part 4: final exact checks/report, bytes/future opt-in capture comparisons,
completion status/report commit, ONE develop push and verified pushed hash.
No partial completion claim or early develop push.

## Execution rules

Preserve runtime source during browser verification. Small green commits;
physical moves, behaviour changes and deletions stay separate. Tests/tolerances/
timeouts are not loosened. Named-pipe TS7 and repository writes need elevated
execution in this session; authorization is the goal. Disposable output goes
under tmp. Existing baseline under tmp/asset-compaction/restore-baseline has a
node_modules junction; do not recursively delete through it. Prepared lighting
is borrowed. Do not run performance suites; ordinary browser lifecycle tests in
performance.spec.ts are functional checks and permitted.

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

