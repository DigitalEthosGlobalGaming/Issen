# Rendering, assets and runtime refactor in progress

Complete all three workstreams in `main-goal.md` in order, then Part 4 verification
and one push of `develop`. No profiles, benchmarks, store builds or changes to
`codex/lit-rendering-only`. Preserve authoring artwork, recipes, provenance and
`issen.*` compatibility.

Restore point: `pre-refactor` at `ad353b3`, pushed successfully from clean develop
after confirming it matched origin. Never modify that branch. Develop has not
been pushed; runtime version is still 1.66.7.

## Current work: W1 staged conversion is live

- W1.0 audit: `tmp/asset-compaction/audit.md` and `audit.json`. All 86 families
  have exact scalar-to-surface channel equality; 78 emissive maps are zero.
  Planned scalar deletion saves 63,900,172 bytes; zero-emission deletion saves
  8,365,453 bytes. No generated PNGs have been deleted in the real asset tree.
- Original scoped PNG inventory: 271,253,993 bytes. Existing dist and APK outputs
  are stale inventory, not matched verification evidence.
- Conversion tool, generated catalog and optional emissive loaders are implemented.
  Runtime player/enemy loaders no longer depend on scalar maps. Sword emission is
  optional, generated maps are excluded from startup retention, and installation
  compacts validated final packs before refreshing the catalog.
- The initial serial converter was intentionally stopped after confirming the
  task-owned process identity. Completed validated outputs and the manifest were
  retained. Bounded encoding workers are committed in `73562da`; workers only
  encode/read while the parent writes outputs and manifest entries in filename
  order. Default worker count is four, configurable with `ISSEN_ASSET_WORKERS`.
- The resumed converter is running:
  `node scripts/assets/compact.mjs --apply --retain-generated-png`.
  It uses a Pillow-enabled `ISSEN_PYTHON`. Log:
  `tmp/asset-compaction/conversion-workers.log`. Durable conversion records:
  `scripts/assets/compaction-manifest.json`. Original backups:
  `tmp/asset-compaction/originals/`. Original authoring PNGs remain checked in.
- The active execution handle is recorded in ignored
  `tmp/asset-compaction/conversion-process.json`. Poll that actual handle to prove
  whether it is live. A log/manifest/process record alone is not proof. Never start
  a duplicate converter. Only rerun its idempotent command after terminal status
  has been established. The previous serial execution is terminal.
- Early colour atlases required lossless WebP to satisfy the unchanged tolerances.
  No dimensions, alpha or data channels are relaxed. Early byte counts are partial;
  final source/bundle/APK projections must wait for conversion and verification.
- Missing emissive now follows the same coverage and blend mode as an explicit
  opaque zero map. This preserves additive emission and source-over occlusion.
  The new exact parity test covers seven blend modes. No gameplay changes.

## Verification already completed

Before staged asset conversion:

- `npm run typecheck`: passed.
- `npm test`: all 251 unit tests passed; log
  `tmp/asset-compaction/preparation-unit.log`.
- `npx playwright test --config playwright.rendering-v2.config.ts`: all 242
  browser tests passed in one uninterrupted run (11.1m); log
  `tmp/asset-compaction/preparation-browser.log`.
- `npm run test:production`: all four production tests passed; log
  `tmp/asset-compaction/baseline-production.log`. Verified baseline production
  bundle: 204,159,032 bytes total; 202,508,970 PNG/WebP bytes, recorded in
  `tmp/asset-compaction/baseline-build-bytes.json`.
- `node --test scripts/pbr/tests/cli.test.mjs`: all six exporter tests passed.

Subsequent utility/cache checks:

- `python scripts/assets/tests/compact.test.py` with Pillow-enabled Python: all
  five tests passed, including multiple-worker staged retention, deletion,
  exact pixels and idempotence.
- `node --test tests/unit/asset-compaction.test.mjs`: all three tests passed.
- `node --check scripts/assets/compact.mjs`: passed.
- `npm run typecheck`: passed after the blend-mode parity fix.
- `npx playwright test tests/browser/optional-emissive.spec.ts
  tests/browser/zero-emission-parity.spec.ts tests/browser/cached-materials.spec.ts
  tests/browser/cached-material-lighting.spec.ts --config
  playwright.rendering-v2.config.ts`: all four tests passed.
- `npx playwright test --config tmp/asset-compaction/raw-probe.config.ts`: the
  completed conversion subset passed raw WebGL decoded-pixel, alpha and dimension
  checks, including normal/surface and nonzero emissive data. This is a subset
  check, not the final every-plane test or a complete W1 checkpoint.

## Next steps

1. Finish the live staged conversion. Inspect the handle and log before taking any
   action. Then confirm a second staged apply is a no-op.
2. Review the draft full raw-browser check at
   `tmp/asset-compaction/compacted-planes.spec.ts`; it checks every converted plane
   against its saved original, with the goal's exact data/alpha and colour
   tolerances. The temporary subset probe is separate and does not replace it.
3. Commit added WebP outputs and the conversion manifest separately from URL
   migration and generated-PNG deletion. Keep authoring originals.
4. Review draft `tmp/asset-compaction/migrate-urls.py`. Migrate actual URL consumers
   and CSS to WebP, retain authoring provenance keys, use catalog maps for player
   and enemy optional emission, and exclude authoring PNGs from runtime globs.
   Audit dynamic consumers and test request intercepts; update their image
   extensions where needed without changing gameplay assertions or tolerances.
5. Regenerate the catalog through `scripts/pbr/update-runtime-catalog.mjs`, never
   edit the generated catalog directly. The draft handles staged zero-emission
   omissions. Verify focused native/material/asset suites and Canvas comparison.
6. Remove generated PNGs with the final apply in a separate commit. Update pack
   README links and future installation so omissions stay omitted. Verify all
   source authoring files/recipes/provenance survive and placement is unchanged.
7. Complete the W1 broad browser, production and Android web checks; produce
   honest source/bundle/APK byte reports; update inventory, PBR README, rendering,
   AGENTS and handoff; bump patch with "Smaller download" notes. Only then start
   Workstream 2. Its runtime refactor and Workstream 3 lighting remain entirely
   required; neither has started. Final report and final develop push remain.

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
