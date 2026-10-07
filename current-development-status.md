# Rendering, assets and runtime refactor in progress

Goal: complete all three workstreams in `main-goal.md`, in order, then final verification and one push of `develop`. No performance runs or profiles. Preserve `codex/lit-rendering-only`, authoring artwork, recipes, provenance and `issen.*` compatibility.

Restore point: `pre-refactor` at `ad353b3`, pushed successfully. Local `develop` matched `origin/develop` and was clean before work began. Do not modify the restore branch or push develop until Part 4 passes.

## Current checkpoint: W1.0 audit and W1.1 conversion tool

- Audit completed in `tmp/asset-compaction/audit.md` and `audit.json`: 86 families, all scalar channels exact, 78 zero-emission maps. Exact scalar deletion saves 63,900,172 bytes; zero-emission deletion saves 8,365,453 bytes. These are encoded source savings, not GPU memory measurements.
- Source PNG inventory totals 271,253,993 bytes excluding Play Store. Existing dist/APK outputs are stale and are not verification evidence.
- Added `scripts/assets/compact.mjs`, Pillow helper and five tests. Tool preserves atlas dimensions, exact data, alpha and colour tolerances, records hashes/actions/bytes, retains authoring PNGs and backs up generated inputs before deletion. A second run is a no-op.
- No actual runtime conversions or deletions applied yet. Runtime version remains 1.66.7; bump patch at W1.5.

Verification (exact commands):

- `python scripts/assets/tests/compact.test.py` with a Pillow-enabled interpreter: all five tests passed (zero-emission alpha semantics, scalar equality/mismatch, exact data, source retention, deletion and idempotence).
- `npm run typecheck`: passed.
- `node --check scripts/assets/compact.mjs`: passed.

W1.2/W1.3 preparation now includes the generated catalog (only diffuse/normal/surface and optional emissive), optional emissive loader and removal of direct scalar-map dependencies from player/enemy loaders. No runtime conversions applied yet. New loader/catalog unit tests: 3 passed. Focused browser command: npx playwright test tests/browser/asset-materials.spec.ts tests/browser/material-selection.spec.ts tests/browser/material-colour.spec.ts --config playwright.rendering-v2.config.ts: 3 passed. Strict TypeScript passed after these changes. Next: complete export/install integration, sword optional emission and startup material exclusions before applying compaction. Test the generator and loaders, then apply conversion with `ISSEN_PYTHON` pointing to Python 3 with Pillow >=12. Backups go under ignored `tmp/asset-compaction/originals/`. Redirect existing source and map URLs to aligned WebP outputs while retaining authoring originals outside startup's runtime glob. Keep deletions, URL migration and behaviour changes in separate commits. Validate every converted plane in-browser and run the required W1 focused suites, Canvas comparison, production and Android web checks. Log any tolerance fork. Do not loosen tests.

Decision log: `docs/development/refactor-decision-log.md`.

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
