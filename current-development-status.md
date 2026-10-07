# Rendering, assets and runtime refactor in progress

Complete all three workstreams in `main-goal.md` strictly in order, then Part 4
verification/report and one develop push. No profiles, benchmarks, store builds,
real-save changes or modifications of `codex/lit-rendering-only`.

Restore point: immutable pushed `pre-refactor` at `ad353b3`. Work is directly on
develop, unpushed. Current version 1.66.7. All W2/W3 work remains required.

## Current: W1 cleanup complete, broad gate running

- Audit: `tmp/asset-compaction/audit.md` and audit.json; all 86 families have exact
  surface/scalar equality, 78 emissive maps are zero. Removed 602 generated PNGs
  in isolated deletion commit `9e31acc`. Original 86 authoring PNG hashes are
  intact. No resizing/repacking/geometry changes.
- Compact additions: `7a3f420`, migrated consumers/catalog: `069fca6`. Runtime
  uses 352 compact files including 180 data planes and eleven lossless PNG
  exceptions; all shrink. Missing emission is zero, no scalar dependencies.
- Final apply `node scripts/assets/compact.mjs --apply`: 602 changes;
  repeat: zero changes. Logs final-cleanup.log / final-repeat.log under audit tmp.
- Six Python compaction tests, four focused Node utility tests, all 252 full units,
  strict TypeScript, all 352 raw browser image comparisons, and all 34 focused
  rendering/material/asset/Canvas browser checks passed. Focused log:
  `tmp/asset-compaction/migrated-focused-browser.log`.
- `npm run test:production`: four passed after final cleanup; log w1-production.log.
- `ISSEN_ANDROID_BUILD_DIR=tmp/.verification-build-android npm run test:android-web`:
  four passed, encounter-reload assertion failed. The same original assertion also
  fails on the untouched restore-point Android web build, proved in an isolated
  preview/config. Logs w1-android-web.log, android-recovery-recheck.log,
  android-recovery-baseline.log. No tolerances/assertions changed. The initial
  baseline config attempt had the wrong server cwd; corrected run proves failure.
- Broad command `npx playwright test --config playwright.rendering-v2.config.ts`
  is live. Log `tmp/asset-compaction/w1-broad-browser.log`, execution session 18225.
  Poll actual terminal to establish completion; do not start a duplicate or edit
  runtime/version/changelog while it is running. Production/Android sessions are
  terminal. Baseline proof session 45414 may need final terminal poll.
- Matched builds: detached `pre-refactor` checkout under
  `tmp/asset-compaction/restore-baseline`, dependencies linked, source clean.
  `tmp/asset-compaction/byte-results.json` records source runtime 266,530,086 to
  120,472,123 bytes; checked texture tree includes 61,352,478 authoring bytes.
  Web bundle 261,053,490 to 120,505,485; Android web 284,964,042 to 144,388,949.
  Unsigned ZIP projections 295,487,341 to 158,550,019 using an identical frozen
  debug native shell. These are estimates, not built/installable APKs. No dist,
  native release/store build or stale APK was modified.
- Refreshed 83 pack README links preserving recipes/provenance; standard asset
  docs and Android tmp-output override are prepared. No W1 version bump yet.

## Next steps

1. Finish the live broad gate, fix regressions under goal decision rules. Record
   exact result; do not claim success from partial logs.
2. Commit green Android tmp-output override separately from asset documentation.
   Check refreshed README idempotence/links. Finish byte/oversized-map report and
   W1 audit/report documentation. PNG exceptions are a recorded conservative fork.
3. After broad gate, bump patch to 1.66.8, package lock/title version/changelog
   `Smaller download`, repeat affected production/Android version checks. Complete
   W1 checkpoint/handoff commit only once all W1 requirements are accounted for.
4. Immediately begin W2 audit and ordered phases, then W3 and Part 4. Never push
   develop until the full goal/report/final gates are done. No approval gates.

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
