# Layout-preserving texture compaction

Requires Node.js and Python 3 with Pillow >=12 (`python -m pip install 'Pillow>=12'`).
Set `ISSEN_PYTHON` to a Pillow-enabled interpreter if it is not `python` on PATH.
No network service is used for compaction.

```sh
node scripts/assets/compact.mjs                         # validate and report only
node scripts/assets/compact.mjs --apply --retain-generated-png # staged conversion
node scripts/pbr/update-runtime-catalog.mjs             # after URL migration
node scripts/assets/compact.mjs --apply                 # remove redundant generated PNGs
python scripts/assets/tests/compact.test.py
node --test tests/unit/asset-compaction.test.mjs
```

The tool never resizes, crops, repacks or deletes authoring colour artwork.
Runtime consumers use aligned WebP siblings. Generated scalar maps are removable
only when decoded surface channels match exactly. Missing emissive means zero;
only maps with zero RGB everywhere alpha is positive are omitted. Transparent
hidden colour does not count as emission.

Colour starts at quality 90, then tries 95, 98, 100 and lossless. Every conversion
requires exact alpha, per-channel mean error <=0.5 and maximum error <=8, excluding
fully transparent colour pixels. Data and lossless planes require exact decoded
RGBA, including hidden values. WebP uses method 6 and preserves lossless alpha.
The encoder strips non-pixel metadata without changing the validated data.

The action/hash/encoding/byte manifest is `compaction-manifest.json`. Original
inputs are copied to ignored `tmp/asset-compaction/originals/` before generated
files are removed. A successful second apply performs no writes. For a reviewable
migration, stage WebP outputs while retaining generated PNGs, migrate consumers,
then commit removal separately. Regenerated identical PNGs are removed without
re-encoding existing validated WebP output.

Runtime scope is raster PNG artwork under `src/` and `public/`. Authoring originals
remain available to the generation catalog and are excluded from runtime startup
globs after migration. Store/branding artwork, native Android resources, document
illustrations, build outputs and ignored trials are not conversion inputs.
PBR installation runs validated surface packing, compaction and catalog refresh.

Do not infer GPU memory or performance improvements from encoded byte savings.
Data planes keep their original dimensions; fewer omitted planes reduce uploads.
