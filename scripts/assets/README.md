# Deterministic sprite packing

`pack.py` packs declared sprite windows and aligned material maps without image
viewing or connected-component guesses. Requires Python 3 and Pillow. It preserves
every nonzero colour-alpha pixel, logical dimensions, source window and pivot;
trim offsets determine placement independently of atlas storage. Padding is
extruded identically across planes. Rotation and mipmaps are disabled initially.

Extraction reads authoritative landmark, scenery and drift windows and anchors
from TypeScript and records their reuse across stages. It does not assign sprites
to exclusive scene atlases.

```powershell
node scripts/assets/landmark-spec.mjs
python scripts/assets/pack.py --input tmp/asset-pipeline/landmarks.json --output tmp/asset-pipeline/landmarks --size 2048
python tests/unit/asset-packing.test.py
node --test tests/unit/packed-assets.test.mjs
npm run assets:build
npm run assets:check
```

Inputs use schema version 1, a `sprites` array and `dependencies` mapping consumer
names to stable IDs. Each sprite declares `id`, finite numeric `frame` (`x,y,width,height`),
optional frame-local `pivot` and repository-relative `maps` (`colour`, optionally
`normal`, `surface`, `emissive`). Map dimensions must agree. Optional `slice` is
preserved. Fractional crop windows retain their original coordinates and dimensions:
integer storage envelopes preserve source texels while fractional sample rectangles
preserve half-pixel grid boundaries. Browser sampling parity remains a migration check.

Outputs are aligned PNG pages and a manifest with logical size, trim offset, pivot,
storage rectangle, page index, available planes, dependencies and source/page hashes.
The manifest's `loadingReport` records required sprite plane area versus loaded
page plane area, image count and encoded bytes for each dependency set.
Black emission produces no stored image. Regeneration removes previously declared
page images that are no longer used. Existing authoring input files are protected
from output overwrite/deletion. Output must stay within the repository.

Tracked products live under `src/rendering/generated/{landmarks,scenery,drift,figures,ui,reference}`.
`assets:build` extracts the specification and regenerates pages; set `PBR_PYTHON`
when the Pillow-enabled Python is not on PATH. Web/Android builds and development
startup validate source/configuration and page hashes, failing on stale products.
They require no Python or external material generation when products are current.

Packing uses deterministic MaxRects subdivision with no rotation. Optional
`packingGroups` name observed consumer dependencies. The packer seeds clusters by
co-use and merges only when aggregate loaded page area improves; group membership
does not restrict future scene reuse. `configurationSources` adds compiler and
frame-definition inputs to the source hashes. It checks source
windows and verifies packed content pixels exactly. Tests check nonoverlap and
repeatability, faint alpha, reconstruction, shared IDs and omitted emission.

`src/rendering/packed-assets.ts` provides reference-counted decoded pages and
logical placement helpers. Landmark and scenery composition use shared stores
within each document/worker realm; drift renderers share a document store.
Live drift selections include the scene's possible mixture IDs plus required
weather embers. Transitions prepare replacement dependencies before releasing
active pages, support cancellation/retry, and leave independent preview leases
intact. Consumers can still request any mixed ID set or the complete catalog.
They support overlapping scenes/previews, deduplicated loads, preparation failures
and disposal. The figure store serves player/enemy parts, outfit attachments,
charms, weapons and companions. UI material lighting reconstructs logical source
windows from packed regions without rebuilding full material maps. Seals and
crests acquire just their declared IDs and share pages with CSS lighting. Cropped
regions preserve trim offsets and sample all material planes together. Original
UI uses stable tokens instead of source URLs. Individual symbols select a
canonical cell; CSS borders retain their authored slices through token aliases.
Lit CSS textures use owned blob URLs, revoked on replacement/disposal, avoiding
CSS variable limits on large data URLs. All 80 UI cells have numeric source-window
comparisons. The authoring material catalog is excluded from the live import graph. The material preview
selects individual stable IDs across all stores and owns a separate lease; three
legacy sheets with no live sprite entries have reference-only packed products.
Reference extraction runs after the five live domains and includes their
manifests in its configuration hashes.
Bootstrap preloading retains only the logo; runtime owners prepare their own
dependency sets and gate first rendering on readiness.

DOM page preparation rasterizes encoded PNGs once at their declared resolution,
then creates an owned bitmap and clears the temporary canvas. Workers perform the
equivalent operation with OffscreenCanvas. This avoids first-use decoder sampling
differences when drawing small crops. Fractional logical windows retain their
original ceil-to-canvas grid in atmospheric cutouts; colour and material sampling
rectangles are adjusted together within the extruded border.

See [implementation and measurement plan](../../docs/architecture/asset-pipeline-plan.md).
