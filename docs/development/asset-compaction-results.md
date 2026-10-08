# Layout-preserving asset compaction results

Workstream 1 of `main-goal.md`. Restore point: `pre-refactor` (`ad353b3`).
This report records asset evidence; the full runtime/lighting refactor is ongoing.

## Changes and invariants

688 runtime PNG inputs: 86 authoring sources and 602 generated planes. All 86
families have exact surface/scalar equality. Removed 258 scalar and 78 zero-emission
maps, then replaced 266 retained generated planes and 86 source-runtime siblings.
All 86 authoring PNG hashes, recipes and provenance remain. Runtime globs and
explicit URLs use the compact siblings; source keys remain authoring paths.

The 352 conversions preserve dimensions/alpha; all 180 data planes decode exactly.
Colour mean error is at most 0.5 per channel and maximum 8, ignoring fully
transparent pixels. Eleven small colour assets use exact recompressed PNG because
tolerance-valid WebP was larger. Every runtime sibling is smaller. No resizing,
repacking, atlas-coordinate, anchor, pivot or nine-slice changes were made.
No missing-emissive or scalar-file request is required. Optional-emission caches
retain explicit-zero blend/coverage semantics. Final repeated apply is a no-op.

## Matched byte evidence

All values are bytes. Production/Android builds come from unchanged `pre-refactor`
and compact develop, using the same installed dependencies and build settings.
Fresh verification output is under ignored tmp; existing dist/store outputs stay
untouched. Metadata and application chunks account for bundle/image differences.

| Scope | Before | After |
| --- | ---: | ---: |
| Runtime PNG/compact plane set | 266,530,086 | 120,472,123 |
| Checked texture tree, including retained authoring PNGs | 266,530,086 | 181,824,601 |
| Production verification bundle | 261,053,490 | 120,506,570 |
| Production/Android image bytes | 258,901,059 | 118,716,745 |
| Android web verification bundle | 284,964,042 | 144,390,034 |
| Unsigned APK-container ZIP projection | 295,487,341 | 158,550,091 |

The source table excludes out-of-scope native/branding/store artwork. Authoring
PNG preservation adds 61,352,478 bytes to the checked texture tree. Build totals
describe disk/download bytes, not decoded dimensions or GPU memory. GPU residency
falls only where omitted planes are no longer uploaded; the remaining atlas
dimensions and decoded pixel storage are unchanged.

APK values are estimates from identical frozen existing debug native ZIP entries,
with matched fresh Android web assets deflated at level 6 and signatures omitted.
These are neither native APK builds nor installable signed APKs. No store/release
build was triggered. The native-shell hash, per-scope totals and projection method
are recorded in ignored `tmp/asset-compaction/byte-results.json`; recomputation
uses the ignored `byte-report.py` and the restore-point checkout.

## Verification

- Six Python compaction tests: exact data/alpha, PNG metadata and pixel preservation,
  threaded idempotence, mismatch retention, optional emission, future regeneration.
- Ten Node loader/catalog/provenance/exporter utility cases and all 252 units passed.
- Strict TypeScript passed; all 352 raw-browser conversion comparisons passed.
- The ten-file focused rendering/material/asset command passed 34 cases, including
  Canvas comparison, context restoration and missing-emission weapon readiness.
- Production build/typecheck and all four production browser tests passed.
- Android web: four cases passed; encounter reload fails with the original assertion
  on both compact develop and untouched pre-refactor. This proven pre-existing
  failure remains recorded; no test/tolerance was skipped or relaxed.
- All 266 runtime-plane README links exist; a second refresh changes zero files.
- Broad rendering workstream gate passed all 245 cases in one uninterrupted run.
- Final version 1.66.8 production build/typecheck and four production tests passed;
  the release-note indicator browser check passed. Android remained four passing
  cases and the proven pre-existing recovery failure. Exact commands/logs are in
  the status handoff. W1 is complete; W2, W3 and final goal verification remain.

## Future oversized-map review (no downscaling performed)

Normal/surface dimensions remain identical to diffuse for all 86 families. Review
the 1254-square character/outfit/headwear/weapon atlases against their normal small
combat crops and their much larger Armoury views. Review 1774-by-887 environmental
and drift sheets against layered scenery and individual debris footprints; inspect
the 1254-square UI atlases against CSS slices and DPI scaling. Standalone 128-square
crest and 192-square material maps may exceed some menu footprints, but their
largest preview usage must be considered before reducing resolution.

Any future map resizing must preserve alignment or introduce explicit sampling
metadata, and compare the largest on-screen crop at device DPI. This work gathered
no CPU/GPU/memory profiles and makes no decode-speed claim. Optional captures can
compare cold-start decode time, material upload counts and residency before/after.
GPU-compressed formats are future work only after existing image composition can
support them. Tight repacking remains cancelled.
