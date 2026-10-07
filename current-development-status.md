# Rendering, assets and runtime refactor in progress

Complete all three workstreams in `main-goal.md` strictly in order, then Part 4
verification/report and one develop push. No profiles, benchmarks, store builds,
real-save changes or modifications of `codex/lit-rendering-only`.

Restore point: immutable pushed `pre-refactor` at `ad353b3`. Work is directly on
develop, unpushed. Version **1.66.8**, with `Smaller download` release notes.

## W1 complete; W2 presentation complete; UI extraction next

W2.0 baseline harness: 637a4de. W2.1 native-only surfaces/materials/films/paths
and obsolete comparison deletions are complete. Context/events foundation is
committed (3d1f26f); it introduces explicit gameplay/service and presentation
contracts. No gameplay events are emitted yet: wire them during phase/rule moves.
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
No intentional gameplay changes (tmp/runtime-refactor/behaviour-changes.md).
game.ts still has about 4,141 lines; composition-root reduction is NOT complete.

Latest checkpoint: UI secrets ownership moved without intentional behavior changes.
Strict types passed; all 274 units passed (ui-secrets-unit.log).
`npx playwright test tests/browser/secrets.spec.ts tests/browser/secret-recovery.spec.ts tests/browser/cinematic.spec.ts tests/browser/runtime-checkpoint-fixtures.spec.ts --config playwright.rendering-v2.config.ts`:
all 15 passed (ui-secrets-browser.log; terminal completion confirmed).
Continue the ordered UI cluster, then run-flow/router/phases. Full W2/W3 and
Part 4 remain pending; do not push develop yet.

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
cluster is green. No process remains. Continue UI extraction now.
UI dependency audit/plans are under tmp/runtime-refactor/audit-current.{json,md}
and ui-extraction-plan.md, preserving immutable audit.json/audit.md.
Draft UI screen/secret move scripts exist outside the repository and have NOT
been executed. After a green broad checkpoint, continue ordered UI extraction. Cosmetic update call
order is preserved: clock, ambient, existing rule update, transition, camera.
Then ordered UI/screens/admin/secrets, run-flow/router/phases, kill rule/listeners,
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
