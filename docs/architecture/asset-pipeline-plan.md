# Packed asset pipeline and measurement plan

Status: implementation in progress, 6 October 2026. Automatic PBR omission cleanup
and optional runtime emission are implemented. Deterministic packing and shared
page ownership and live packed-sprite migration are implemented with focused
checks. Comparative performance validation, combined application checks and
lit-only worktree integration remain incomplete.

## Implementation evidence so far

- [Packing tool](../../scripts/assets/README.md): 20 canonical landmarks extracted
  from existing declared windows/anchors. Size-only packing produced two trial pages,
  but increased overfetch for some scenes. Co-use packing now produces five aligned
  runtime pages with 4,442,650 combined pixels versus 7,862,580 in five original sheets
  (43.5% less), after bounded-width candidates were added to packing. These are landmark-plane area
  results, not whole-game memory or speed measurements.
- [Shared page store](../../src/rendering/packed-assets.ts): tested reference
  ownership, overlapping dependency sets, failed preparation and logical offsets.
  Landmark composition now uses packed pages in the local and worker paths;
  overlapping local scenes/previews share decoded pages. Forty programmatic colour
  comparisons cover all twenty landmarks, mirrored placement and contact fades.
  Remaining scenery now resolves 104 declared windows through 29 packed pages.
  Its 832 browser comparisons cover first-use/warmed minification, exact native
  texel placement, mirroring, haze and contact fades. Full-resolution bitmap
  preparation removes encoded-image first-draw sampling differences; cutouts
  retain the original fractional-window raster grid. All comparisons pass the
  original 0.003 rendered-error threshold, with exact native texels.
  Drift rendering now resolves 32 stable IDs through 17 packed pages,
  retaining logical pivots and sharing ownership across independent renderers.
  The runtime now resolves drift dependencies from the current scene mixture and
  weather instead of loading every sprite. Scene readiness waits for scenery and
  drift together; replacement leases retain old pages until ready, and rapid
  cancellation preserves independent previews. Focused checks cover all ten
  scenes and A-B-A selection. The title mixture loads 2,622,753 plane pixels
  versus 18,850,435 for the full packed drift set; this is nominal loading area,
  not resident GPU memory or a frame-rate result.
  The figure store now covers 97 canonical windows in 16 pages: player parts,
  outfits, charms, weapons, enemies, companion parts and mystic rock. Runtime
  companions acquire the 12 rig pieces they use plus rock; the remaining four
  authored windows are available separately for reference/preview use.
  UI material lighting now composes 80 declared windows from 33 aligned pages,
  preserving logical crops, tinting and nine-slice borders. Seals and crests share
  the same decoded page store; browser checks cover overlapping ownership and
  release after the final UI owner. Armoury room previews acquire the same store
  and remap wall/floor crops through logical source metadata. Material previews
  now select 336 canonical entries across six domains, including three
  reference-only legacy sheets. Preview selection shares live pages, cancels
  departed choices and releases its independent lease on disposal. UI now uses
  stable texture tokens; individual symbols select their packed cell directly.
  All 80 UI cells pass programmatic source-window comparisons with exact alpha
  and the existing two-byte opaque-colour tolerance. Blob URLs avoid CSS variable
  limits on large embedded textures and are revoked on replacement/disposal.
  Production verification emits generated pages and the bootstrap logo only;
  original gameplay/UI atlas PNGs are absent from emitted assets.
  Worker/local colour parity permits bounded rasterization differences already
  reproduced with the pre-packing Git renderer: mean under 0.2 byte/channel,
  maximum 32, fewer than 2% changed channels, with exact alpha coverage. The
  landmark source/pixel and surface-value checks remain exact; this tolerance
  applies to final rendered worker/local colour only.
- [PBR pipeline](../../scripts/pbr/README.md): export/cache cleanup, installation
  reconstruction and optional emission catalog/runtime support. Installed cleanup
  removed 151 redundant images (15,842,537 bytes), retaining eight nonzero emission
  maps. Packed surface values are retained.
- The saved production-instrumented baseline needs resampling: its cinematic
  coverage guard failed before all ten scenes completed. Additional
  page/worker bitmap and OffscreenCanvas counters are now implemented and tested.
  A one-second combat integration run passed with nonzero worker counters; this
  checks instrumentation only, not comparative performance. Texture API counters
  now run in an additional independent diagnostic context, with mip reallocation,
  deletion and context-loss unit checks. A short diagnostic capture reported
  per-surface texture activity and zero composition-worker WebGL calls.
  An isolated clean checkout of pre-change commit `a3ab436` is prepared under
  ignored `tmp/` and its instrumentation anchors match. Loading timings and
  frozen before/after comparison runs remain incomplete.
  A full page-cache-disabled run passed 35 samples, but worker revalidation showed
  that it was insufficient for a cold-cache claim. The corrected harness enforces
  worker fetch bypass, verifies that policy and waits for prepared UI jobs before
  marking title submission. Its first full cinematic sample passed; the five-repeat
  baseline and A/B/B/A comparisons are in progress. The earlier run remains
  diagnostic history, not the final cold-cache baseline.

## Objective

Keep editable artwork separate from generated runtime textures. Build tightly
packed, aligned atlas pages with stable sprite metadata and explicit loading
groups. Preserve artwork, placement, lighting, preview ownership
and `issen.*` saves. Measure startup, transition and storage changes against a
new baseline before claiming improvements.

After completing the asset migration, integrate the user's lit-only rendering
work from `codex/lit-rendering-only`, including its current worktree changes.
Resolve conflicts in this branch and validate the combined result. The final
live application and previews require lit WebGL; Canvas/OffscreenCanvas remain
texture-preparation tools. Live Canvas fallbacks and lighting-off controls are
removed by that integration. Earlier Canvas/unlit comparisons are migration
diagnostics rather than a requirement to retain those live paths.

## Current implementation

- [main.ts](../../src/main.ts) preloads only the bootstrap logo. Runtime owners
  prepare their resolved packed dependencies; the owned startup overlay gates
  animation until required artwork is ready and offers retry on failure.
  UI/reference consumers now use packed products. Production verification confirms
  original atlas images are not emitted, apart from the intentional bootstrap logo.
- [asset-material-catalog.ts](../../src/rendering/asset-material-catalog.ts)
  records 86 authoring families for generation and comparison fixtures; it is
  absent from the live import graph. Runtime page ownership belongs to
  [packed-assets.ts](../../src/rendering/packed-assets.ts).
- Roughness, metallic and AO already occupy RGB of `_surface.png`. Runtime packs
  normally decode diffuse, normal, surface and emissive rather than six maps.
- Environment owners select stage assets and retain shared selections. Supported
  browsers compose scenery in a worker and transfer colour/material layers.
- [material.ts](../../src/rendering/pixi/material.ts) rejects rotated/trimmed Pixi
  frames. Composed surface alpha stores material coverage. Existing sprite
  coordinates, pivots, tint caches, CSS slices and worker adapters need migration.

See [inventory](../features/asset-pbr-inventory.md),
[PBR tools](../../scripts/pbr/README.md) and
[previous measurements](../features/pbr-performance-2026-10-05.md).

## Proposed asset contract

Each stable sprite ID identifies its authoring input, logical dimensions, pivot,
trim offset, content rectangle and atlas page. Scene/screen dependency manifests
reference these IDs independently of physical packing. Include
nine-slice borders where needed, optional emission presence, schema version and
content hashes. Distinguish logical source size, cropped pixel size and atlas UV
rectangle; renderer placement must never depend on the current packing layout.

Pack colour, normal and surface planes from one layout. Apply identical crop and
placement transforms to existing maps. Preserve the current normal convention,
colour/data sampling and material coverage semantics. Use deterministic ordering,
bounded pages and sufficient padding/extrusion for filtering. Start with no sprite
rotation and no mipmaps; specify and test padding before adding mipmaps later.
Map padding must follow each plane's semantics, including straight data pixels and
colour alpha. A colour alpha crop must not remove meaningful material content.

Keep roughness in R, metallic in G and AO in B. Source surface alpha remains opaque;
composed-layer alpha remains coverage. No emission channel repacking is planned.

Detect zero emission from decoded pixels: all visible pixels must have zero RGB.
Ignore RGB beneath completely transparent pixels. Validate dimensions and decoding
before classification. Classify per sprite after extraction; pages with no emitting
sprites omit the emission image and manifest entry. Mixed pages retain an aligned
emission plane, with zero emission for nonemitting sprites. Runtime treats missing
emission as zero, does not request/decode/upload a full black map, and uses a shared
tiny neutral texture if the shader binding requires one. Delete zero-emission
generated images rather than retaining unused files. Keep original colour artwork,
material recipes and provenance so maps can be regenerated. Do not assume every
existing map is black. Material preview must also understand optional maps.

Apply redundancy removal automatically in `scripts/pbr`, not as a manual cleanup.
Postprocess newly generated exports and matching cached exports; remove redundant
map images from generated archives and installed folders, recording their absence
and replacement values in metadata. Update archive validation, skip/cache versioning,
installation, surface packing and catalog generation together. Classify final
composed maps as well as preset exports: frame compositions may introduce variation.
An omitted map can be reconstructed transiently from metadata for composition,
without writing a full-size constant image back to disk. Regeneration must also
remove stale redundant installed files. Restrict deletion to validated generated
pack paths and named map files; never delete source artwork or unrelated outputs.

For other PBR maps, remove images only when their meaningful sampled values are
constant and metadata preserves those exact values. Zero roughness means smooth,
zero AO means occluded, and a black normal image is not a neutral normal. Never
interpret all black maps as disabled effects. Replace constant scalar maps with
recorded roughness/metallic/AO values; bake these directly into surface channels
when neighbouring sprites vary. Omit a whole constant surface or normal plane only
after the runtime supports equivalent constants. Preserve varying maps. For normal
maps and packed surfaces, inspect the actual data sampling domain, including edge
padding, rather than using visible colour bounds alone. Diffuse colour/opacity is
outside automatic material-map deletion. Map classification and deletion must be
idempotent and tested with transparent pixels, mixed compositions and missing or
corrupt input. A physically missing map without omission metadata is an error.

## Implementation phases

### 1. Inventory and freeze a baseline

Enumerate actual runtime sprites, hard-coded crops, anchors, UI slices and dynamic
uses. Separate retained/reference art from gameplay assets. Record source/map
dimensions, content bounds, emission classification and current stage/UI usage.
Build a sprite-to-consumer dependency graph, including simultaneous previews and
dynamic variants. Current usage informs packing but does not restrict future reuse.
Report occupied area and total page area separately; transparent pixels compress
well on disk but still occupy decoded texture space.

Extend the existing performance harness with the metrics below before baseline
capture. Freeze that instrumentation for both versions. Save the exact baseline
build, source fingerprint, fixture settings and raw results under ignored `tmp/`.

### 2. Build metadata and packing tools

Implement automatic redundant-map removal in the PBR export/install pipeline,
including migration of existing generated packs once all consumers support the
metadata. Remove files and broken README/catalog references together. Count actual
deleted images and saved encoded bytes in the report; constant channels in a
varying surface atlas do not save atlas pixel area by themselves.

Use the current sheets and installed maps as initial inputs. Extract sprites using
reviewed existing frame definitions; export individual authoring sprites only when
that helps editing. This avoids regenerating PBR maps or changing appearance during
the first migration. Future individual inputs can use per-sprite material presets.

Add a manifest compiler and packer under `scripts/`, integrating the existing PBR
surface-packing tools. Produce aligned atlas planes, generated typed metadata and
a machine-readable packing report. Validate IDs, bounds, dimensions, pivots,
slices, group references, overlap and optional planes. Identical inputs/settings
must produce identical outputs; cache by content/configuration hash.

Use ignored trial output initially. The landmark pilot tracks generated products
under `src/rendering/generated/landmarks`; `assets:build` regenerates them and Vite
validates source/configuration/page hashes. Vite must reference only runtime products,
and authoring inputs must be excluded from broad runtime preloading/bundling.
Normal web/Android builds validate or generate local packed products without
contacting PBR Forge. Expensive material generation stays an explicit authoring step.

### 3. Pilot reuse across scenes

Migrate a small set of sprites from several sparse source sheets, reused across
multiple scenes, through the worker and local paths. Source scenery families are
authoring provenance, not runtime ownership boundaries. Exercise A-to-B-to-A scene
changes with shared and distinct sprites, plus an independent preview retaining
the same pages. Reuse must not create duplicate atlas entries or prematurely
release pages. Measure unused pixels loaded alongside required sprites.
Resolve logical offsets before drawing untrimmed Pixi frame rectangles, rather
than passing Pixi trim metadata into the current material shader. Preserve tint,
fade, flip and transformed-normal behaviour. Compare old/new captures before
expanding to characters, equipment and sliced UI. Keep a reproducible old build
for comparisons, rather than permanently shipping both asset sets.

### 4. Loading groups and shared ownership

Separate logical dependencies from physical storage:

- Scene/screen manifests declare required stable sprite IDs, including dynamic
  choices. They do not own textures or assign sprites exclusively to a stage.
  Resolve dependencies from the selected scenery, actors, equipment and effects;
  compose these lists for each scene instead of selecting one exclusive family.
- A generated catalog resolves each sprite to one canonical atlas entry and its
  aligned map pages. Multiple scenes can reference any reusable sprite.
- The loader resolves a dependency set to unique page IDs and acquires those pages.
  Loading is page-granular: one required sprite can bring neighbouring sprites
  into memory. Report this overhead explicitly.

Keep a minimal bootstrap/logo set and separate incompatible sampling/lifetime
domains such as sliced UI and developer reference art where justified. Within
compatible domains, choose bounded physical pages using sprite size, observed
co-use and measured page-loading overhead. Do not enforce scenery-family or
stage-specific atlas boundaries, and do not put all reusable scenery into one
mandatory global atlas. A page can serve several scenes and a scene can require
several pages. Permit future reuse without repacking or changing sprite identity;
repacking is an independent build optimization, never a scene-authoring requirement.
Validate page limits against supported targets rather than using one giant atlas.

Treat current scene co-use as a packing hint, not a restriction on future reuse.
Family names may describe source provenance, but must not control page ownership,
visibility or lifetime. Evaluate changed scene combinations for page overfetch;
their correctness must not depend on retaining today's family selections.

Loading groups are reusable dependency sets, not atlas containers. A sprite may
belong to any number of groups while retaining one canonical stored entry.
Changing a scene or stage's selection must work with the existing built catalog;
it should not require generating a scene-specific copy of the sprite.

For example, two scenes can both request the same stone sprite while choosing
different trees. Both resolve the stone to the same entry; neither scene owns
or duplicates it. Changing a scene's selection updates its dependency list only.
Include a reuse test that combines sprites from different original scenery
families, so the current stage-to-family selections do not become a hidden limit.

Provide acquire/release ownership for resolved page sets, deduplicated in-flight loads,
decoded-source sharing within each realm and safe cancellation/retry/disposal.
Worker bitmap ownership remains explicit; do not pretend DOM image objects can be
shared directly with a worker. GPU resources remain owned by each renderer surface.

Startup loads the bootstrap and title requirements; a run, screen or scene switch
awaits its resolved pages. During transitions, acquire replacement dependencies
before releasing the departing scene's references so shared pages stay available.
Retain the completed scene until replacement is ready.
Independent previews acquire their own references. Release departed selections
without invalidating another owner. Gate readiness and failure consistently. Start
without speculative prefetch so it cannot mask the baseline comparison; evaluate
bounded prefetch only as a separate later change.

### 5. Complete migration and validation

Replace numeric sheet/crop references with stable IDs across figures, outfits,
weapons, companions, charms, debris, scenery, UI and material preview. Remove old
runtime URL references and broad authoring-image retention once all consumers are
migrated. Confirm originals are absent from shipped bundles, not just unrequested.

Run strict TypeScript, meaningful packer/metadata tests and focused browser tests
for artwork loading, aligned materials, caches, UI slices, independent previews,
worker/local parity, retries, disposal and rapid/inactive transitions. Cover all
nine stages plus Demon, representative equipment and mirrored/tinted figures.
Validate alpha, anchors and fixed-lighting visual comparisons. Surface scalar
packing and extracted source pixels should remain exact; rendered edges may need
a documented tolerance due to filtering. Run broader browser/production and
Android web/base-path checks once shared loading is migrated. Production tests
already build/type-check. Update inventory, loading/rendering docs, synchronized
version metadata and player-facing changelog when implementation lands.

## Before-and-after measurements

Reuse [tests/performance](../../tests/performance/README.md); do not introduce a
second whole-game benchmark. Add instrumentation first and keep the same harness
fingerprint throughout A/B runs. Instrumentation must remain absent from shipping
builds. Keep timing and allocation/CPU/trace diagnostics in separate contexts.

| Measure           | Capture and interpretation                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Asset footprint   | Encoded bytes, atlas page count, total pixels, occupied area, optional maps omitted and unique page bytes per dependency set. Report required sprite area versus loaded page area and cross-scene shared-page reuse.                                                                        |
| Loading           | Requested image count/bytes, decode count, group preparation duration, navigation-to-artwork-ready and navigation-to-first-complete-title. Test both fresh-context and repeated warm loads; explicitly disable browser cache for a separate cold HTTP-cache case.                           |
| First use         | Initial combat readiness; first Armoury/inspection readiness; request-to-displayed-composition for each of nine stages and Demon. Record transition latency as well as frame intervals, since retained scenery can hide waiting time.                                                       |
| Frame behaviour   | Frame-interval p50/p95 and maximum, long tasks, main-thread submission/task time, and separately observed worker preparation time. Do not add overlapping worker/main durations as wall-clock latency.                                                                                      |
| Texture lifecycle | Unique decoded page pixels and created/released bitmap/canvas pixels by realm; texture allocation/upload-event counts and nominal bytes by surface. Track reuse across title, menus, scene loops and disposal. These are estimates/counters, not resident GPU memory or GPU execution time. |
| Retention         | Existing eight-cycle menu experiment plus repeated scene loops and overlapping previews; report plateau, active dependency/page references, shared-page reuse and resource release. Forced GC stays outside headline timing runs.                                                           |

The resource probe now includes application worker OffscreenCanvas/ImageBitmap
accounting. Apply the same instrumentation to both isolated versions before the
baseline so they have equivalent coverage. Use separate diagnostic traces to investigate upload-related stalls;
elapsed upload-call time does not establish physical GPU execution duration.

Use fixed seed 424242, Free edition, High density, identical viewport/DPR, lighting,
browser, target and instrumentation. Begin with portrait 390x844/DPR 2 and repeat
the key scenarios at desktop geometry. Use five fresh contexts per scenario,
3-second warmup and 10-second measurements for comparative runs. Loading timings
start before warmup. For stage readiness, require every requested scene to finish
and record each latency; do not compare only total transitions completed in a
fixed window. Cover combat, Armoury, inspection, real cinematic transitions,
menu retention and inactive/resume guards. Preserve individual samples and medians.

Existing runner commands after the instrumentation is frozen:

```sh
npm run test-performance -- --scenario=combat,armoury,inspection,cinematic-transitions,menu-cycles --duration=10000
npm run test-performance -- --scenario=combat,armoury,inspection,cinematic-transitions,menu-cycles --duration=10000 --compare=tmp/performance/<passing-baseline>
```

Repeat important comparisons in A/B/B/A order from isolated source snapshots,
sequentially on the same machine/settings. Investigate variability before claiming
a gain. Historical reports provide context but are not the new baseline. Physical
Android/WebView measurements require the existing dedicated performance app;
desktop or emulator results must not be labelled phone measurements.

## Acceptance and decisions

- Exact metadata/plane alignment, stable visual placement and no gameplay/save
  change are mandatory. All loading ownership and disposal checks must pass.
- Reused sprites have one canonical packed entry. Overlapping scenes/previews
  retain shared pages safely; transitions do not redownload/redecode retained pages
  within an owner realm. Validate both reuse-heavy and low-overlap scene sequences.
- Initial engineering targets: at least 25% fewer nominal decoded atlas bytes in
  representative active groups and 15% lower median cold startup or first-use
  latency. These are provisional targets, not predictions; revisit after the
  inventory/baseline if the remaining waste is smaller or composition dominates.
- No reproducible regression above 5% in median warm rendering submission time or
  frame-interval p95 across key workloads. Repeat noisy comparisons; a single
  maximum interval or small delta is not an automatic gate. Startup savings must
  not simply become unacceptable first-screen/scene delays.
- Zero-emission generated images must be absent from retained generated archives,
  installed asset folders and shipped builds, with zero full-size map requests.
  Redundant scalar maps must be absent wherever exact metadata/packed channels
  replace them. Regeneration and cache reuse must not reintroduce removed images.
  All required group pages must be present in web and Android builds.
- Report disk, decoded/nominal GPU storage, latency and frame timing separately.
  A smaller download is not evidence of lower resident GPU memory or fewer draws.

The first reviewable milestone is the dependency inventory, frozen baseline and
a packed subset reused across several scenes and an independent preview. Use
that evidence to settle page sizes and loading policies before
migrating every asset. Compression formats, reduced map resolution, material mesh
batching and speculative prefetch are deferred so this comparison isolates packing
and loading changes.
