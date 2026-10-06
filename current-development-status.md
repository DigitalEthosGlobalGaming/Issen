# Current development status

**Status: paused at the user's request on 6 October 2026.**

The asset pipeline migration is implemented in the working application, but the
overall task is unfinished. This is a checkpoint on `develop`, not a completed
release. Benchmark processes were stopped. Nothing has been pushed or deployed.
The app version is currently **1.66.3**; package, lockfile and title version were
updated together with release notes during implementation.

## Instructions for the next agent

At the next work request, briefly notify the user of this paused work and this
handoff. Do not automatically restart benchmarks or integrate the other worktree.
Proceed with unrelated requests normally. Resume this task when the user asks,
and keep this document current until the outstanding work is completed.

Read [repository guidance](AGENTS.md), the
[implementation and measurement plan](docs/architecture/asset-pipeline-plan.md),
[asset inventory](docs/features/asset-pbr-inventory.md),
[packing instructions](scripts/assets/README.md),
[PBR instructions](scripts/pbr/README.md) and
[performance harness instructions](tests/performance/README.md).
This handoff supersedes older progress statements in the plan.

## User's intended outcome and constraints

- Programmatically and repeatably pack sprites tightly, preserving logical
  coordinates, bounds, pivots and aligned material maps. Do not use image viewing
  to decide packing bounds. No image viewer was used for this work.
- Use stable sprite IDs and reusable dependency groups. Assets can be reused
  across arbitrary scenes and stages. Source scenery families must not impose
  exclusive loading groups or lifetimes. Scene co-use is only a packing hint.
- Pack surface channels as roughness R, metallic G and ambient occlusion B.
- Automatically remove zero-emission images and redundant scalar material maps
  during PBR generation and cached export processing. Preserve exact material
  semantics in metadata; black roughness/AO/normal maps are not interchangeable
  with disabled effects. Keep nonzero emission.
- Measure the before and after behaviour with the existing performance tools,
  separating loading, file size, nominal resource counts and frame timing.
- **After the asset work is completed**, integrate the user's uncommitted changes
  from the existing `codex/lit-rendering-only` worktree into `develop`. That work
  makes lit WebGL the only live gameplay and preview renderer and removes Canvas
  fallbacks and lighting-off controls. It has not been integrated yet.
- Preserve `issen.*` saves. Disposable outputs stay under ignored `tmp/`.

## Implemented at this checkpoint

- `scripts/assets/` extracts authored windows and packs aligned planes
  deterministically using MaxRects, without rotation or mipmaps. Metadata records
  logical/source/storage frames, trim, pivots, dependencies, hashes and loading
  area/byte reports. Generated products cover landmarks, scenery, drift, figures,
  UI and reference assets under `src/rendering/generated/`.
- Shared packed-page stores deduplicate in-flight loads and decoded pages within
  each realm. Leases support overlapping dependency sets, independent previews,
  release, cancellation and failure/retry. Scenes prepare replacement selections
  before releasing old references. A mixed-family A-B-A ownership test passes.
- Live consumers use packed products: environment composition, drift, player and
  enemy parts, equipment, companions, UI symbols, Armoury and material previews.
  Startup preloads only the bootstrap logo. Production verification emitted
  generated runtime pages and the logo, without original gameplay/UI atlas PNGs.
  Original authoring images remain for deterministic regeneration.
- UI uses stable texture tokens and owned Blob URLs. Material previews expose
  336 canonical entries across six domains. UI packed-page failures now reject
  preparation and retry on the next explicit prepare call.
- PBR generation/cache cleanup and installation record omitted constants in
  per-material metadata. Installed cleanup removed 151 redundant images,
  totalling 15,842,537 bytes; eight nonzero emission maps remain. All 86 surface
  maps retained exact decoded pixel hashes through cleanup.
- Performance instrumentation now measures title/UI readiness, first prepared
  use, scene request/readiness/submission, decoded resources in DOM/workers and
  texture API activity. Cold-cache runs disable page cache and explicitly use
  worker `fetch` with `cache: 'no-store'`. Diagnostic contexts are separate from
  headline timing contexts.

The figure owners still acquire broad possible-variant sets. UI scans hidden CSS
rules as well as visible jobs and retains those assets until disposal. Do not
describe current startup as loading only the minimal visible title artwork.
Nominal bitmap/canvas/texture counts are not physical resident GPU memory.

## Verification already observed

- Strict TypeScript/production verification builds passed during implementation.
  Every completed performance build also type-checked. Full final application,
  production and Android web/base-path verification remains outstanding.
- PBR cleanup tests, seven PBR CLI tests, five packing tests, seven packed-store
  tests, packed source-region tests and twelve performance harness/probe tests
  passed in focused runs.
- Numeric browser comparisons passed for all 20 landmarks, 104 scenery windows
  (832 comparisons) and 80 UI cells. Other focused checks covered drift across all
  ten scenes, preview ownership, Armoury/mobile inspection, material previews,
  worker/local parity, and UI page failure/retry/disposal.
- Default GPU-capable full-resolution raster preparation is intentional. An
  experiment using `willReadFrequently: true` in packed bitmap preparation failed
  colour sampling parity and was reverted in both DOM and worker paths. The
  restored scenery test subsequently passed all 832 comparisons. Do not restore
  that experiment without new evidence and sampling checks.

These are focused checks, not a claim that the complete regression suite passed.

## Performance evidence and local artifacts

The pre-change baseline is commit `a3ab436f30ee25e4c85556adb22281a9aada3926` in a
manual detached worktree at `tmp/performance/.before-assets`. That checkout has
the same performance harness and a dependency junction. Its original material
images are intentionally retained for the comparison. Preserve saved reports
before removing that worktree; do not confuse its old black maps with a cleanup
failure in the current source.

Portrait runs used five fresh contexts per workload, 390x844/DPR 2, seed 424242,
Free edition, High density, 3-second warmup, 10-second measurement (30 seconds for
cinematic coverage), and disabled HTTP cache in both page and application worker.

| Run | Local report directory | Outcome |
| --- | --- | --- |
| A1 original, seven workloads | `tmp/performance/.before-assets/tmp/performance/2026-10-06T01-10-03.081Z-fbe7935c` | All 35 timing samples passed |
| B1 packed, cinematic | `tmp/performance/2026-10-06T01-51-38.459Z-8db8e0a4` | All five passed, all ten scenes covered |
| B1 packed, six remaining workloads | `tmp/performance/2026-10-06T01-55-46.915Z-00c4f11c` | All 30 passed |
| B2 packed, cinematic/combat | `tmp/performance/2026-10-06T02-06-37.648Z-b9a32eb8` | All ten passed |
| A2 original, cinematic/combat | `tmp/performance/.before-assets/tmp/performance/2026-10-06T02-12-37.924Z-89eb56d8` | All ten passed |
| A original diagnostics | `tmp/performance/.before-assets/tmp/performance/2026-10-06T02-19-18.609Z-5d26ddfd` | Combat, menu and cinematic diagnostic/texture contexts passed |
| B packed diagnostics | `tmp/performance/2026-10-06T02-23-06.889Z-a92ffc47` | Interrupted at the user's stop; partial captures only, not a passing complete run |

The B1 parts have matching source and instrumentation fingerprints. Their combined
analysis is `tmp/asset-pipeline/b1-comparison.json`. Batch records and logs are in
`tmp/asset-pipeline/comparison-remaining/`; its recorded running state can be stale
because the process tree was stopped. Desktop comparison phases did not start.

The frozen harness fingerprint for these runs is
`7a6827df3ca5ba1181fc0a7dc91fd25c35988bce7e8f84de2e68db23d4b1e79c`.
The packed source fingerprint was
`5f61388989e149173e404e112025de99653a72fbe80a8d5e6b1531fcc52a5f43`.
The harness hashes documentation too, so this checkpoint's new handoff changes
the whole-source fingerprint without changing application behaviour. Preserve
the saved build/manifest identity when reusing measurements.

Initial findings are provisional:

- Packed title requests fell from 250 unique images / 139.1 MB known encoded
  image bodies to 126 / 54.3 MB. These are header-based file measurements, not
  wire traffic or resident memory.
- Cinematic-run complete-title median fell from 7.90 seconds (A1) to 4.80 seconds
  (B1) and 4.92 seconds (B2). Armoury and inspection first use also improved in B1.
- Warm timings varied substantially. Cinematic frame-interval p95 was 20.3 ms
  (A1), 24.6 ms (B1), 28.4 ms (B2) and 26.7 ms (A2). Combat submission median was
  12.2 ms (A1), 14.4 ms (B1), 13.0 ms (B2) and 14.6 ms (A2). The return baseline
  also slowed; do not attribute the early differences solely to the migration or
  claim a reliable frame-rate gain. Complete analysis and investigate uncertainty.
- An earlier packed run at `tmp/performance/2026-10-06T01-26-49.609Z-ecda5dd2`
  failed cinematic coverage. Retain that failure in the record. A separate
  immediate-start diagnostic reached all ten scenes but differed from headline
  warmup conditions; the subsequent five exact repeats passed.
- Earlier reports with page-only cache disabling allowed worker revalidation and
  are diagnostic history, not the final cold-cache baseline. No physical Android
  performance result has been captured.

All paths above are ignored local artifacts, **not included in the commit**.
They may be absent in a fresh checkout. Do not invent their results if missing;
use this recorded checkpoint and rerun the required measurements when resuming.

## Remaining work, in order

1. Inspect preserved A/B diagnostic captures. Complete the interrupted packed
   diagnostics and matched desktop cinematic/combat comparisons. Reuse valid
   baselines and saved builds where possible rather than restarting everything.
   Resolve timing variability and report loading, footprint, allocation/upload
   counters and retention separately. Do not weaken scene coverage or colour
   parity thresholds to produce passing results.
2. Complete asset-pipeline checks: product/source hashes, deterministic packing,
   PBR omission/regeneration, relevant unit/browser suites, full production and
   Android web/base-path checks. Finalize the asset performance assessment.
3. Locate the existing worktree for branch `codex/lit-rendering-only` with
   `git worktree list`, and re-audit its uncommitted changes before integration.
   Last inspected: 29 changed tracked files and an untracked
   `tests/browser/lit-rendering-only.spec.ts`, based on the same pre-change commit.
   Preserve that worktree. Integrate its changes into `develop` only after the
   asset work is complete and the user resumes this task.
4. Resolve integration conflicts while retaining packed loaders, canonical IDs,
   token/Blob-based UI, optional emission, bootstrap-only preloading and lease
   cancellation/retry. Retain incoming mandatory WebGL, removed lighting toggles,
   paused context-loss behaviour and lit gameplay/tutorial/previews.
5. Incoming startup awaits UI preparation but catches errors with a generic
   WebGL message. Distinguish `UiArtworkLoadError` from WebGL initialization
   failures, retain retry, and add an application-level aborted-UI-page/retry
   check. The standalone UI owner retry test is already implemented and passed.
6. Update architecture/rendering/inventory documents for the combined result;
   reconcile version and player-facing release notes. Run final strict, unit,
   browser, production and supported build checks, including WebGL failure/retry,
   context loss/restoration and preview lifecycle coverage.
7. Review every requirement before declaring completion. Remove this paused
   notice or mark the handoff complete only when the remaining work is done.

No further benchmarks, merges, releases, pushes or deployments are authorized by
this checkpoint request. The user will continue the unfinished work later.
